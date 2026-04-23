import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import { AIToolType, AI_TOOLS, EUROPEAN_BRANDS } from './ai.constants';
import { validateAIToolAccess, callAI, getAllowedToolsForPlanCategory } from './ai.utils';
import { getPersonaConfig } from './ai.config';

const processAIRequest = async (userId: string, toolType: AIToolType, prompt: string) => {
  // 1. Detect if it's a European Vehicle for automatic routing
  let effectiveTool = toolType;
  const lowercasePrompt = prompt.toLowerCase();
  const isEuropeanBrand = EUROPEAN_BRANDS.some(brand => 
    lowercasePrompt.includes(brand.toLowerCase())
  );

  if (isEuropeanBrand && toolType !== AI_TOOLS.EUROPEAN_SPECIALIST) {
    console.log(`[AI ROUTING] European brand detected. Routing to European Specialist.`);
    effectiveTool = AI_TOOLS.EUROPEAN_SPECIALIST;
  }

  // 2. Validate Access for the effective tool and get plan details
  const subscription = await validateAIToolAccess(userId, effectiveTool as string);
  const planName = subscription.plan.name;
  const allowedTools = getAllowedToolsForPlanCategory(subscription.plan.category);

  // 3. Generate System Prompt from Master Config
  const personaConfig = getPersonaConfig(effectiveTool);
  const toolNames = allowedTools.join(', ');
  
  const systemPrompt = `
${personaConfig.instructions}

CURRENT CONTEXT:
- Shop Subscription Plan: "${planName}"
- Available Tools in this plan: ${toolNames}
${isEuropeanBrand ? '- ACTION: A European vehicle has been identified. Apply specialized European diagnostic knowledge.' : ''}
  `.trim();

  // 4. AI Logic
  const resultText = await callAI(systemPrompt, prompt, undefined, personaConfig.model);

  return {
    tool: effectiveTool,
    isRoutedToEuropean: isEuropeanBrand,
    status: 'success',
    planContext: {
      currentPlan: planName,
      availableTools: allowedTools
    },
    data: {
      result: resultText,
      timestamp: new Date()
    }
  };
};

const startNewChat = async (userId: string, ownerId: string, payload: { persona: string, prompt?: string, image?: string }) => {
  // 1. Detect if it's a European Vehicle for automatic routing
  let effectivePersona = payload.persona;
  const isEuropeanBrand = payload.prompt ? EUROPEAN_BRANDS.some(brand => 
    payload.prompt?.toLowerCase().includes(brand.toLowerCase())
  ) : false;

  if (isEuropeanBrand && payload.persona !== AI_TOOLS.EUROPEAN_SPECIALIST) {
    console.log(`[AI ROUTING] European brand detected in New Chat. Routing to European Specialist.`);
    effectivePersona = AI_TOOLS.EUROPEAN_SPECIALIST;
  }

  // 2. Validate Access for the effective persona
  const subscription = await validateAIToolAccess(userId, effectivePersona);
  const planName = subscription.plan.name;
  const allowedTools = getAllowedToolsForPlanCategory(subscription.plan.category);

  if (!payload.prompt && !payload.image) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide either a prompt or an image');
  }

  const finalPrompt = payload.prompt || "Please analyze this vehicle image and provide diagnostic feedback.";
  let aiTitle = "Image Diagnostic Session";

  // 3. Generate a concise AI Title for the session if prompt exists
  if (payload.prompt) {
    const titleSystemPrompt = `You are a helpful assistant. Summarize the user's vehicle diagnostic request into a 3-5 word professional chat title. Output ONLY the title text. Example: "BMW Brake Sensor Issue" or "Engine Noise Analysis".`;
    aiTitle = await callAI(titleSystemPrompt, payload.prompt);
  }

  // 4. Create the session
  const session = await prisma.chatSession.create({
    data: {
      userId,
      ownerId,
      persona: effectivePersona,
      title: aiTitle.length > 50 ? aiTitle.substring(0, 47) + '...' : aiTitle
    }
  });

  // 5. Create a Diagnostic record (for dashboard stats)
  await prisma.diagnostic.create({
    data: {
      technicianId: userId,
      ownerId: ownerId,
      persona: effectivePersona
    }
  });

  // 6. Save the initial user message (including image if present)
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt ? payload.prompt : "[Image Shared]",
      image: payload.image
    }
  });

  // 7. Generate System Prompt from Master Config
  const personaConfig = getPersonaConfig(effectivePersona);
  const toolNames = allowedTools.join(', ');
  
  const systemPrompt = `
${personaConfig.instructions}

CURRENT CONTEXT:
- Shop Subscription Plan: "${planName}"
- Available Tools in this plan: ${toolNames}
${isEuropeanBrand ? '- ACTION: A European vehicle has been identified. Apply specialized European diagnostic knowledge.' : ''}
  `.trim();

  // 8. Get AI Response
  const resultText = await callAI(systemPrompt, finalPrompt, payload.image, personaConfig.model);

  // 9. Save AI response message
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: resultText
    }
  });

  return { session, assistantMessage };
};

const sendMessage = async (userId: string, payload: { sessionId: string, prompt?: string, image?: string }) => {
  // 1. Validate that at least one input is provided
  if (!payload.prompt && !payload.image) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide either a prompt or an image');
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: payload.sessionId }
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat session not found');
  }

  // 2. Detect if it's a European Vehicle for automatic routing
  let currentPersona = session.persona;
  const isEuropeanBrand = payload.prompt ? EUROPEAN_BRANDS.some(brand => 
    payload.prompt?.toLowerCase().includes(brand.toLowerCase())
  ) : false;

  if (isEuropeanBrand && session.persona !== AI_TOOLS.EUROPEAN_SPECIALIST) {
    console.log(`[AI ROUTING] European brand detected in message. Routing to European Specialist.`);
    currentPersona = AI_TOOLS.EUROPEAN_SPECIALIST;
    
    // Update session persona to European Specialist for future messages
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { persona: AI_TOOLS.EUROPEAN_SPECIALIST }
    });
  }

  const finalPrompt = payload.prompt || "Please analyze this image and provide diagnostic feedback.";

  // 3. Save user message
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt ? payload.prompt : "[Image Shared]",
      image: payload.image
    }
  });

  // 4. Validate Access for the persona in this session
  const subscription = await validateAIToolAccess(userId, currentPersona as AIToolType);
  const planName = subscription.plan.name;
  const allowedTools = getAllowedToolsForPlanCategory(subscription.plan.category);

  // 3. Generate System Prompt from Master Config
  const personaConfig = getPersonaConfig(currentPersona);
  const toolNames = allowedTools.join(', ');
  
  const systemPrompt = `
${personaConfig.instructions}

CURRENT CONTEXT:
- Shop Subscription Plan: "${planName}"
- Available Tools in this plan: ${toolNames}
${isEuropeanBrand ? '- ACTION: A European vehicle has been identified. Apply specialized European diagnostic knowledge.' : ''}
  `.trim();

  // 4. Get AI Response
  const resultText = await callAI(systemPrompt, finalPrompt, payload.image, personaConfig.model);

  // 5. Save assistant message
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: resultText
    }
  });

  return assistantMessage;
};

const getMyChatSessions = async (userId: string, searchTerm?: string) => {
  const where: any = { userId };

  if (searchTerm) {
    where.OR = [
      {
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        messages: {
          some: {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
      },
    ];
  }

  return await prisma.chatSession.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });
};

const getChatMessages = async (sessionId: string) => {
  return await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }
  });
};

export const AIServices = {
  processAIRequest,
  startNewChat,
  sendMessage,
  getMyChatSessions,
  getChatMessages
};
