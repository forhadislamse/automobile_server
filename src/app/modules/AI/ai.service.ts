import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import { AIToolType, AI_TOOLS, EUROPEAN_BRANDS } from './ai.constants';
import { validateAIToolAccess, callAI, getAllowedToolsForPlanCategory, getLockedToolsForPlanCategory } from './ai.utils';
import { getPersonaConfig } from './ai.config';
import { TechnicianServices } from '../technician/technician.service';

const processAIRequest = async (userId: string, toolType: AIToolType, prompt: string) => {
  // 1. Detect if it's a European Vehicle for automatic routing
  let effectiveTool = toolType;
  const isEuropeanBrand = prompt ? EUROPEAN_BRANDS.some(brand => {
    const regex = new RegExp(`\\b${brand.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(prompt);
  }) : false;

  if (isEuropeanBrand && toolType !== AI_TOOLS.EUROPEAN_SPECIALIST) {
    console.log(`[AI ROUTING] European brand detected. Routing to European Specialist.`);
    effectiveTool = AI_TOOLS.EUROPEAN_SPECIALIST;
  }

  // 2. Validate Access for the effective tool and get plan details
  const validation = await validateAIToolAccess(userId, effectiveTool as string);
  const planSubscription = validation.planSubscription;
  const planName = planSubscription.plan.name;
  const allowedTools = getAllowedToolsForPlanCategory(planSubscription.plan.category);

  // 3. Generate System Prompt from Master Config
  const personaConfig = getPersonaConfig(effectiveTool);
  const toolNames = allowedTools.join(', ');
  const lockedTools = getLockedToolsForPlanCategory(planSubscription.plan.category);

  const lockedToolsText = lockedTools.length > 0
    ? `- Locked Tools (Upgrade Required): ${lockedTools.join(', ')}\n- CRITICAL INSTRUCTION: If the user's request involves any topic in this "Locked Tools" list, you are FORBIDDEN from giving any diagnostic advice. You must IDENTIFY which specialized tool is needed and explain that it requires a higher plan (Professional or European).`
    : '- All professional tools are unlocked in this plan.';

  const systemPrompt = `
${personaConfig.instructions}

CURRENT CONTEXT:
- Shop Subscription Plan: "${planName}"
- Available Tools in this plan: ${toolNames}
${lockedToolsText}

POLICIES:
- If a European vehicle is detected and the "European Specialist" tool is locked, you must refuse the diagnostic and suggest an upgrade.
- If an Electrical or Transmission issue is detected and those tools are locked, you must refuse the diagnostic and suggest an upgrade.
  `.trim();

  // 4. Handle Locked Tool (Short-circuit without calling OpenAI)
  if (!validation.hasAccess) {
    return {
      tool: effectiveTool,
      isRoutedToEuropean: isEuropeanBrand,
      status: 'locked',
      planContext: {
        currentPlan: planName,
        availableTools: allowedTools
      },
      data: {
        result: validation.message,
        timestamp: new Date()
      }
    };
  }

  // 5. AI Logic (Normal Flow)
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
  const isEuropeanBrand = payload.prompt ? EUROPEAN_BRANDS.some(brand => {
    const regex = new RegExp(`\\b${brand.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(payload.prompt!);
  }) : false;

  if (isEuropeanBrand && payload.persona !== AI_TOOLS.EUROPEAN_SPECIALIST) {
    console.log(`[AI ROUTING] European brand detected in New Chat. Routing to European Specialist.`);
    effectivePersona = AI_TOOLS.EUROPEAN_SPECIALIST;
  }

  // 2. Validate Access for the effective persona
  const validation = await validateAIToolAccess(userId, effectivePersona);
  const planSubscription = validation.planSubscription;
  const planName = planSubscription.plan.name;
  const allowedTools = getAllowedToolsForPlanCategory(planSubscription.plan.category);

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

  // 4. Create Chat Session and also a Diagnostic record for the dashboard
  const session = await prisma.chatSession.create({
    data: {
      userId,
      ownerId,
      persona: effectivePersona,
      title: aiTitle.length > 50 ? aiTitle.substring(0, 47) + '...' : aiTitle
    }
  });

  // Keep Dashboard in sync (Creates Diagnostic record and increments totalSessions)
  await TechnicianServices.createDiagnostic(userId, ownerId, { persona: effectivePersona });

  // 5. Save the initial user message (including image if present)
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt ? payload.prompt : "[Image Shared]",
      image: payload.image
    }
  });

  // 6. Handle Locked Tool (Return Simulated AI Response in Chat)
  if (!validation.hasAccess) {
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: validation.message as string
      }
    });

    return { session, assistantMessage, status: 'locked' };
  }

  // 7. Generate System Prompt from Master Config (Normal Flow)
  const personaConfig = getPersonaConfig(effectivePersona);
  const toolNames = allowedTools.join(', ');
  const lockedTools = getLockedToolsForPlanCategory(planSubscription.plan.category);

  const lockedToolsText = lockedTools.length > 0
    ? `- Locked Tools (Upgrade Required): ${lockedTools.join(', ')}\n- CRITICAL INSTRUCTION: If the user's request involves any topic in this "Locked Tools" list, you are FORBIDDEN from giving any diagnostic advice. You must IDENTIFY which specialized tool is needed and explain that it requires a higher plan (Professional or European).`
    : '- All professional tools are unlocked in this plan.';

  const systemPrompt = `
${personaConfig.instructions}

CURRENT CONTEXT:
- Shop Subscription Plan: "${planName}"
- Available Tools in this plan: ${toolNames}
${lockedToolsText}

POLICIES:
- If a European vehicle is detected and the "European Specialist" tool is locked, you must refuse the diagnostic and suggest an upgrade.
- If an Electrical or Transmission issue is detected and those tools are locked, you must refuse the diagnostic and suggest an upgrade.
  `.trim();

  // 8. Get AI Response (Normal Flow)
  const resultText = await callAI(systemPrompt, finalPrompt, payload.image, personaConfig.model);

  // 9. Save AI response message
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: resultText
    }
  });

  return { session, assistantMessage, status: 'success' };
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
  const isEuropeanBrand = payload.prompt ? EUROPEAN_BRANDS.some(brand => {
    const regex = new RegExp(`\\b${brand.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return regex.test(payload.prompt!);
  }) : false;

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
  const validation = await validateAIToolAccess(userId, currentPersona as AIToolType);
  const planSubscription = validation.planSubscription;
  const planName = planSubscription.plan.name;
  const allowedTools = getAllowedToolsForPlanCategory(planSubscription.plan.category);

  // 3. Generate System Prompt from Master Config
  const personaConfig = getPersonaConfig(currentPersona);
  const toolNames = allowedTools.join(', ');
  const lockedTools = getLockedToolsForPlanCategory(planSubscription.plan.category);

  const lockedToolsText = lockedTools.length > 0
    ? `- Locked Tools (Upgrade Required): ${lockedTools.join(', ')}\n- CRITICAL INSTRUCTION: If the user's request involves any topic in this "Locked Tools" list, you are FORBIDDEN from giving any diagnostic advice. You must IDENTIFY which specialized tool is needed and explain that it requires a higher plan (Professional or European).`
    : '- All professional tools are unlocked in this plan.';

  const systemPrompt = `
${personaConfig.instructions}

CURRENT CONTEXT:
- Shop Subscription Plan: "${planName}"
- Available Tools in this plan: ${toolNames}
${lockedToolsText}

POLICIES:
- If a European vehicle is detected and the "European Specialist" tool is locked, you must refuse the diagnostic and suggest an upgrade.
- If an Electrical or Transmission issue is detected and those tools are locked, you must refuse the diagnostic and suggest an upgrade.
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
