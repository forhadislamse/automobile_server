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
 * (Maintains compatibility with legacy routing if needed)
 */
export const getPersonaConfig = (toolKey: string) => {
    const masterConfig = getMasterAIConfig();
    const defaultConfig = {
        instructions: "You are a helpful automotive diagnostic assistant.",
        model: "gpt-4o"
    };

    if (!masterConfig || !masterConfig.master_engine) return defaultConfig;

    return {
        instructions: masterConfig.master_engine.instructions,
        model: masterConfig.master_engine.model || "gpt-4o"
    };
};
