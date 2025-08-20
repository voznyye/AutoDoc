import * as vscode from 'vscode';
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
     * Load environment variables from .env file and system environment
     */
    public async loadEnvironment(): Promise<void> {
        if (this.isLoaded) {
            return;
        }

        try {
            // Load from .env file in workspace root
            await this.loadFromEnvFile();
            
            // Load from system environment variables (higher priority)
            this.loadFromSystemEnv();
            
            // Load from VSCode settings (lowest priority, as fallback)
            this.loadFromVSCodeSettings();
            
            this.isLoaded = true;
        } catch (error) {
            console.error('Failed to load environment configuration:', error);
            // Continue with system env and settings as fallback
            this.loadFromSystemEnv();
            this.loadFromVSCodeSettings();
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
     * Get the path to the .env file
     */
    public getEnvFilePath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        return path.join(workspaceFolders[0].uri.fsPath, '.env');
    }

    /**
     * Create a .env file template
     */
    public async createEnvTemplate(): Promise<void> {
        const envPath = this.getEnvFilePath();
        if (!envPath) {
            throw new Error('No workspace folder found');
        }

        const template = `# AI Documentation Generator - Environment Variables
# Copy this file to .env and fill in your API keys
# NEVER commit .env files to version control!

# OpenRouter API Key (Primary AI service - get free key at https://openrouter.ai/keys)
OPENROUTER_API_KEY=

# Optional: Additional AI service keys for future features
# OPENAI_API_KEY=
# CLAUDE_API_KEY=
# GEMINI_API_KEY=

# Optional: GitHub token for enhanced Git integration
# GITHUB_TOKEN=

# Note: You can also set these as system environment variables
# The extension will check in this order:
# 1. System environment variables (highest priority)
# 2. .env file in workspace root
# 3. VSCode settings (lowest priority, not recommended for security)
`;

        const templatePath = path.join(path.dirname(envPath), '.env.example');
        await fs.promises.writeFile(templatePath, template, 'utf8');
    }

    /**
     * Load configuration from .env file
     */
    private async loadFromEnvFile(): Promise<void> {
        const envPath = this.getEnvFilePath();
        if (!envPath) {
            return;
        }

        try {
            if (!fs.existsSync(envPath)) {
                return;
            }

            const envContent = await fs.promises.readFile(envPath, 'utf8');
            const envVars = this.parseEnvFile(envContent);

            // Map environment variables to our config
            if (envVars.OPENROUTER_API_KEY) {
                this.config.openRouterApiKey = envVars.OPENROUTER_API_KEY;
            }
            if (envVars.OPENAI_API_KEY) {
                this.config.openaiApiKey = envVars.OPENAI_API_KEY;
            }
            if (envVars.CLAUDE_API_KEY) {
                this.config.claudeApiKey = envVars.CLAUDE_API_KEY;
            }
            if (envVars.GEMINI_API_KEY) {
                this.config.geminiApiKey = envVars.GEMINI_API_KEY;
            }
            if (envVars.GITHUB_TOKEN) {
                this.config.githubToken = envVars.GITHUB_TOKEN;
            }

        } catch (error) {
            console.warn('Could not load .env file:', error);
        }
    }

    /**
     * Load configuration from system environment variables
     */
    private loadFromSystemEnv(): void {
        // System environment variables have higher priority
        if (process.env.OPENROUTER_API_KEY && !this.config.openRouterApiKey) {
            this.config.openRouterApiKey = process.env.OPENROUTER_API_KEY;
        }
        if (process.env.OPENAI_API_KEY && !this.config.openaiApiKey) {
            this.config.openaiApiKey = process.env.OPENAI_API_KEY;
        }
        if (process.env.CLAUDE_API_KEY && !this.config.claudeApiKey) {
            this.config.claudeApiKey = process.env.CLAUDE_API_KEY;
        }
        if (process.env.GEMINI_API_KEY && !this.config.geminiApiKey) {
            this.config.geminiApiKey = process.env.GEMINI_API_KEY;
        }
        if (process.env.GITHUB_TOKEN && !this.config.githubToken) {
            this.config.githubToken = process.env.GITHUB_TOKEN;
        }
    }

    /**
     * Load configuration from VSCode settings as fallback
     */
    private loadFromVSCodeSettings(): void {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        
        // Only use VSCode settings if no secure value is already set
        if (!this.config.openRouterApiKey) {
            const settingsKey = config.get<string>('openRouterApiKey');
            if (settingsKey) {
                this.config.openRouterApiKey = settingsKey;
                // Show a warning that this is not secure
                vscode.window.showWarningMessage(
                    '⚠️ API key found in VSCode settings. For security, consider moving it to a .env file.',
                    'Learn How'
                ).then((selection) => {
                    if (selection === 'Learn How') {
                        vscode.env.openExternal(vscode.Uri.parse('https://github.com/voznyye/AutoDoc#secure-setup'));
                    }
                });
            }
        }
    }

    /**
     * Parse .env file content
     */
    private parseEnvFile(content: string): Record<string, string> {
        const result: Record<string, string> = {};
        const lines = content.split('\n');

        for (let line of lines) {
            line = line.trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) {
                continue;
            }

            // Parse KEY=VALUE format
            const equalIndex = line.indexOf('=');
            if (equalIndex === -1) {
                continue;
            }

            const key = line.substring(0, equalIndex).trim();
            let value = line.substring(equalIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            if (key && value) {
                result[key] = value;
            }
        }

        return result;
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
