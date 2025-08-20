import * as vscode from 'vscode';
import { DocumentationGenerator } from './services/documentationGenerator';
import { GitCommitIntegration } from './services/gitCommitIntegration';
import { SettingsManager } from './utils/settingsManager';

let gitCommitIntegration: GitCommitIntegration | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('🤖 AI Documentation Generator extension is now active!');

    // Command 1: Generate Full Documentation (Manual)
    const generateCommand = vscode.commands.registerCommand(
        'ai-doc-generator.generate',
        async () => {
            try {
                vscode.window.showInformationMessage('Generating documentation...');
                const generator = new DocumentationGenerator();
                await generator.generateAllDocumentation();
                vscode.window.showInformationMessage('✅ Documentation generated successfully!');
            } catch (error) {
                console.error('Documentation generation failed:', error);
                vscode.window.showErrorMessage(`❌ Failed to generate documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    );

    // Command 2: Configure Settings
    const settingsCommand = vscode.commands.registerCommand(
        'ai-doc-generator.configure',
        async () => {
            await SettingsManager.promptForApiToken();
        }
    );

    // Command 3: Toggle Auto-Update on Commit
    const toggleAutoUpdateCommand = vscode.commands.registerCommand(
        'ai-doc-generator.toggleAutoUpdate',
        async () => {
            const config = vscode.workspace.getConfiguration('ai-doc-generator');
            const current = config.get<boolean>('autoUpdateOnCommit', false);
            await config.update('autoUpdateOnCommit', !current, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Auto-update on commit: ${!current ? 'enabled' : 'disabled'}`);
        }
    );

    // Add commands to subscriptions for proper cleanup
    context.subscriptions.push(
        generateCommand, 
        settingsCommand, 
        toggleAutoUpdateCommand
    );
    
    // Initialize git integration (optional, based on settings)
    const generator = new DocumentationGenerator();
    gitCommitIntegration = new GitCommitIntegration(generator);

    // Set up status bar
    setupStatusBar(context);

    vscode.window.showInformationMessage('🤖 AI Documentation Generator is ready! Start with "Generate Project Documentation"');
}

export function deactivate() {
    console.log('🤖 AI Documentation Generator extension is now deactivated');
    
    // Cleanup git integration
    if (gitCommitIntegration) {
        gitCommitIntegration.cleanup();
    }
}

function setupStatusBar(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    
    statusBarItem.text = "$(robot) AI Docs: Ready";
    statusBarItem.tooltip = "AI Documentation Generator - Click to generate project documentation";
    statusBarItem.command = 'ai-doc-generator.generate';
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);
}


