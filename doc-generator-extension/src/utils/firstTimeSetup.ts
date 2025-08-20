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

            // Step 3: Save to system environment variable
            const saved = await this.saveToSystemEnvironment(apiKey);
            
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
     * Save API key to system environment variable
     */
    private static async saveToSystemEnvironment(apiKey: string): Promise<boolean> {
        try {
            const platform = process.platform;
            
            const proceed = await vscode.window.showInformationMessage(
                `🔐 Saving API key to system environment variables\n\n` +
                `This will add OPENROUTER_API_KEY to your system environment.\n` +
                `${platform === 'win32' ? 'Windows: Uses setx command' : 'macOS/Linux: Adds to shell profile'}\n\n` +
                `✅ Most secure option\n` +
                `✅ Works system-wide\n` +
                `✅ No files to accidentally commit\n\n` +
                `Continue?`,
                { modal: true },
                'Save to System',
                'Cancel'
            );

            if (proceed !== 'Save to System') {
                return false;
            }

            // Show progress while setting environment variable
            const success = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Setting system environment variable...',
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ increment: 0, message: 'Configuring system environment...' });
                    
                    await environmentManager.setSystemEnvironmentVariable('OPENROUTER_API_KEY', apiKey);
                    
                    progress.report({ increment: 100, message: 'Done!' });
                    return true;
                } catch (error) {
                    console.error('Failed to set environment variable:', error);
                    return false;
                }
            });

            if (success) {
                const restartMessage = platform === 'win32' 
                    ? 'Environment variable set! Please restart VSCode/Cursor for changes to take effect.'
                    : 'Environment variable added to shell profile! Please restart VSCode/Cursor or reload your shell.';

                vscode.window.showInformationMessage(
                    `✅ ${restartMessage}`,
                    'Restart Now'
                ).then((selection) => {
                    if (selection === 'Restart Now') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
                
                return true;
            } else {
                vscode.window.showErrorMessage(
                    'Failed to set system environment variable. Please set OPENROUTER_API_KEY manually.'
                );
                return false;
            }
            
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`
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
