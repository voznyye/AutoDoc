import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentationGenerator } from './documentationGenerator';
import { SettingsManager } from '../utils/settingsManager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitWatcher {
    private watcher: vscode.FileSystemWatcher | undefined;
    private documentationGenerator: DocumentationGenerator;
    private updateTimeoutId: NodeJS.Timeout | undefined;

    constructor() {
        this.documentationGenerator = new DocumentationGenerator();
    }

    /**
     * Function 4: Start watching for git commits and auto-update documentation
     */
    startWatching(): void {
        if (!SettingsManager.getAutoUpdateOnCommit()) {
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        try {
            // Watch for git commit activities
            // Method 1: Watch .git/logs/HEAD (most reliable for commits)
            this.watcher = vscode.workspace.createFileSystemWatcher('**/.git/logs/HEAD');
            
            this.watcher.onDidChange(async (_uri) => {
                console.log('Git commit detected via HEAD log change');
                await this.handleGitCommit();
            });

            // Method 2: Also watch COMMIT_EDITMSG for commit activities
            const commitMsgWatcher = vscode.workspace.createFileSystemWatcher('**/.git/COMMIT_EDITMSG');
            commitMsgWatcher.onDidChange(async (_uri) => {
                console.log('Git commit detected via COMMIT_EDITMSG change');
                await this.handleGitCommit();
            });

            console.log('🔍 Git watcher started - monitoring for commits');
        } catch (error) {
            console.error('Failed to start git watcher:', error);
        }
    }

    /**
     * Stop watching git changes
     */
    stopWatching(): void {
        if (this.watcher) {
            this.watcher.dispose();
            this.watcher = undefined;
        }

        if (this.updateTimeoutId) {
            clearTimeout(this.updateTimeoutId);
            this.updateTimeoutId = undefined;
        }

        console.log('🛑 Git watcher stopped');
    }

    /**
     * Handle git commit detection
     */
    private async handleGitCommit(): Promise<void> {
        // Debounce multiple rapid git operations
        if (this.updateTimeoutId) {
            clearTimeout(this.updateTimeoutId);
        }

        this.updateTimeoutId = setTimeout(async () => {
            try {
                await this.updateDocumentationAfterCommit();
            } catch (error) {
                console.error('Auto-update after commit failed:', error);
                // Don't show error to user to avoid disrupting git workflow
            }
        }, 2000); // Wait 2 seconds to ensure git operation is complete
    }

    /**
     * Update documentation after commit and optionally stage the changes
     */
    private async updateDocumentationAfterCommit(): Promise<void> {
        if (!SettingsManager.getAutoUpdateOnCommit()) {
            return;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            console.log('📝 Auto-updating documentation after commit...');

            // Get recent git changes
            const changes = await this.getRecentChanges(workspaceRoot);
            
            // Check if changes are significant enough to update docs
            if (await this.shouldUpdateDocumentation(changes)) {
                // Update documentation
                await this.documentationGenerator.generateAllDocumentation();

                // Stage documentation files for next commit
                await this.stageDocumentationFiles(workspaceRoot);

                console.log('✅ Documentation auto-updated and staged for next commit');
                
                // Show subtle notification
                vscode.window.showInformationMessage(
                    '📝 Documentation updated automatically',
                    { modal: false }
                );
            }
        } catch (error) {
            console.error('Auto-update documentation failed:', error);
        }
    }

    /**
     * Get recent git changes
     */
    private async getRecentChanges(workspaceRoot: string): Promise<string[]> {
        try {
            // Get files changed in the last commit
            const { stdout } = await execAsync('git diff --name-only HEAD~1 HEAD', { 
                cwd: workspaceRoot 
            });
            
            return stdout.trim().split('\n').filter(line => line.length > 0);
        } catch (error) {
            console.error('Failed to get git changes:', error);
            return [];
        }
    }

    /**
     * Determine if changes are significant enough to update documentation
     */
    private async shouldUpdateDocumentation(changes: string[]): Promise<boolean> {
        // Skip if no changes
        if (changes.length === 0) {
            return false;
        }

        // Skip if only documentation files changed (avoid infinite loops)
        const nonDocChanges = changes.filter(file => 
            !file.endsWith('.md') && 
            !file.includes('docs/') &&
            !file.includes('documentation')
        );

        if (nonDocChanges.length === 0) {
            console.log('Only documentation files changed, skipping auto-update');
            return false;
        }

        // Check if any source code files changed
        const sourceFileExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.php', '.rb'];
        const sourceChanges = nonDocChanges.filter(file => 
            sourceFileExtensions.some(ext => file.endsWith(ext))
        );

        if (sourceChanges.length > 0) {
            console.log(`Source code changes detected: ${sourceChanges.join(', ')}`);
            return true;
        }

        // Check if package.json or other config files changed
        const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', 'config.json'];
        const configChanges = nonDocChanges.filter(file => 
            configFiles.some(config => file.endsWith(config))
        );

        if (configChanges.length > 0) {
            console.log(`Configuration changes detected: ${configChanges.join(', ')}`);
            return true;
        }

        return false;
    }

    /**
     * Stage documentation files for git
     */
    private async stageDocumentationFiles(workspaceRoot: string): Promise<void> {
        try {
            const docsToStage = ['README.md', 'PROJECT_OVERVIEW.md'];
            
            for (const docFile of docsToStage) {
                const filePath = path.join(workspaceRoot, docFile);
                
                // Check if file exists before staging
                try {
                    await fs.promises.access(filePath);
                    
                    // Stage the file
                    await execAsync(`git add "${docFile}"`, { cwd: workspaceRoot });
                    console.log(`📎 Staged: ${docFile}`);
                } catch (error) {
                    // File doesn't exist, skip
                    console.log(`Skipping ${docFile} - file not found`);
                }
            }
        } catch (error) {
            console.error('Failed to stage documentation files:', error);
        }
    }


}
