import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import httpStatus from 'http-status';
import { validateAISubscription, getPlanUpgradePrompts, callAI } from './ai.utils';
import { getMasterAIConfig } from './ai.config';
import { TechnicianServices } from '../technician/technician.service';

/**
 * Validates technician input against the expected response options saved in the session.
 * Part of the "Backend Enforcement Layer".
 */
const validateTechnicianInput = (userInput: string, expectedOptions: string[]) => {
  if (expectedOptions.length === 0) return true; // Initial input or no options yet

  const normalizedInput = userInput.toLowerCase().trim();
  
  // 1. Check for vague or invalid proof language
  const invalidPhrases = ["looks good", "seems fine", "i think", "probably", "should be okay", "checked it", "tested okay"];
  if (invalidPhrases.some(phrase => normalizedInput.includes(phrase)) && !expectedOptions.some(opt => opt.toLowerCase().includes(normalizedInput))) {
    return false;
  }

  // 2. Check if input closely matches one of the expected options
  const isMatch = expectedOptions.some(option => {
    const opt = option.toLowerCase();
    return normalizedInput.includes(opt) || opt.includes(normalizedInput);
  });

  return isMatch;
};

const startNewChat = async (userId: string, ownerId: string, payload: { prompt?: string, image?: string }) => {
  // 1. Validate Subscription and Plan
  const planSubscription = await validateAISubscription(userId);
  const planCategory = planSubscription.plan.category;

  if (!payload.prompt && !payload.image) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide Year/Make/Model/Engine and Concern');
  }

  const userPrompt = payload.prompt || "[Image Shared]";
  const masterConfig = getMasterAIConfig();
  if (!masterConfig) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Master AI Config not found");

  // 2. Build Unified System Prompt with Plan Upgrades
  const upgradePrompts = getPlanUpgradePrompts(planCategory);
  const systemPrompt = `
${masterConfig.master_engine.instructions}

### ENABLED PLAN UPGRADES FOR THIS SESSION ###
${upgradePrompts}
  `.trim();

  // 3. Call AI for the first diagnostic step (Forces JSON)
  const aiResponse = await callAI(systemPrompt, userPrompt, payload.image, masterConfig.master_engine.model, [], true);
  let diagnosticData;
  try {
    diagnosticData = JSON.parse(aiResponse);
  } catch (e) {
    console.error("Failed to parse AI JSON response:", aiResponse);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "AI returned invalid diagnostic structure. Please try again.");
  }

  // 4. Extract Vehicle and Concern from AI (Locked for the session)
  const vehicleData = diagnosticData.vehicle || userPrompt;
  const activeConcern = diagnosticData.concern || "Automotive Diagnostic";

  // 5. Create Chat Session with State
  const session = await prisma.chatSession.create({
    data: {
      userId,
      ownerId,
      persona: "Master Engine v5",
      title: `${vehicleData.substring(0, 30)} - ${activeConcern.substring(0, 15)}`,
      currentStep: diagnosticData.step_number || 1,
      vehicleData: diagnosticData.vehicle ? { raw: diagnosticData.vehicle } : { raw: userPrompt },
      activeConcern: activeConcern,
      expectedOptions: diagnosticData.response_options || [],
      diagnosticStatus: 'ACTIVE'
    }
  });

  // Keep Dashboard in sync
  await TechnicianServices.createDiagnostic(userId, ownerId, { persona: "Master Engine v5" });

  // 6. Save messages
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: userPrompt, image: payload.image }
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'assistant', content: JSON.stringify(diagnosticData) }
  });

  return { session, assistantMessage, status: 'success' };
};

const sendMessage = async (userId: string, payload: { sessionId: string, prompt?: string, image?: string }) => {
  if (!payload.prompt && !payload.image) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please provide a response');
  }

  const session = await prisma.chatSession.findUnique({
    where: { id: payload.sessionId }
  });

  if (!session) throw new ApiError(httpStatus.NOT_FOUND, 'Chat session not found');

  // 1. GATEKEEPER: Validate technician input against expected options
  const userInput = payload.prompt || "[Image Shared]";
  if (session.expectedOptions.length > 0 && !validateTechnicianInput(userInput, session.expectedOptions)) {
    // Return a structured error without calling AI (Token saving + Enforcement)
    return await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: JSON.stringify({
          error: "INVALID_INPUT",
          message: "Visual or vague confirmation is not valid. Please select one of the listed response options or provide a measured result.",
          expected_options: session.expectedOptions,
          step_number: session.currentStep
        })
      }
    });
  }

  // 2. Save User Message
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: userInput, image: payload.image }
  });

  // 3. Prepare AI Context
  const planSubscription = await validateAISubscription(userId);
  const masterConfig = getMasterAIConfig();
  const upgradePrompts = getPlanUpgradePrompts(planSubscription.plan.category);
  
  const systemPrompt = `
${masterConfig.master_engine.instructions}

### ENABLED PLAN UPGRADES ###
${upgradePrompts}

CURRENT SESSION STATE (ENFORCED BY BACKEND):
- Locked Vehicle: ${JSON.stringify(session.vehicleData)}
- Active Concern: ${session.activeConcern}
- Highest Prior Step: Step ${session.currentStep}
  `.trim();

  const previousMessages = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const history = previousMessages.reverse().map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // 4. Call AI for Next Step (JSON Mode)
  const aiResponse = await callAI(systemPrompt, userInput, payload.image, masterConfig.master_engine.model, history, true);
  
  let diagnosticData;
  try {
    diagnosticData = JSON.parse(aiResponse);
  } catch (e) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "AI returned non-JSON response. Retrying diagnostic flow recommended.");
  }

  // 5. ENFORCEMENT: Step Number Validation
  if (diagnosticData.state_action === "awaiting_response") {
    const nextStep = diagnosticData.step_number;
    if (nextStep <= session.currentStep) {
        // AI reused a step number, backend correction logic could go here
        console.warn(`[BACKEND ENFORCEMENT] AI reused step number ${nextStep}. Current is ${session.currentStep}.`);
    }
  }

  // 6. Update Session State
  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      currentStep: diagnosticData.step_number || session.currentStep,
      expectedOptions: diagnosticData.response_options || [],
      diagnosticStatus: diagnosticData.state_action === 'final_conclusion' ? 'COMPLETED' : 'ACTIVE',
      updatedAt: new Date()
    }
  });

  // 7. Save and Return AI response
  return await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: JSON.stringify(diagnosticData)
    }
  });
};

const getMyChatSessions = async (userId: string, searchTerm?: string) => {
  const where: any = { userId };
  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { activeConcern: { contains: searchTerm, mode: 'insensitive' } }
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
  startNewChat,
  sendMessage,
  getMyChatSessions,
  getChatMessages
};
