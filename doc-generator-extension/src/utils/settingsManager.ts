import * as vscode from 'vscode';

export class SettingsManager {
    private static readonly EXTENSION_ID = 'ai-doc-generator';
    
    /**
     * Save API token with persistent storage that survives IDE restarts
     */
    static async saveApiToken(token: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        await config.update('apiToken', token, vscode.ConfigurationTarget.Global);
    }
    
    /**
     * Get API token from persistent storage
     */
    static getApiToken(): string | undefined {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return config.get<string>('apiToken');
    }
    
    /**
     * Check if API token is configured
     */
    static isApiTokenConfigured(): boolean {
        const token = this.getApiToken();
        return !!(token && token.trim().length > 0);
    }
    
    /**
     * Validate API token by testing connection
     */
    static async validateToken(token: string): Promise<boolean> {
        try {
            // Test the token with a minimal API call to OpenRouter
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tngtech/deepseek-r1t2-chimera:free',
                    messages: [{ role: 'user', content: 'Test connection' }],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    /**
     * Get auto-update on commit setting
     */
    static getAutoUpdateOnCommit(): boolean {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return config.get<boolean>('autoUpdateOnCommit', false);
    }

    /**
     * Get AI model configuration
     */
    static getAIConfig(): {
        model: string;
        maxTokens: number;
        temperature: number;
    } {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return {
            model: config.get<string>('ai.defaultModel', 'tngtech/deepseek-r1t2-chimera:free'),
            maxTokens: config.get<number>('ai.maxTokens', 8192),
            temperature: config.get<number>('ai.temperature', 0.1)
        };
    }

    /**
     * Get exclude patterns for code analysis
     */
    static getExcludePatterns(): string[] {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        return config.get<string[]>('excludePatterns', [
            'node_modules/**',
            'dist/**',
            'build/**',
            'out/**',
            'target/**',
            'bin/**',
            'obj/**',
            '.git/**',
            '.svn/**',
            '.hg/**',
            'venv/**',
            'env/**',
            '.venv/**',
            '.env/**',
            '__pycache__/**',
            '*.pyc',
            '.pytest_cache/**',
            'coverage/**',
            '.nyc_output/**',
            '.coverage/**',
            'htmlcov/**',
            '*.test.*',
            '*.spec.*',
            '**/*.d.ts',
            '**/*.min.js',
            '**/*.min.css',
            '*.log',
            'logs/**',
            '.DS_Store',
            'Thumbs.db',
            '*.vsix',
            '*.tgz',
            '*.zip',
            '*.tar.gz',
            '.idea/**',
            '.vscode/settings.json',
            '*.sqlite',
            '*.db',
            'migrations/**',
            'vendor/**',
            'composer.lock',
            'package-lock.json',
            'yarn.lock',
            'Pipfile.lock'
        ]);
    }

    /**
     * Clear API token (for logout/reset functionality)
     */
    static async clearApiToken(): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.EXTENSION_ID);
        await config.update('apiToken', undefined, vscode.ConfigurationTarget.Global);
    }

    /**
     * Prompt user for API token configuration
     */
    static async promptForApiToken(): Promise<void> {
        const token = await vscode.window.showInputBox({
            prompt: 'Enter your DeepSeek R1T2 Chimera API Token',
            password: true,
            placeHolder: 'sk-...',
            validateInput: async (value) => {
                if (!value || value.trim().length === 0) {
                    return 'API token is required';
                }
                if (!value.startsWith('sk-')) {
                    return 'API token should start with "sk-"';
                }
                return null;
            }
        });

        if (token) {
            try {
                const isValid = await this.validateToken(token);
                if (isValid) {
                    await this.saveApiToken(token);
                    vscode.window.showInformationMessage('✅ API token configured successfully!');
                } else {
                    vscode.window.showErrorMessage('❌ Invalid API token. Please check your token and try again.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`❌ Failed to validate token: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
}
