import * as vscode from 'vscode';
import { environmentManager } from './environmentManager';
import { aiService } from '../services/aiService';

export class FirstTimeSetup {
    private static readonly SETUP_COMPLETED_KEY = 'docGenerator.setupCompleted';
    private static readonly SETUP_SKIPPED_KEY = 'docGenerator.setupSkipped';

    /**
     * Check if this is the first time the extension is being used
     */
    public static async isFirstTime(context: vscode.ExtensionContext): Promise<boolean> {
        const setupCompleted = context.globalState.get<boolean>(this.SETUP_COMPLETED_KEY, false);
        const setupSkipped = context.globalState.get<boolean>(this.SETUP_SKIPPED_KEY, false);
        
        if (setupCompleted || setupSkipped) {
            return false;
        }

        // Check if user already has API key configured
        const isConfigured = await aiService.isConfigured();
        if (isConfigured) {
            // Mark as completed since they already have it set up
            await context.globalState.update(this.SETUP_COMPLETED_KEY, true);
            return false;
        }

        return true;
    }

    /**
     * Run the first-time setup process
     */
    public static async runSetup(context: vscode.ExtensionContext): Promise<boolean> {
        try {
            const choice = await vscode.window.showInformationMessage(
                '🤖 Welcome to Auto Documentation Generator!\n\nTo use AI-powered features, you\'ll need a free OpenRouter API key. Would you like to set it up now?',
                { modal: true },
                'Setup Now',
                'Skip for Now',
                'Learn More'
            );

            switch (choice) {
                case 'Setup Now':
                    return await this.guidedSetup(context);
                
                case 'Learn More':
                    await vscode.env.openExternal(vscode.Uri.parse('https://github.com/voznyye/AutoDoc#secure-setup'));
                    // Ask again after they learn more
                    return await this.runSetup(context);
                
                case 'Skip for Now':
                    await context.globalState.update(this.SETUP_SKIPPED_KEY, true);
                    vscode.window.showInformationMessage(
                        'You can set up AI features later using "Doc Generator: Configure AI Settings" command.'
                    );
                    return false;
                
                default:
                    // User closed the dialog
                    return false;
            }
        } catch (error) {
            console.error('First-time setup error:', error);
            return false;
        }
    }

    /**
     * Guided setup process
     */
    private static async guidedSetup(context: vscode.ExtensionContext): Promise<boolean> {
        try {
            // Step 1: Show instructions for getting API key
            const getKey = await vscode.window.showInformationMessage(
                '📋 Step 1: Get Your Free API Key\n\n' +
                '1. Visit openrouter.ai\n' +
                '2. Sign up with Google/GitHub (free)\n' +
                '3. Go to "Keys" section\n' +
                '4. Create a new key\n' +
                '5. Copy the key (starts with sk-or-)\n\n' +
                'Ready to enter your API key?',
                { modal: true },
                'Open OpenRouter',
                'I Have My Key',
                'Cancel'
            );

            if (getKey === 'Open OpenRouter') {
                await vscode.env.openExternal(vscode.Uri.parse('https://openrouter.ai/keys'));
                // Wait a bit and ask again
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await this.guidedSetup(context);
            } else if (getKey !== 'I Have My Key') {
                return false;
            }

            // Step 2: Prompt for API key
            const apiKey = await vscode.window.showInputBox({
                prompt: '🔐 Enter your OpenRouter API key',
                placeHolder: 'sk-or-...',
                password: true,
                validateInput: (value) => {
                    if (!value || !value.trim()) {
                        return 'API key is required';
                    }
                    if (!value.startsWith('sk-or-')) {
                        return 'OpenRouter API keys should start with "sk-or-"';
                    }
                    if (value.length < 20) {
                        return 'API key seems too short';
                    }
                    return undefined;
                }
            });

            if (!apiKey) {
                return false;
            }

            // Step 3: Choose setup method
            const setupMethod = await vscode.window.showQuickPick([
                {
                    label: '🔐 .env file (Recommended)',
                    description: 'Secure, project-specific, ignored by Git',
                    detail: 'Creates a .env file in your workspace root'
                },
                {
                    label: '🌍 Environment Variable',
                    description: 'System-wide, most secure',
                    detail: 'Sets OPENROUTER_API_KEY environment variable'
                },
                {
                    label: '⚠️ VSCode Settings',
                    description: 'Quick but less secure',
                    detail: 'Stores in VSCode settings (not recommended for production)'
                }
            ], {
                placeHolder: 'Choose how to store your API key',
                ignoreFocusOut: true
            });

            if (!setupMethod) {
                return false;
            }

            // Step 4: Save the API key
            let saved = false;
            switch (setupMethod.label) {
                case '🔐 .env file (Recommended)':
                    saved = await this.saveToEnvFile(apiKey);
                    break;
                case '🌍 Environment Variable':
                    saved = await this.saveToEnvironment(apiKey);
                    break;
                case '⚠️ VSCode Settings':
                    saved = await this.saveToSettings(apiKey);
                    break;
            }

            if (!saved) {
                return false;
            }

            // Step 5: Test the configuration
            const testing = vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Testing AI connection...',
                cancellable: false
            }, async () => {
                await environmentManager.reload();
                return await aiService.testConnection();
            });

