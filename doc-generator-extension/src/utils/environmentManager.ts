import * as path from 'path';
import * as fs from 'fs';

export interface SecureConfig {
    openRouterApiKey?: string;
    githubToken?: string;
    geminiApiKey?: string;
    claudeApiKey?: string;
    openaiApiKey?: string;
}

export class EnvironmentManager {
    private static instance: EnvironmentManager;
    private config: SecureConfig = {};
    private isLoaded = false;

    private constructor() {}

    public static getInstance(): EnvironmentManager {
        if (!EnvironmentManager.instance) {
            EnvironmentManager.instance = new EnvironmentManager();
        }
        return EnvironmentManager.instance;
    }

    /**
     * Load environment variables from system environment only
     */
    public async loadEnvironment(): Promise<void> {
        if (this.isLoaded) {
            return;
        }

        try {
            // Load only from system environment variables
            this.loadFromSystemEnv();
            this.isLoaded = true;
        } catch (error) {
            console.error('Failed to load environment configuration:', error);
            // Still try to load from system env
            this.loadFromSystemEnv();
            this.isLoaded = true;
        }
    }

    /**
     * Get a secure configuration value
     */
    public async getSecureValue(key: keyof SecureConfig): Promise<string | undefined> {
        if (!this.isLoaded) {
            await this.loadEnvironment();
        }
        return this.config[key];
    }

    /**
     * Check if a secure value exists
     */
    public async hasSecureValue(key: keyof SecureConfig): Promise<boolean> {
        const value = await this.getSecureValue(key);
        return !!value && value.trim().length > 0;
    }

    /**
     * Get all available secure configuration
     */
    public async getSecureConfig(): Promise<SecureConfig> {
        if (!this.isLoaded) {
            await this.loadEnvironment();
        }
        return { ...this.config };
    }

    /**
     * Reload environment configuration
     */
    public async reload(): Promise<void> {
        this.isLoaded = false;
        this.config = {};
        await this.loadEnvironment();
    }

    /**
     * Check if environment is properly configured
     */
    public async isConfigured(): Promise<boolean> {
        const openRouterKey = await this.getSecureValue('openRouterApiKey');
        return !!openRouterKey;
    }

    /**
     * Set system environment variable (Windows/macOS/Linux)
     */
    public async setSystemEnvironmentVariable(key: string, value: string): Promise<void> {
        const platform = process.platform;
        
        try {
            if (platform === 'win32') {
                // Windows - use setx command
                const { exec } = require('child_process');
                await new Promise<void>((resolve, reject) => {
                    exec(`setx ${key} "${value}"`, (error: any) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
            } else {
                // macOS/Linux - add to shell profile
                const os = require('os');
                const homeDir = os.homedir();
                const shell = process.env.SHELL || '/bin/bash';
                let profileFile = '';
                
                if (shell.includes('zsh')) {
                    profileFile = path.join(homeDir, '.zshrc');
                } else if (shell.includes('bash')) {
                    profileFile = path.join(homeDir, '.bashrc');
                } else {
                    profileFile = path.join(homeDir, '.profile');
                }
                
                // Check if the variable already exists
                let profileContent = '';
                try {
                    profileContent = await fs.promises.readFile(profileFile, 'utf8');
                } catch (error) {
                    // File doesn't exist, that's ok
                }
                
                const exportLine = `export ${key}="${value}"`;
                const existingPattern = new RegExp(`^export\\s+${key}=.*$`, 'm');
                
                if (existingPattern.test(profileContent)) {
                    // Update existing line
                    profileContent = profileContent.replace(existingPattern, exportLine);
                } else {
                    // Add new line
                    if (profileContent && !profileContent.endsWith('\n')) {
                        profileContent += '\n';
                    }
                    profileContent += `\n# Added by Auto Documentation Generator\n${exportLine}\n`;
                }
                
                await fs.promises.writeFile(profileFile, profileContent, 'utf8');
            }
            
            // Set in current process environment
            process.env[key] = value;
            
        } catch (error) {
            throw new Error(`Failed to set system environment variable: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }



    /**
     * Load configuration from system environment variables only
     */
    private loadFromSystemEnv(): void {
        // Load only from system environment variables
        if (process.env.OPENROUTER_API_KEY) {
            this.config.openRouterApiKey = process.env.OPENROUTER_API_KEY;
        }
        if (process.env.OPENAI_API_KEY) {
            this.config.openaiApiKey = process.env.OPENAI_API_KEY;
        }
        if (process.env.CLAUDE_API_KEY) {
            this.config.claudeApiKey = process.env.CLAUDE_API_KEY;
        }
        if (process.env.GEMINI_API_KEY) {
            this.config.geminiApiKey = process.env.GEMINI_API_KEY;
        }
        if (process.env.GITHUB_TOKEN) {
            this.config.githubToken = process.env.GITHUB_TOKEN;
        }
    }



    /**
     * Validate API key format
     */
    public validateApiKey(key: string, provider: 'openrouter' | 'openai' | 'claude' | 'gemini'): boolean {
        if (!key || key.trim().length === 0) {
            return false;
        }

        const trimmedKey = key.trim();

        switch (provider) {
            case 'openrouter':
                return trimmedKey.startsWith('sk-or-') && trimmedKey.length > 10;
            case 'openai':
                return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
            case 'claude':
                return trimmedKey.startsWith('sk-ant-') && trimmedKey.length > 20;
            case 'gemini':
                return trimmedKey.length > 20; // Gemini keys don't have a specific prefix
            default:
                return trimmedKey.length > 10;
        }
    }

    /**
     * Securely test API key without logging it
     */
    public async testApiKey(provider: 'openrouter' | 'openai' | 'claude' | 'gemini'): Promise<boolean> {
        const key = await this.getSecureValue(
            provider === 'openrouter' ? 'openRouterApiKey' :
            provider === 'openai' ? 'openaiApiKey' :
            provider === 'claude' ? 'claudeApiKey' : 'geminiApiKey'
        );

        if (!key || !this.validateApiKey(key, provider)) {
            return false;
        }

        try {
            // Test the key with a minimal API call
            if (provider === 'openrouter') {
                const response = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.ok;
            }
            // Add other provider tests as needed
            return true;
        } catch (error) {
            console.error(`API key test failed for ${provider}:`, error);
            return false;
        }
    }
}

// Export singleton instance
export const environmentManager = EnvironmentManager.getInstance();
