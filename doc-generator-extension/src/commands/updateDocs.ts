import * as vscode from 'vscode';
import { DocumentationProvider } from '../providers/documentationProvider';

export async function updateDocsCommand(documentationProvider: DocumentationProvider): Promise<void> {
    try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // Check if documentation already exists
        const hasExistingDocs = await documentationProvider.hasExistingDocumentation(workspaceRoot);
        
        if (!hasExistingDocs) {
            const generateFirst = await vscode.window.showInformationMessage(
                'No existing documentation found. Would you like to generate it first?',
                'Generate Documentation',
                'Cancel'
            );
            
            if (generateFirst === 'Generate Documentation') {
                vscode.commands.executeCommand('docGenerator.generateDocs');
            }
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Updating Documentation",
            cancellable: true
        }, async (progress, token) => {
            
            progress.report({ increment: 0, message: "Analyzing changes since last update..." });
            
            // Get changes since last documentation update
            const changes = await documentationProvider.getChangesSinceLastUpdate(workspaceRoot);
            
            if (token.isCancellationRequested) {
                return;
            }
            
            if (changes.changedFiles.length === 0) {
                vscode.window.showInformationMessage('Documentation is already up to date!');
                return;
            }
            
            progress.report({ 
                increment: 25, 
                message: `Found ${changes.changedFiles.length} changed files...` 
            });
            
            // Analyze only changed files
            progress.report({ increment: 40, message: "Analyzing changed code..." });
            const analysisResult = await documentationProvider.analyzeChangedFiles(changes.changedFiles);
            
            if (token.isCancellationRequested) {
                return;
            }
            
            // Update documentation incrementally
            progress.report({ increment: 70, message: "Updating documentation..." });
            const updatedFiles = await documentationProvider.updateDocumentation(analysisResult, changes);
            
            if (token.isCancellationRequested) {
                return;
            }
            
            // Save updated documentation
            progress.report({ increment: 90, message: "Saving updated documentation..." });
            await documentationProvider.saveDocumentation(updatedFiles);
            
            progress.report({ increment: 100, message: "Documentation update complete!" });
            
            // Show summary of changes
            const changesSummary = generateChangesSummary(changes, updatedFiles);
            const viewChanges = await vscode.window.showInformationMessage(
                `Documentation updated successfully! ${updatedFiles.length} files modified.`,
                'View Changes',
                'Open Documentation'
            );
            
            if (viewChanges === 'View Changes') {
                showChangesPanel(changesSummary);
            } else if (viewChanges === 'Open Documentation') {
                const config = vscode.workspace.getConfiguration('docGenerator');
                const outputDir = config.get<string>('outputDirectory') || './docs';
                const docsPath = vscode.Uri.file(`${workspaceRoot}/${outputDir}`);
                vscode.commands.executeCommand('vscode.openFolder', docsPath, { forceNewWindow: false });
            }
        });
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to update documentation: ${errorMessage}`);
        console.error('Documentation update error:', error);
    }
}

interface ChangesSummary {
    addedFunctions: number;
    modifiedFunctions: number;
    deletedFunctions: number;
    addedClasses: number;
    modifiedClasses: number;
    deletedClasses: number;
    updatedFiles: string[];
}

function generateChangesSummary(changes: any, updatedFiles: any[]): ChangesSummary {
    // This would be implemented based on the actual change analysis
    return {
        addedFunctions: changes.addedElements?.functions?.length || 0,
        modifiedFunctions: changes.modifiedElements?.functions?.length || 0,
        deletedFunctions: changes.deletedElements?.functions?.length || 0,
        addedClasses: changes.addedElements?.classes?.length || 0,
        modifiedClasses: changes.modifiedElements?.classes?.length || 0,
        deletedClasses: changes.deletedElements?.classes?.length || 0,
        updatedFiles: updatedFiles.map(file => file.path)
    };
}

function showChangesPanel(summary: ChangesSummary): void {
    const panel = vscode.window.createWebviewPanel(
        'docChanges',
        'Documentation Changes',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getChangesWebviewContent(summary);
}

function getChangesWebviewContent(summary: ChangesSummary): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentation Changes</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                margin: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .changes-header {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .changes-section {
                margin-bottom: 20px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-radius: 4px;
            }
            .change-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .change-item:last-child {
                border-bottom: none;
            }
            .change-count {
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }
            .files-list {
                list-style: none;
                padding: 0;
            }
            .files-list li {
                padding: 4px 0;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 13px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="changes-header">
                <h1>Documentation Changes Summary</h1>
                <p>Overview of changes made to the documentation</p>
            </div>
            
            <div class="changes-section">
                <h2>Code Elements Changes</h2>
                <div class="change-item">
                    <span>Functions Added</span>
                    <span class="change-count">${summary.addedFunctions}</span>
                </div>
                <div class="change-item">
                    <span>Functions Modified</span>
                    <span class="change-count">${summary.modifiedFunctions}</span>
                </div>
                <div class="change-item">
                    <span>Functions Deleted</span>
                    <span class="change-count">${summary.deletedFunctions}</span>
                </div>
                <div class="change-item">
                    <span>Classes Added</span>
                    <span class="change-count">${summary.addedClasses}</span>
                </div>
                <div class="change-item">
                    <span>Classes Modified</span>
                    <span class="change-count">${summary.modifiedClasses}</span>
                </div>
                <div class="change-item">
                    <span>Classes Deleted</span>
                    <span class="change-count">${summary.deletedClasses}</span>
                </div>
            </div>
            
            <div class="changes-section">
                <h2>Updated Documentation Files</h2>
                <ul class="files-list">
                    ${summary.updatedFiles.map(file => `<li>${file}</li>`).join('')}
                </ul>
            </div>
        </div>
    </body>
    </html>`;
}
