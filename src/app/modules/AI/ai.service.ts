import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import { AIToolType, AI_TOOLS, AI_ACCESS_MAP, EUROPEAN_BRANDS } from './ai.constants';
import { validateAIToolAccess, callAI } from './ai.utils';

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
  const subscription = await validateAIToolAccess(userId, effectiveTool);
  const planName = subscription.plan.name;
  const allowedTools = AI_ACCESS_MAP[subscription.plan.category];

  // 3. Generate System Prompt (Plan Aware)
  const toolNames = allowedTools.join(', ');
  
  const systemPrompt = `
    You are ${effectiveTool}, the central AI assistant for an automotive repair shop. 
    The current shop is on the "${planName}". 
    The specialized AI tools available for this plan are: ${toolNames}.
    ${isEuropeanBrand ? 'Note: A European vehicle has been identified. Apply specialized European diagnostic knowledge.' : ''}
    If a user asks for advanced diagnostics that are NOT in the list above, 
    provide a basic helpful response but politely explain that they can get much more advanced, 
    specialized AI assistance by upgrading their plan.
  `.trim();

  // 4. AI Logic (Placeholder)
  const resultText = await callAI(systemPrompt, prompt);

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
  // 1. Validate Access
  const subscription = await validateAIToolAccess(userId, payload.persona as AIToolType);
  const planName = subscription.plan.name;
  const allowedTools = AI_ACCESS_MAP[subscription.plan.category];

  if (!payload.prompt && !payload.image) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide either a prompt or an image');
  }

  const finalPrompt = payload.prompt || "Please analyze this vehicle image and provide diagnostic feedback.";
  let aiTitle = "Image Diagnostic Session";

  // 2. Generate a concise AI Title for the session if prompt exists
  if (payload.prompt) {
    const titleSystemPrompt = `You are a helpful assistant. Summarize the user's vehicle diagnostic request into a 3-5 word professional chat title. Output ONLY the title text. Example: "BMW Brake Sensor Issue" or "Engine Noise Analysis".`;
    aiTitle = await callAI(titleSystemPrompt, payload.prompt);
  }

  // 3. Create the session
  const session = await prisma.chatSession.create({
    data: {
      userId,
      ownerId,
      persona: payload.persona,
      title: aiTitle.length > 50 ? aiTitle.substring(0, 47) + '...' : aiTitle
    }
  });

  // 3. Create a Diagnostic record (for dashboard stats)
  await prisma.diagnostic.create({
    data: {
      technicianId: userId,
      ownerId: ownerId,
      persona: payload.persona
    }
  });

  // 4. Save the initial user message (including image if present)
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt ? payload.prompt : "[Image Shared]",
      image: payload.image
    }
  });

  // 5. Generate System Prompt
  const toolNames = allowedTools.join(', ');
  const systemPrompt = `
    You are ${payload.persona}, the central AI assistant for an automotive repair shop. 
    The current shop is on the "${planName}". 
    The specialized AI tools available for this plan are: ${toolNames}.
    Always use helpful icons/emojis in your response. 
    If a vehicle image is analyzed, provide specific visual feedback.
    Always provide clear "How to Solve" steps.
  `.trim();

  // 6. Get AI Response
  const resultText = await callAI(systemPrompt, finalPrompt, payload.image);

  // 7. Save AI response message
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

  const finalPrompt = payload.prompt || "Please analyze this image and provide diagnostic feedback.";

  // 1. Save user message
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt ? payload.prompt : "[Image Shared]",
      image: payload.image
    }
  });

  // 2. Validate Access for the persona in this session
  const subscription = await validateAIToolAccess(userId, session.persona as AIToolType);
  const planName = subscription.plan.name;
  const allowedTools = AI_ACCESS_MAP[subscription.plan.category];

  // 3. Generate System Prompt
  const toolNames = allowedTools.join(', ');
  const systemPrompt = `
    You are ${session.persona}, the central AI assistant for an automotive repair shop. 
    The current shop is on the "${planName}". 
    The specialized AI tools available for this plan are: ${toolNames}.
    Always use helpful icons/emojis in your response.
    Always provide clear "How to Solve" steps.
  `.trim();

  // 4. Get AI Response
  const resultText = await callAI(systemPrompt, finalPrompt, payload.image);

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
