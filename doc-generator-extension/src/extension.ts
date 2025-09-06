import * as vscode from 'vscode';
import { DocumentationGenerator } from './services/documentationGenerator';
import { GitCommitIntegration } from './services/gitCommitIntegration';
import { SettingsManager } from './utils/settingsManager';

let gitCommitIntegration: GitCommitIntegration | undefined;
let documentationGenerator: DocumentationGenerator | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('🤖 AI Documentation Generator extension is now active!');

    // Initialize the documentation generator once
    documentationGenerator = new DocumentationGenerator();

    // Command 1: Generate Full Documentation (Manual)
    const generateCommand = vscode.commands.registerCommand(
        'ai-doc-generator.generate',
        async () => {
            try {
                vscode.window.showInformationMessage('Generating documentation...');
                await documentationGenerator!.generateAllDocumentation();
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
            
            // Reinitialize git integration when toggled
            if (!current && gitCommitIntegration) {
                console.log('Enabling git commit integration...');
            } else if (current && gitCommitIntegration) {
                console.log('Disabling git commit integration...');
            }
            
            vscode.window.showInformationMessage(`Auto-update on commit: ${!current ? 'enabled' : 'disabled'}`);
        }
    );

    // Command 4: Manually trigger documentation update after commit
    const updateAfterCommitCommand = vscode.commands.registerCommand(
        'ai-doc-generator.updateAfterCommit',
        async () => {
            try {
                if (!gitCommitIntegration) {
                    vscode.window.showErrorMessage('Git integration not initialized');
                    return;
                }
                
                vscode.window.showInformationMessage('Checking for recent commits and updating documentation...');
                await gitCommitIntegration.manuallyTriggerUpdate();
            } catch (error) {
                console.error('Manual documentation update failed:', error);
                vscode.window.showErrorMessage(`Failed to update documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    );

    // Add commands to subscriptions for proper cleanup
    context.subscriptions.push(
        generateCommand, 
        settingsCommand, 
        toggleAutoUpdateCommand,
        updateAfterCommitCommand
    );
    
    // Initialize git integration with the shared generator instance
    gitCommitIntegration = new GitCommitIntegration(documentationGenerator);
    context.subscriptions.push({
        dispose: () => {
            if (gitCommitIntegration) {
                gitCommitIntegration.cleanup();
            }
        }
    });

    // Set up status bar
    setupStatusBar(context);

    // Check if auto-update is enabled and show appropriate message
    const autoUpdateEnabled = vscode.workspace.getConfiguration('ai-doc-generator').get<boolean>('autoUpdateOnCommit', false);
    if (autoUpdateEnabled) {
        vscode.window.showInformationMessage('🤖 AI Documentation Generator is ready with auto-update on commit enabled!');
    } else {
        vscode.window.showInformationMessage('🤖 AI Documentation Generator is ready! Start with "Generate Project Documentation"');
    }
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


