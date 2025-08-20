import * as vscode from 'vscode';
import { DocumentationGenerator } from './documentationGenerator';

export class GitCommitIntegration {
    private documentationGenerator: DocumentationGenerator;
    private commitWatcher: vscode.FileSystemWatcher | undefined;

    constructor(generator: DocumentationGenerator) {
        this.documentationGenerator = generator;
        this.setupCommitHooks();
    }

    /**
     * Set up commit hooks to trigger documentation regeneration after commits
     */
    private setupCommitHooks(): void {
        // Watch for completed commits (not file changes)
        this.commitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/COMMIT_EDITMSG');
        
        this.commitWatcher.onDidChange(async () => {
            // Only trigger after commit is complete
            setTimeout(async () => {
                await this.handlePostCommit();
            }, 1000); // Small delay to ensure commit is finished
        });
    }

    /**
     * Handle post-commit documentation regeneration
     */
    private async handlePostCommit(): Promise<void> {
        const autoUpdateEnabled = vscode.workspace.getConfiguration('ai-doc-generator').get<boolean>('autoUpdateOnCommit');
        
        if (!autoUpdateEnabled) return;

        try {
            // Full documentation regeneration (not incremental)
            await this.documentationGenerator.generateAllDocumentation();
            
            // Stage the updated documentation files for next commit
            await this.stageDocumentationFiles();
            
            vscode.window.showInformationMessage('📚 Documentation updated after commit and staged for next commit');
        } catch (error) {
            console.error('Post-commit documentation update failed:', error);
            vscode.window.showWarningMessage('⚠️ Failed to update documentation after commit');
        }
    }

    /**
     * Stage documentation files for the next commit
     */
    private async stageDocumentationFiles(): Promise<void> {
        try {
            // Add README.md and PROJECT_OVERVIEW.md to git staging
            const terminal = vscode.window.createTerminal('Git Documentation Update');
            terminal.sendText('git add README.md PROJECT_OVERVIEW.md');
            terminal.hide();
            
            console.log('✅ Documentation files staged for next commit');
        } catch (error) {
            console.error('Failed to stage documentation files:', error);
        }
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        if (this.commitWatcher) {
            this.commitWatcher.dispose();
        }
    }
}
