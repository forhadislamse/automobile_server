import fs from 'fs';
import path from 'path';

/**
 * Loads the master AI configuration from the JSON file
 */
export const getMasterAIConfig = () => {
    try {
        const configPath = path.join(process.cwd(), 'smartautotech_gpt_master_config.json');
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Error reading master AI config:", error);
        return null;
    }
};

/**
 * Gets the system instructions, guardrails, and model for a specific tool key
 */
export const getPersonaConfig = (toolKey: string) => {
    const masterConfig = getMasterAIConfig();
    const defaultConfig = {
        instructions: "You are a helpful automotive diagnostic assistant.",
        model: null
    };

    if (!masterConfig) return defaultConfig;

    const config = masterConfig.configs.find((c: any) => c.tool_key === toolKey);
    if (!config) return defaultConfig;

    const guardrails = masterConfig.configs[0].global_guardrails.join('\n- ');
    
    return {
        instructions: `${config.system_instructions}\n\nGLOBAL GUARDRAILS:\n- ${guardrails}`,
        model: config.model // e.g., "gpt-5.4"
    };
};
