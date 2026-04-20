import { AIToolType, AI_TOOLS, AI_ACCESS_MAP } from './ai.constants';
import { validateAIToolAccess } from './ai.utils';

const processAIRequest = async (userId: string, toolType: AIToolType, prompt: string) => {
  // 1. Validate Access and get plan details
  const subscription = await validateAIToolAccess(userId, toolType);
  const planName = subscription.plan.name;
  const allowedTools = AI_ACCESS_MAP[subscription.plan.category];

  // 2. Generate System Prompt (Plan Aware)
  const toolNames = allowedTools.join(', ');
  
  const systemPrompt = `
    You are ${toolType}, the central AI assistant for an automotive repair shop. 
    The current shop is on the "${planName}". 
    The specialized AI tools available for this plan are: ${toolNames}. 
    Your knowledge and assistance should be consistent with these available tools. 
    If a user asks for advanced diagnostics that are NOT in the list above, 
    provide a basic helpful response but politely explain that they can get much more advanced, 
    specialized AI assistance by upgrading their plan.
  `.trim();

  // 3. AI Logic (Placeholder)
  // In real implementation: callAI(systemPrompt, userPrompt)
  console.log(`[AI CONTEXT] System Prompt injected for ${planName}`);

  return {
    tool: toolType,
    status: 'success',
    planContext: {
      currentPlan: planName,
      availableTools: allowedTools
    },
    message: `Response from ${toolType}`,
    data: {
      systemPromptUsed: systemPrompt, // For debugging/verification
      result: `Detailed analysis for prompt: "${prompt}"`,
      timestamp: new Date()
    }
  };
};

export const AIServices = {
  processAIRequest
};
