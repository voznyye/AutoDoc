import * as vscode from 'vscode';
import { DocumentationProvider } from '../providers/documentationProvider';

export async function generateDocsCommand(documentationProvider: DocumentationProvider): Promise<void> {
    try {
        vscode.window.showInformationMessage('Generating documentation...');
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Generating Documentation",
            cancellable: true
        }, async (progress, token) => {
            
            progress.report({ increment: 0, message: "Analyzing project structure..." });
            
            // Check if cancellation was requested
            if (token.isCancellationRequested) {
                return;
            }
            
            // Analyze the codebase
            progress.report({ increment: 20, message: "Analyzing code files..." });
            const analysisResult = await documentationProvider.analyzeCodebase(workspaceRoot);
            
            if (token.isCancellationRequested) {
                return;
            }
            
            // Generate documentation
            progress.report({ increment: 50, message: "Generating documentation files..." });
            const generatedFiles = await documentationProvider.generateDocumentation(analysisResult);
            
            if (token.isCancellationRequested) {
                return;
            }
            
            // Save generated files
            progress.report({ increment: 80, message: "Saving documentation files..." });
            await documentationProvider.saveDocumentation(generatedFiles);
            
            progress.report({ increment: 100, message: "Documentation generation complete!" });
            
            // Show success message with option to open generated docs
            const openDocs = await vscode.window.showInformationMessage(
                `Documentation generated successfully! ${generatedFiles.length} files created.`,
                'Open Documentation Folder',
                'View README'
            );
            
            if (openDocs === 'Open Documentation Folder') {
                const config = vscode.workspace.getConfiguration('docGenerator');
                const outputDir = config.get<string>('outputDirectory') || './docs';
                const docsPath = vscode.Uri.file(`${workspaceRoot}/${outputDir}`);
                vscode.commands.executeCommand('vscode.openFolder', docsPath, { forceNewWindow: false });
            } else if (openDocs === 'View README') {
                const readmePath = vscode.Uri.file(`${workspaceRoot}/README.md`);
                vscode.window.showTextDocument(readmePath);
            }
        });
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to generate documentation: ${errorMessage}`);
        console.error('Documentation generation error:', error);
    }
}

export async function generateDocsForFile(filePath: string, documentationProvider: DocumentationProvider): Promise<void> {
    try {
        vscode.window.showInformationMessage(`Generating documentation for ${filePath}...`);
        
        const analysisResult = await documentationProvider.analyzeFile(filePath);
        const generatedDocs = await documentationProvider.generateDocumentationForFile(analysisResult);
        
        await documentationProvider.saveDocumentation([generatedDocs]);
        
        vscode.window.showInformationMessage('File documentation updated successfully!');
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to generate documentation for file: ${errorMessage}`);
        console.error('File documentation generation error:', error);
    }
}
