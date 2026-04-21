import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import OpenAI from 'openai';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { AI_ACCESS_MAP, AIToolType } from './ai.constants';
import config from '../../../config';

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
 * Helper to call OpenAI API for diagnostics.
 * If OPENAI_API_KEY is not provided, returns a simulated response for development.
 */
export const callAI = async (systemPrompt: string, userPrompt: string, imageUrl?: string) => {
    const apiKey = config.ai.openai_api_key;

    if (!apiKey) {
        console.warn("OPENAI_API_KEY not found in config. Returning simulated response.");
        // Simulated delay to mimic network latency
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return `[SIMULATED DIAGNOSTIC]
Analysis of: "${userPrompt}" ${imageUrl ? "(Image analysis included)" : ""}
Potential Cause: Based on typical patterns, this issue often stems from intermittent signal loss in the primary sensor circuit.
Recommended Action: Inspect the wiring harness for signs of wear or corrosion. Test the sensor output voltage using a multimeter to ensure it's within factory specifications.
Priority: Medium`;
    }

    try {
        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const modelName = config.ai.model_name;

        // Build the message content for OpenAI
        const userContent: any[] = [{ type: "text", text: userPrompt }];
        
        if (imageUrl) {
            userContent.push({
                type: "image_url",
                image_url: { url: imageUrl }
            });
        }

        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            temperature: 0.7,
            max_tokens: 1200,
        });

        return response.choices[0].message.content || "No response from AI.";
    } catch (error: any) {
        console.error("OpenAI API Error:", error.message);
        return `AI Service Error: ${error.message}. Please check your API configuration.`;
    }
};
