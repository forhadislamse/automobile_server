 import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import OpenAI from 'openai';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { AIToolType } from './ai.constants';
import { getMasterAIConfig } from './ai.config';
import config from '../../../config';

export const getAllowedToolsForPlanCategory = (category: string) => {
  const masterConfig = getMasterAIConfig();
  if (!masterConfig) return [];
  
  const allConfigs = masterConfig.configs;

  if (category === 'BASIC') {
    // Basic: Only Foreman, Mechanical, and OBD2 (standard tools that are not advanced)
    const basicToolKeys = ['shop_foreman_gpt', 'mechanical_diagnostics_gpt', 'obd2_code_interpreter_gpt'];
    return allConfigs
      .filter((c: any) => basicToolKeys.includes(c.tool_key))
      .map((c: any) => c.tool_key);
  }
  
  if (category === 'PROFESSIONAL') {
    // Professional: All "standard" tools, excluding "premium" (European)
    return allConfigs
      .filter((c: any) => c.subscription_tier === 'standard')
      .map((c: any) => c.tool_key);
  }

  if (category === 'EUROPEAN') {
    // European: Everything
    return allConfigs.map((c: any) => c.tool_key);
  }

  return [];
};

/**
 * Gets the list of tools NOT available in the current plan for upgrade suggestions
 */
export const getLockedToolsForPlanCategory = (category: string) => {
  const masterConfig = getMasterAIConfig();
  if (!masterConfig) return [];
  
  const allowedTools = getAllowedToolsForPlanCategory(category);
  return masterConfig.configs
    .filter((c: any) => !allowedTools.includes(c.tool_key))
    .map((c: any) => c.display_name);
};

/**
 * Validates if the current user (Technician or Owner) has access to a specific AI tool
 * based on the Shop Owner's active subscription.
 */
export const validateAIToolAccess = async (userId: string, requestedTool: string) => {
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

  // Determine dynamically allowed tools
  const allowedTools = getAllowedToolsForPlanCategory(planSubscription.plan.category);
  
  if (!allowedTools.includes(requestedTool)) {
    // Determine which plan is needed
    const masterConfig = getMasterAIConfig();
    const toolConfig = masterConfig?.configs.find((c: any) => c.tool_key === requestedTool);
    const requiredTier = toolConfig?.subscription_tier || 'professional';
    const planName = requiredTier === 'premium' ? 'European Specialist' : 'Professional Shop';

    return {
      hasAccess: false,
      planSubscription,
      message: `Access to the specialized "${toolConfig?.display_name || requestedTool}" tool is not available in your current ${planSubscription.plan.name}. This feature is included in the ${planName} plan. Please contact your shop owner to upgrade your subscription to access this advanced diagnostic capability.`
    };
  }

  return {
    hasAccess: true,
    planSubscription
  };
};

/**
 * Helper to call OpenAI API for diagnostics.
 * If OPENAI_API_KEY is not provided, returns a simulated response for development.
 */
export const callAI = async (systemPrompt: string, userPrompt: string, imageUrl?: string, modelOverride?: string) => {
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

        const modelName = modelOverride || config.ai.model_name;

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
