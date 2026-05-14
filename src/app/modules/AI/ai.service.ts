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

  // 3.5 BACKEND ENFORCEMENT: Plan Check (Overrule AI if needed)
  const vehicle = (diagnosticData.vehicle || "").toLowerCase();
  const isEuropean = /bmw|audi|mercedes|volkswagen|vw|volvo|porsche|land rover|jaguar|fiat|alfa|mini|bentley/.test(vehicle);
  const isRestrictedDomain = /transmission|electrical/.test((diagnosticData.system_focus || "").toLowerCase());

  // Only lock if we actually have a vehicle name (prevents locking on "Hello" or "Hi")
  const hasVehicle = vehicle && vehicle !== "unknown" && vehicle.length > 3;

  if (planCategory === 'BASIC' && hasVehicle && (isEuropean || isRestrictedDomain)) {
    diagnosticData = {
      status: 'PLAN_LOCKED',
      message: isEuropean 
        ? `Diagnostic data for European brands (${diagnosticData.vehicle}) is restricted. This session is locked under your current plan. Please contact your shop owner to upgrade to the European or Professional plan.`
        : `Diagnostic support for ${diagnosticData.system_focus} systems is restricted. Please upgrade to a specialized plan to continue this investigation.`,
      vehicle: diagnosticData.vehicle,
      concern: diagnosticData.concern,
      system_focus: diagnosticData.system_focus
    };
  }

  // 4. If PLAN_LOCKED, create a minimal session, save messages, and return early
  if (diagnosticData.status === 'PLAN_LOCKED') {
    const vehicleLabel = diagnosticData.vehicle || userPrompt;
    const concernLabel = diagnosticData.concern || "Restricted Diagnostic";

    const session = await prisma.chatSession.create({
      data: {
        userId,
        ownerId,
        persona: "Master Engine v5",
        title: `${String(vehicleLabel).substring(0, 30)} - Upgrade Required`,
        currentStep: 0,
        vehicleData: { raw: String(vehicleLabel) },
        activeConcern: String(concernLabel),
        expectedOptions: [],
        diagnosticStatus: 'ACTIVE'
      }
    });

    await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: userPrompt, image: payload.image }
    });

    const assistantMessage = await prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: JSON.stringify(diagnosticData) }
    });

    return { session, assistantMessage, status: 'success' };
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
      title: `${String(vehicleData).substring(0, 30)} - ${String(activeConcern).substring(0, 15)}`,
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

  const userInput = payload.prompt || "[Image Shared]";

  // 1. Load Session State
  const session = await prisma.chatSession.findUnique({
    where: { id: payload.sessionId },
    include: { user: true }
  });

  if (!session) throw new ApiError(httpStatus.NOT_FOUND, 'Session not found');
  if (session.userId !== userId) throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');

  // 2. BACKEND ENFORCEMENT: Check for New Concern Switch
  const lowInput = userInput.toLowerCase();
  const isSwitchAttempt = (lowInput.includes("also") || lowInput.includes("another") || lowInput.includes("issue with") || lowInput.includes("not working")) && 
                          !session.activeConcern?.toLowerCase().split(' ').some(word => lowInput.includes(word));

  // If user says "Switch" or "Continue" to a confirmation
  if (session.diagnosticStatus === 'ACTIVE' && isSwitchAttempt && !lowInput.includes("switch") && !lowInput.includes("continue")) {
      const response = {
          status: 'confirm_switch',
          message: `Confirm switch to new concern? Reply "Switch" to start new diagnostic or "Continue" for current work.`,
          session
      };
      
      // PERSIST SYSTEM PROMPT
      await prisma.chatMessage.create({
          data: { sessionId: session.id, role: 'assistant', content: JSON.stringify(response) }
      });

      return response;
  }

  // Handle Switch Logic
  if (lowInput === "switch" && session.activeConcern) {
      const paused = Array.isArray(session.pausedConcerns) ? session.pausedConcerns : [];
      await prisma.chatSession.update({
          where: { id: session.id },
          data: {
              activeConcern: "New Investigation", // Reset to unknown
              currentStep: 0,
              pausedConcerns: [...paused, { concern: session.activeConcern, pausedAtStep: session.currentStep, vehicleData: session.vehicleData }],
              diagnosticStatus: 'ACTIVE'
          }
      });
      return { status: 'success', message: "Previous concern paused. Starting new diagnostic. Please describe the issue." };
  }

  // 3. BACKEND ENFORCEMENT: Validate Technician Input (Vague Proof Gate)
  // Document spec: { accepted: false, reason: "...", message: "..." }
  const isValidInput = validateTechnicianInput(userInput, (session.expectedOptions as string[]) || []);
  if (!isValidInput) {
    const errorResponse = {
      accepted: false,
      status: 'INVALID_INPUT',
      reason: "Invalid test result",
      message: "Visual or vague confirmation is not valid. Select one of the listed response options or provide a measured result.",
      expected_response_options: session.expectedOptions,
      current_step: session.currentStep
    };

    // PERSIST ERROR MESSAGE
    await prisma.chatMessage.create({
        data: { sessionId: session.id, role: 'assistant', content: JSON.stringify(errorResponse) }
    });

    return errorResponse;
  }

  // 4. Prepare AI Context
  const previousMessages = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
    take: 20
  });

  const history = previousMessages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // 5. Save Current User Message to DB
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: userInput, image: payload.image }
  });

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

  // 6. Call AI for Next Step (JSON Mode)
  const aiResponse = await callAI(systemPrompt, userInput, payload.image, masterConfig.master_engine.model, history, true);
  
  let diagnosticData;
  try {
    diagnosticData = JSON.parse(aiResponse);
  } catch (e) {
    console.error("AI JSON Parse Error:", aiResponse);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "AI returned invalid structure.");
  }

  // 7. BACKEND ENFORCEMENT: Plan Check (Overrule AI if needed)
  const planCategory = planSubscription.plan.category;
  const isEuropean = /bmw|audi|mercedes|volkswagen|vw|volvo|porsche|land rover|jaguar|fiat|alfa|mini|bentley/.test((diagnosticData.vehicle || "").toLowerCase());
  const isRestrictedDomain = /transmission|electrical/.test((diagnosticData.system_focus || "").toLowerCase());

  if (planCategory === 'BASIC' && (isEuropean || isRestrictedDomain)) {
    diagnosticData = {
      status: 'PLAN_LOCKED',
      message: isEuropean 
        ? `Diagnostic support for European brands (${diagnosticData.vehicle}) is restricted under your current plan. This investigation is locked. Please contact your shop owner to upgrade.`
        : `Support for ${diagnosticData.system_focus} systems is exclusive to specialist plans. Investigation locked.`,
      vehicle: diagnosticData.vehicle || session.vehicleData,
      concern: diagnosticData.concern || session.activeConcern,
      system_focus: diagnosticData.system_focus
    };
  }

  // 7.5 BACKEND ENFORCEMENT: Step Number Validation
  if (diagnosticData.state_action !== 'final_conclusion' && diagnosticData.status !== 'PLAN_LOCKED') {
    const expectedNextStep = session.currentStep + 1;
    if (diagnosticData.step_number !== expectedNextStep) {
      console.error(`[STEP VIOLATION] AI returned step ${diagnosticData.step_number}, expected ${expectedNextStep}. Rejecting.`);
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY,
        `Step number violation: AI returned step ${diagnosticData.step_number}, expected step ${expectedNextStep}.`
      );
    }
  }

  // 8. Update Session State (lastValidStep + full state persist)
  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      currentStep: diagnosticData.step_number || session.currentStep,
      lastValidStep: session.currentStep, // Track last confirmed step
      vehicleData: diagnosticData.vehicle !== "Unknown" ? { vehicle: diagnosticData.vehicle } : session.vehicleData,
      activeConcern: diagnosticData.concern !== "Unknown" ? diagnosticData.concern : session.activeConcern,
      expectedOptions: diagnosticData.response_options || [],
      diagnosticStatus: diagnosticData.state_action === 'final_conclusion' ? 'COMPLETED' : 'ACTIVE',
      updatedAt: new Date()
    }
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'assistant', content: JSON.stringify(diagnosticData) }
  });

  return { session, assistantMessage, status: 'success' };
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
