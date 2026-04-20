import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { AI_ACCESS_MAP, AIToolType } from './ai.constants';

/**
 * Validates if the current user (Technician or Owner) has access to a specific AI tool
 * based on the Shop Owner's active subscription.
 */
export const validateAIToolAccess = async (userId: string, requestedTool: AIToolType) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, ownerId: true }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Find the Shop Owner ID
  const ownerId = user.role === UserRole.TECHNICIAN ? user.ownerId : user.id;

  if (!ownerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'No shop owner associated with this account');
  }

  // Fetch the Active Plan Subscription for the owner
  const planSubscription = await prisma.userPlanSubscription.findFirst({
    where: {
      ownerId: ownerId,
      status: { in: ['active', 'trialing'] },
      expiresAt: { gt: new Date() }
    },
    include: { plan: true }
  });

  if (!planSubscription) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'Active subscription required to access AI tools');
  }

  // Check if the requested tool is allowed for this plan category
  const allowedTools = AI_ACCESS_MAP[planSubscription.plan.category];
  
  if (!allowedTools.includes(requestedTool)) {
    throw new ApiError(
      httpStatus.FORBIDDEN, 
      `Access denied. The "${requestedTool}" is not included in the ${planSubscription.plan.name}. Please upgrade your plan.`
    );
  }

  return planSubscription;
};

/**
 * Placeholder for real AI API call (OpenAI, Anthropic, etc.)
 */
export const callAI = async (systemPrompt: string, userPrompt: string) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn("OPENAI_API_KEY not found. Returning simulated response.");
        // Simulated delay to mimic network latency
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return `[SIMULATED DIAGNOSTIC]
Analysis of: "${userPrompt}"
Potential Cause: Based on typical patterns, this issue often stems from intermittent signal loss in the primary sensor circuit.
Recommended Action: Inspect the wiring harness for signs of wear or corrosion. Test the sensor output voltage using a multimeter to ensure it's within factory specifications.
Priority: Medium`;
    }

    // Real implementation would use:
    // const openai = new OpenAI({ apiKey });
    // const completion = await openai.chat.completions.create({ ... });
    return `AI response for: ${userPrompt}`;
};
