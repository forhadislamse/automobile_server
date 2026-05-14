 import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import OpenAI from 'openai';
import prisma from '../../../shared/prisma';
import ApiError from '../../../errors/ApiErrors';
import { getMasterAIConfig } from './ai.config';
import config from '../../../config';

/**
 * Gets the feature flags for a specific plan category from the master config
 */
export const getPlanFeatureFlags = (category: string) => {
  const masterConfig = getMasterAIConfig();
  if (!masterConfig || !masterConfig.plan_features) return null;
  
  return masterConfig.plan_features[category] || masterConfig.plan_features['BASIC'];
};

/**
 * Gets the formatted list of upgrades (Instructions) for the AI based on the user's plan
 */
export const getPlanUpgradePrompts = (category: string) => {
  const masterConfig = getMasterAIConfig();
  const flags = getPlanFeatureFlags(category);
  if (!masterConfig || !flags) return "";

  let upgradePrompt = "\n### ACTIVE UPGRADES FOR THIS SESSION ###\n";
  const upgrades = masterConfig.master_engine.upgrades;

  if (flags.pattern_injection) upgradePrompt += `${upgrades.pattern_injection}\n\n`;
  if (flags.time_optimization) upgradePrompt += `${upgrades.time_optimization}\n\n`;
  if (flags.advanced_branching) upgradePrompt += `${upgrades.advanced_branching}\n\n`;
  if (flags.euro_mode) upgradePrompt += `${upgrades.euro_mode}\n\n`;
  if (flags.intermittent_handling) upgradePrompt += `${upgrades.intermittent_handling}\n\n`;
  if (flags.contradiction_control) upgradePrompt += `${upgrades.contradiction_control}\n\n`;
  if (flags.dead_path_recovery) upgradePrompt += `${upgrades.dead_path_recovery}\n\n`;
  if (flags.scan_data_interpretation) upgradePrompt += `${upgrades.scan_data_interpretation}\n\n`;
  if (flags.control_module_strategy) upgradePrompt += `${upgrades.control_module_strategy}\n\n`;
  if (flags.shop_efficiency_layer) upgradePrompt += `${upgrades.shop_efficiency_layer}\n\n`;

  // BACKEND ENFORCEMENT: Explicitly tell AI what is FORBIDDEN
  let forbiddenPrompt = "\n### FORBIDDEN / DISABLED FEATURES (PLAN GATED) ###\n";
  if (!flags.euro_mode) {
    forbiddenPrompt += "- EUROPEAN VEHICLES: You are FORBIDDEN from providing diagnostic data for BMW, Mercedes, Audi, VW, Porsche, Volvo, Land Rover, or Jaguar. If detected, you MUST set state_action: 'confirm_switch' and message: 'European vehicle detected. Upgrade required.'\n";
  }
  if (category === 'BASIC') {
    forbiddenPrompt += "- TRANSMISSION / ELECTRICAL DOMAINS: You are FORBIDDEN from providing advanced diagnostic steps for these systems. If system_focus is Transmission or Electrical, you MUST set state_action: 'confirm_switch'.\n";
  }

  return upgradePrompt + forbiddenPrompt;
};

/**
 * Validates if the current user has an active subscription and returns plan details
 */
export const validateAISubscription = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, ownerId: true }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const ownerId = user.role === UserRole.TECHNICIAN ? user.ownerId : user.id;

  if (!ownerId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'No shop owner associated with this account');
  }

  const planSubscription = await prisma.userPlanSubscription.findFirst({
    where: {
      ownerId: ownerId,
      status: { in: ['active', 'trialing'] },
      expiresAt: { gt: new Date() }
    },
    include: { plan: true }
  });

  if (!planSubscription) {
    throw new ApiError(httpStatus.PAYMENT_REQUIRED, 'Active subscription required to access AI diagnostics');
  }

  return planSubscription;
};

/**
 * Helper to call OpenAI API for diagnostics.
 * Supports JSON response format for v5 engine.
 */
export const callAI = async (
    systemPrompt: string, 
    userPrompt: string, 
    imageUrl?: string, 
    modelOverride?: string, 
    history: any[] = [],
    jsonMode: boolean = false
) => {
    const apiKey = config.ai.openai_api_key;

    if (!apiKey) {
        console.warn("OPENAI_API_KEY not found in config. Returning simulated JSON response.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return JSON.stringify({
            vehicle: "Simulated Vehicle",
            concern: userPrompt,
            system_focus: "Mechanical",
            current_assessment: "Simulated analysis in development mode.",
            step_number: 1,
            step_title: "Initial Check",
            instruction: "Simulated instruction for development.",
            what_to_check: "Visual confirmation.",
            response_options: ["Yes", "No"],
            state_action: "awaiting_response"
        });
    }

    try {
        const openai = new OpenAI({
            apiKey: apiKey,
        });

        const masterConfig = getMasterAIConfig();
        const modelName = modelOverride || masterConfig?.master_engine?.model || config.ai.model_name;

        const userContent: any[] = [{ type: "text", text: userPrompt }];
        
        if (imageUrl) {
            userContent.push({
                type: "image_url",
                image_url: { url: imageUrl }
            });
        }

        const messages: any[] = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: userContent }
        ];

        const maxTokens = masterConfig?.master_engine?.max_output_tokens || 1200;

        const response = await openai.chat.completions.create({
            model: modelName,
            messages: messages,
            temperature: 0.1, // Lower temperature for more consistent diagnostic steps
            max_tokens: maxTokens,
            response_format: jsonMode ? { type: "json_object" } : undefined
        });

        return response.choices[0].message.content || "{}";
    } catch (error: any) {
        console.error("OpenAI API Error:", error.message);
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `AI Service Error: ${error.message}`);
    }
};
