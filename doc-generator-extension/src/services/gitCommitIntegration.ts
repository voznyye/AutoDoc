import * as vscode from 'vscode';
import { DocumentationGenerator } from './documentationGenerator';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export class GitCommitIntegration {
    private documentationGenerator: DocumentationGenerator;
    private headWatcher: vscode.FileSystemWatcher | undefined;
    private refWatcher: vscode.FileSystemWatcher | undefined;
    private updateTimeoutId: NodeJS.Timeout | undefined;
    private lastCommitHash: string | undefined;

    constructor(generator: DocumentationGenerator) {
        this.documentationGenerator = generator;
        this.setupCommitHooks();
    }

    /**
     * Set up commit hooks to trigger documentation regeneration after commits
     */
    private setupCommitHooks(): void {
        try {
            // Watch .git/logs/HEAD for actual commit completions
            this.headWatcher = vscode.workspace.createFileSystemWatcher('**/.git/logs/HEAD');
            
            this.headWatcher.onDidChange(async (uri) => {
                console.log('Git HEAD log changed, checking for new commits...');
                await this.checkForNewCommit(uri);
            });

            // Also watch .git/refs/heads for branch changes
            this.refWatcher = vscode.workspace.createFileSystemWatcher('**/.git/refs/heads/**');
            
            this.refWatcher.onDidChange(async (uri) => {
                console.log('Git ref changed, checking for new commits...');
                await this.checkForNewCommit(uri);
            });

            console.log('✅ Git commit watchers initialized');
        } catch (error) {
            console.error('Failed to set up git commit watchers:', error);
        }
    }

    /**
     * Check if a new commit has been made
     */
    private async checkForNewCommit(uri: vscode.Uri): Promise<void> {
        // Debounce multiple rapid changes
        if (this.updateTimeoutId) {
            clearTimeout(this.updateTimeoutId);
        }

        this.updateTimeoutId = setTimeout(async () => {
            try {
                const workspaceRoot = this.getWorkspaceRoot(uri);
                if (!workspaceRoot) return;

                // Get current commit hash
                const currentHash = await this.getCurrentCommitHash(workspaceRoot);
                
                // Check if this is a new commit
                if (currentHash && currentHash !== this.lastCommitHash) {
                    console.log(`New commit detected: ${currentHash}`);
                    this.lastCommitHash = currentHash;
                    
                    // Handle the post-commit update
                    await this.handlePostCommit(workspaceRoot);
                }
            } catch (error) {
                console.error('Error checking for new commit:', error);
            }
        }, 1500); // Wait 1.5 seconds to ensure git operations are complete
    }

    /**
     * Get the workspace root from a URI
     */
    private getWorkspaceRoot(uri: vscode.Uri): string | undefined {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return undefined;

        // Find the workspace folder that contains this git file
        for (const folder of workspaceFolders) {
            if (uri.fsPath.startsWith(folder.uri.fsPath)) {
                return folder.uri.fsPath;
            }
        }

        // Default to first workspace folder
        return workspaceFolders[0].uri.fsPath;
    }

    /**
     * Get the current commit hash
     */
    private async getCurrentCommitHash(workspaceRoot: string): Promise<string | undefined> {
        try {
            const { stdout } = await execAsync('git rev-parse HEAD', { 
                cwd: workspaceRoot 
            });
            return stdout.trim();
        } catch (error) {
            console.error('Failed to get current commit hash:', error);
            return undefined;
        }
    }

    /**
     * Handle post-commit documentation regeneration
     */
    private async handlePostCommit(workspaceRoot: string): Promise<void> {
        const autoUpdateEnabled = vscode.workspace.getConfiguration('ai-doc-generator').get<boolean>('autoUpdateOnCommit');
        
        if (!autoUpdateEnabled) {
            console.log('Auto-update on commit is disabled');
            return;
        }

        try {
            // Check if we should update documentation based on recent changes
            const shouldUpdate = await this.shouldUpdateDocumentation(workspaceRoot);
            
            if (!shouldUpdate) {
                console.log('No significant code changes detected, skipping documentation update');
                return;
            }

            console.log('📝 Updating documentation after commit...');
            
            // Show progress notification
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Updating documentation after commit...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                
                // Generate documentation
                await this.documentationGenerator.generateAllDocumentation();
                progress.report({ increment: 50 });
                
                // Stage the updated documentation files
                await this.stageDocumentationFiles(workspaceRoot);
                progress.report({ increment: 100 });
                
                return Promise.resolve();
            });
            
            vscode.window.showInformationMessage('📚 Documentation updated and staged for next commit');
        } catch (error) {
            console.error('Post-commit documentation update failed:', error);
            vscode.window.showWarningMessage('⚠️ Failed to update documentation after commit');
        }
    }

    /**
     * Check if documentation should be updated based on recent changes
     */
    private async shouldUpdateDocumentation(workspaceRoot: string): Promise<boolean> {
        try {
            // Get files changed in the last commit
            const { stdout } = await execAsync('git diff --name-only HEAD~1 HEAD', { 
                cwd: workspaceRoot 
            });
            
            const changedFiles = stdout.trim().split('\n').filter(line => line.length > 0);
            
            if (changedFiles.length === 0) {
                return false;
            }

            // Skip if only documentation files changed (avoid infinite loops)
            const nonDocChanges = changedFiles.filter(file => 
                !file.endsWith('.md') && 
                !file.includes('docs/') &&
                !file.includes('documentation') &&
                !file.includes('.doc-update-requested')
            );

            if (nonDocChanges.length === 0) {
                console.log('Only documentation files changed, skipping update');
                return false;
            }

            // Check if any source code files changed
            const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.php', '.rb', '.cpp', '.c', '.h'];
            const sourceChanges = nonDocChanges.filter(file => 
                sourceExtensions.some(ext => file.endsWith(ext))
            );

            if (sourceChanges.length > 0) {
                console.log(`Source code changes detected: ${sourceChanges.join(', ')}`);
                return true;
            }

            // Check if important config files changed
            const configFiles = ['package.json', 'tsconfig.json', 'webpack.config.js', '.env', 'config.json', 'settings.json'];
            const configChanges = nonDocChanges.filter(file => 
                configFiles.some(config => file.endsWith(config))
            );

            if (configChanges.length > 0) {
                console.log(`Configuration changes detected: ${configChanges.join(', ')}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error checking changed files:', error);
            // If we can't determine changes, proceed with update to be safe
            return true;
        }
    }

    /**
     * Stage documentation files for the next commit
     */
    private async stageDocumentationFiles(workspaceRoot: string): Promise<void> {
        try {
            const docsToStage = ['README.md', 'PROJECT_OVERVIEW.md'];
            const stagedFiles: string[] = [];
            
            for (const docFile of docsToStage) {
                const filePath = path.join(workspaceRoot, docFile);
                
                // Check if file exists before staging
                if (fs.existsSync(filePath)) {
                    try {
                        // Use git command to stage the file
                        await execAsync(`git add "${docFile}"`, { cwd: workspaceRoot });
                        stagedFiles.push(docFile);
                        console.log(`✅ Staged: ${docFile}`);
                    } catch (error) {
                        console.error(`Failed to stage ${docFile}:`, error);
                    }
                } else {
                    console.log(`Skipping ${docFile} - file not found`);
                }
            }
            
            if (stagedFiles.length > 0) {
                console.log(`📎 Documentation files staged: ${stagedFiles.join(', ')}`);
                
                // Show a subtle status bar message
                vscode.window.setStatusBarMessage(
                    `$(git-commit) Documentation staged for next commit`,
                    5000
                );
            }
        } catch (error) {
            console.error('Failed to stage documentation files:', error);
        }
    }

    /**
     * Manually trigger documentation update for the last commit
     */
    public async manuallyTriggerUpdate(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // Get current commit hash
        const currentHash = await this.getCurrentCommitHash(workspaceRoot);
        if (!currentHash) {
            throw new Error('Could not determine current commit hash');
        }
        
        console.log(`Manually triggering documentation update for commit: ${currentHash}`);
        
        // Force update regardless of auto-update setting
        const config = vscode.workspace.getConfiguration('ai-doc-generator');
        const originalSetting = config.get<boolean>('autoUpdateOnCommit', false);
        
        try {
            // Temporarily enable auto-update for this manual trigger
            await config.update('autoUpdateOnCommit', true, vscode.ConfigurationTarget.Workspace);
            
            // Trigger the update
            await this.handlePostCommit(workspaceRoot);
        } finally {
            // Restore original setting
            await config.update('autoUpdateOnCommit', originalSetting, vscode.ConfigurationTarget.Workspace);
        }
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        if (this.headWatcher) {
            this.headWatcher.dispose();
        }
        if (this.refWatcher) {
            this.refWatcher.dispose();
        }
        if (this.updateTimeoutId) {
            clearTimeout(this.updateTimeoutId);
        }
    }
}