            const testResult = await testing;

            if (testResult) {
                // Step 6: Enable AI features
                const config = vscode.workspace.getConfiguration('docGenerator.ai');
                await config.update('enabled', true, vscode.ConfigurationTarget.Workspace);

                // Mark setup as completed
                await context.globalState.update(this.SETUP_COMPLETED_KEY, true);

                vscode.window.showInformationMessage(
                    '✅ Setup Complete!\n\n🤖 AI features are now enabled. Try:\n• "Doc Generator: Generate Documentation with AI"\n• Right-click code → "🤖 AI Documentation"',
                    'Try AI Features'
                ).then((selection) => {
                    if (selection === 'Try AI Features') {
                        vscode.commands.executeCommand('workbench.action.showCommands');
                    }
                });

                return true;
            } else {
                vscode.window.showErrorMessage(
                    '❌ Connection test failed. Please check your API key and try again.',
                    'Retry Setup'
                ).then((selection) => {
                    if (selection === 'Retry Setup') {
                        this.runSetup(context);
                    }
                });
                return false;
            }

        } catch (error) {
            vscode.window.showErrorMessage(
                `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return false;
        }
    }

    /**
     * Save API key to .env file
     */
    private static async saveToEnvFile(apiKey: string): Promise<boolean> {
        try {
            await environmentManager.createEnvTemplate();
            
            const envPath = environmentManager.getEnvFilePath();
            if (!envPath) {
                throw new Error('Could not determine .env file path');
            }

            // Update the .env file with the API key
            const fs = await import('fs');
            let envContent = `OPENROUTER_API_KEY=${apiKey}\n`;
            
            // If .env.example exists, use it as a template
            const examplePath = envPath.replace('.env', '.env.example');
            if (fs.existsSync(examplePath)) {
                const template = await fs.promises.readFile(examplePath, 'utf8');
                envContent = template.replace(
                    /^OPENROUTER_API_KEY=$/m,
                    `OPENROUTER_API_KEY=${apiKey}`
                );
            }

            await fs.promises.writeFile(envPath, envContent, 'utf8');
            await fs.promises.chmod(envPath, 0o600);

            vscode.window.showInformationMessage(
                `✅ API key saved to .env file\n📁 Location: ${envPath}`,
                'View .env File'
            ).then((selection) => {
                if (selection === 'View .env File') {
                    vscode.workspace.openTextDocument(envPath).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });

            return true;
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to save to .env file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return false;
        }
    }

    /**
     * Save API key to environment variable (show instructions)
     */
    private static async saveToEnvironment(apiKey: string): Promise<boolean> {
        const platform = process.platform;
        let instructions = '';

        if (platform === 'win32') {
            instructions = `Windows Setup:\n\n` +
                `1. Open System Properties → Environment Variables\n` +
                `2. Add new system variable:\n` +
                `   Name: OPENROUTER_API_KEY\n` +
                `   Value: ${apiKey}\n\n` +
                `Or use Command Prompt:\n` +
                `setx OPENROUTER_API_KEY "${apiKey}"\n\n` +
                `Restart VSCode/Cursor after setting the variable.`;
        } else {
            const shell = process.env.SHELL?.includes('zsh') ? 'zsh' : 'bash';
            const rcFile = shell === 'zsh' ? '~/.zshrc' : '~/.bashrc';
            
            instructions = `macOS/Linux Setup:\n\n` +
                `1. Add to your shell profile (${rcFile}):\n` +
                `   export OPENROUTER_API_KEY="${apiKey}"\n\n` +
                `2. Reload your shell:\n` +
                `   source ${rcFile}\n\n` +
                `3. Restart VSCode/Cursor\n\n` +
                `Or run this command:\n` +
                `echo 'export OPENROUTER_API_KEY="${apiKey}"' >> ${rcFile}`;
        }

        await vscode.env.clipboard.writeText(apiKey);
        
        const result = await vscode.window.showInformationMessage(
            `🌍 Environment Variable Setup\n\n${instructions}\n\n📋 API key copied to clipboard`,
            { modal: true },
            'Done',
            'Copy Instructions'
        );

        if (result === 'Copy Instructions') {
            await vscode.env.clipboard.writeText(instructions);
        }

        // Assume user will set it up correctly
        return result === 'Done';
    }

    /**
     * Save API key to VSCode settings (with warning)
     */
    private static async saveToSettings(apiKey: string): Promise<boolean> {
        const proceed = await vscode.window.showWarningMessage(
            '⚠️ Security Warning\n\n' +
            'Storing API keys in VSCode settings is not recommended for production use. ' +
            'The key will be stored in plain text in your settings file.\n\n' +
            'For better security, consider using .env files or environment variables.',
            { modal: true },
            'Proceed Anyway',
            'Use .env Instead'
        );

        if (proceed === 'Use .env Instead') {
            return await this.saveToEnvFile(apiKey);
        } else if (proceed !== 'Proceed Anyway') {
            return false;
        }

        try {
            const config = vscode.workspace.getConfiguration('docGenerator.ai');
            await config.update('openRouterApiKey', apiKey, vscode.ConfigurationTarget.Workspace);
            
            vscode.window.showInformationMessage(
                '✅ API key saved to VSCode settings\n⚠️ Remember to remove it before sharing your workspace'
            );
            
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to save to settings: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return false;
        }
    }

    /**
     * Check if setup is needed before running AI commands
     */
    public static async ensureSetup(context: vscode.ExtensionContext): Promise<boolean> {
        // Check if AI is configured
        const isConfigured = await aiService.isConfigured();
        if (isConfigured) {
            return true;
        }

        // Check if user previously skipped setup
        const setupSkipped = context.globalState.get<boolean>(this.SETUP_SKIPPED_KEY, false);
        if (setupSkipped) {
            const tryAgain = await vscode.window.showInformationMessage(
                '🤖 AI features require an OpenRouter API key. Would you like to set it up now?',
                'Setup Now',
                'Not Now'
            );
            
            if (tryAgain === 'Setup Now') {
                // Clear skipped flag and run setup
                await context.globalState.update(this.SETUP_SKIPPED_KEY, false);
                return await this.runSetup(context);
            }
            return false;
        }

        // Run first-time setup
        return await this.runSetup(context);
    }

    /**
     * Reset setup state (for debugging/testing)
     */
    public static async resetSetupState(context: vscode.ExtensionContext): Promise<void> {
        await context.globalState.update(this.SETUP_COMPLETED_KEY, false);
        await context.globalState.update(this.SETUP_SKIPPED_KEY, false);
        vscode.window.showInformationMessage('Setup state reset. First-time setup will run on next AI command.');
    }
}
