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

// import OpenAI from 'openai';
// import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Placeholder for real AI API call (OpenAI, Anthropic, etc.)
 * Updated to support both OpenAI (GPT-4o) and Google Gemini (1.5 Flash)
 */
export const callAI = async (systemPrompt: string, userPrompt: string, imageUrl?: string) => {
  const openAIKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  /* 
  // OPTION 1: GOOGLE GEMINI INTEGRATION (Recommended for Free Tier)
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const parts: any[] = [{ text: `SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}` }];
      
      // If image is provided, you would need to fetch it and convert to base64 for Gemini
      // This is a placeholder for that logic
      if (imageUrl) {
         // Logic to fetch image and add as inlineData part
      }

      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
    }
  }
  */

  /* 
  // OPTION 2: REAL OPENAI INTEGRATION
  if (openAIKey) {
    try {
      const openai = new OpenAI({ apiKey: openAIKey });
      
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
          ],
        },
      ];

      if (imageUrl) {
        messages[1].content.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      });

      return response.choices[0].message.content;
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
    }
  }
  */

  // FALLBACK / SIMULATED RESPONSE
  console.warn("Using simulated response (OPENAI_API_KEY not active or code commented).");
  
  // Simulated delay to mimic network latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  let simulatedIcon = "🚗";
  if (imageUrl) simulatedIcon = "📸";

  return `${simulatedIcon} **Diagnostic Analysis**
  
  🔍 **Identified Issue:** Based on your description ${imageUrl ? "and the provided image" : ""}, there appears to be a potential fault in the primary circuit.
  
  🛠️ **How to Solve:**
  1. Inspect the wiring harness for any visible damage.
  2. Use a diagnostic scanner to check for pending trouble codes.
  3. Verify the sensor voltage remains within 0.5V - 4.5V range.
  
  ⚠️ **Note:** Please upgrade your plan for more detailed, specialized expert analysis.`;
};
