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

const startNewChat = async (userId: string, ownerId: string, payload: { persona: string, prompt: string }) => {
  // 1. Validate Access
  const subscription = await validateAIToolAccess(userId, payload.persona as AIToolType);
  const planName = subscription.plan.name;
  const allowedTools = AI_ACCESS_MAP[subscription.plan.category];

  // 2. Create the session
  const session = await prisma.chatSession.create({
    data: {
      userId,
      ownerId,
      persona: payload.persona,
      title: payload.prompt.substring(0, 40) + (payload.prompt.length > 40 ? '...' : '')
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

  // 4. Save the initial user message
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt
    }
  });

  // 5. Generate System Prompt
  const toolNames = allowedTools.join(', ');
  const systemPrompt = `
    You are ${payload.persona}, the central AI assistant for an automotive repair shop. 
    The current shop is on the "${planName}". 
    The specialized AI tools available for this plan are: ${toolNames}.
  `.trim();

  // 6. Get AI Response
  const resultText = await callAI(systemPrompt, payload.prompt);

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

const sendMessage = async (userId: string, payload: { sessionId: string, prompt: string }) => {
  const session = await prisma.chatSession.findUnique({
    where: { id: payload.sessionId }
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat session not found');
  }

  // 1. Save user message
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: payload.prompt
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
  `.trim();

  // 4. Get AI Response
  const resultText = await callAI(systemPrompt, payload.prompt);

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

const getMyChatSessions = async (userId: string) => {
  return await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
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
