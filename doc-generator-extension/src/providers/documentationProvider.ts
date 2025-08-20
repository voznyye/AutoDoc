import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { CodeAnalyzer, AnalysisResult } from '../analyzers/codeAnalyzer';
import { ReadmeGenerator } from '../generators/readmeGenerator';
import { GitUtils } from '../utils/gitUtils';
import { FileUtils } from '../utils/fileUtils';

export interface DocumentationFile {
    path: string;
    content: string;
    type: 'readme' | 'api' | 'changelog' | 'other';
}

export interface ChangesSinceLastUpdate {
    changedFiles: string[];
    addedFiles: string[];
    deletedFiles: string[];
    lastUpdateTime: Date;
}

export class DocumentationProvider extends EventEmitter {
    private codeAnalyzer: CodeAnalyzer;
    private markdownGenerator: MarkdownGenerator;
    private readmeGenerator: ReadmeGenerator;
    private changelogGenerator: ChangelogGenerator;
    private gitUtils: GitUtils;
    private fileUtils: FileUtils;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
        this.codeAnalyzer = new CodeAnalyzer();
        this.markdownGenerator = new MarkdownGenerator();
        this.readmeGenerator = new ReadmeGenerator();
        this.changelogGenerator = new ChangelogGenerator();
        this.gitUtils = new GitUtils();
        this.fileUtils = new FileUtils();
    }

    public onStatusChange(callback: (status: string) => void): void {
        this.on('statusChange', callback);
    }

    private emitStatusChange(status: string): void {
        this.emit('statusChange', status);
    }

    public async analyzeCodebase(workspaceRoot: string): Promise<AnalysisResult> {
        this.emitStatusChange('Analyzing');
        
        try {
            const config = vscode.workspace.getConfiguration('docGenerator');
            const supportedLanguages = config.get<string[]>('supportedLanguages') || ['typescript', 'javascript'];
            const excludePatterns = config.get<string[]>('excludePatterns') || [];
            
            const result = await this.codeAnalyzer.analyzeProject(
                workspaceRoot,
                supportedLanguages,
                excludePatterns
            );
            
            this.emitStatusChange('Ready');
            return result;
            
        } catch (error) {
            this.emitStatusChange('Error');
            throw error;
        }
    }

    public async analyzeFile(filePath: string): Promise<AnalysisResult> {
        this.emitStatusChange('Analyzing');
        
        try {
            const result = await this.codeAnalyzer.analyzeSingleFile(filePath);
            this.emitStatusChange('Ready');
            return result;
            
        } catch (error) {
            this.emitStatusChange('Error');
            throw error;
        }
    }

    public async analyzeChanges(filePath: string): Promise<void> {
        try {
            // Check if this file affects documentation
            const config = vscode.workspace.getConfiguration('docGenerator');
            const supportedLanguages = config.get<string[]>('supportedLanguages') || [];
            
            const fileExtension = path.extname(filePath).slice(1);
            const isSupported = supportedLanguages.some(lang => {
                switch (lang) {
                    case 'typescript':
                        return ['ts', 'tsx'].includes(fileExtension);
                    case 'javascript':
                        return ['js', 'jsx'].includes(fileExtension);
                    case 'python':
                        return fileExtension === 'py';
                    default:
                        return fileExtension === lang;
                }
            });

            if (isSupported) {
                this.emitStatusChange('Updating');
                // Trigger incremental update for this file
                const analysisResult = await this.analyzeFile(filePath);
                await this.updateDocumentationForFile(analysisResult);
                this.emitStatusChange('Ready');
            }
            
        } catch (error) {
            console.error('Error analyzing changes:', error);
            this.emitStatusChange('Error');
        }
    }

    public async generateDocumentation(analysisResult: AnalysisResult): Promise<DocumentationFile[]> {
        const config = vscode.workspace.getConfiguration('docGenerator');
        const outputDir = config.get<string>('outputDirectory') || './docs';
        
        const documentationFiles: DocumentationFile[] = [];

        try {
            // Generate README.md
            const readmeContent = await this.readmeGenerator.generate(analysisResult);
            documentationFiles.push({
                path: 'README.md',
                content: readmeContent,
                type: 'readme'
            });

            // Generate API documentation
            const apiContent = await this.markdownGenerator.generateApiDocumentation(analysisResult);
            documentationFiles.push({
                path: path.join(outputDir, 'API.md'),
                content: apiContent,
                type: 'api'
            });

            // Generate or update CHANGELOG.md
            const changelogContent = await this.changelogGenerator.generate(analysisResult);
            documentationFiles.push({
                path: 'CHANGELOG.md',
                content: changelogContent,
                type: 'changelog'
            });

            // Generate additional documentation files based on project structure
            const additionalDocs = await this.generateAdditionalDocumentation(analysisResult, outputDir);
            documentationFiles.push(...additionalDocs);

            return documentationFiles;
            
        } catch (error) {
            console.error('Error generating documentation:', error);
            throw new Error(`Failed to generate documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async generateDocumentationForFile(analysisResult: AnalysisResult): Promise<DocumentationFile> {
        // Generate documentation for a single file
        const apiContent = await this.markdownGenerator.generateApiDocumentation(analysisResult);
        
        return {
            path: `docs/${analysisResult.metadata?.fileName || 'file'}.md`,
            content: apiContent,
            type: 'api'
        };
    }

    public async updateDocumentationForFile(analysisResult: AnalysisResult): Promise<void> {
        // Update documentation for a single file
        const documentationFile = await this.generateDocumentationForFile(analysisResult);
        await this.saveDocumentation([documentationFile]);
    }

    public async saveDocumentation(documentationFiles: DocumentationFile[]): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        for (const docFile of documentationFiles) {
            const fullPath = path.resolve(workspaceRoot, docFile.path);
            const dirPath = path.dirname(fullPath);

            // Ensure directory exists
            await this.fileUtils.ensureDirectory(dirPath);
            
            // Write file
            await fs.promises.writeFile(fullPath, docFile.content, 'utf8');
            
            console.log(`Documentation saved: ${fullPath}`);
        }

        // Update last generation timestamp
        await this.updateLastGenerationTimestamp();
    }

    public async hasExistingDocumentation(workspaceRoot: string): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('docGenerator');
        const outputDir = config.get<string>('outputDirectory') || './docs';
        
        const docsPath = path.join(workspaceRoot, outputDir);
        const readmePath = path.join(workspaceRoot, 'README.md');
        
        try {
            const [docsExists, readmeExists] = await Promise.all([
                this.fileUtils.pathExists(docsPath),
                this.fileUtils.pathExists(readmePath)
            ]);
            
            return docsExists || readmeExists;
        } catch {
            return false;
        }
    }

    public async getChangesSinceLastUpdate(workspaceRoot: string): Promise<ChangesSinceLastUpdate> {
        try {
            const lastUpdateTime = await this.getLastGenerationTimestamp();
            const gitChanges = await this.gitUtils.getChangesSince(workspaceRoot, lastUpdateTime);
            
            return {
                changedFiles: gitChanges.modified,
                addedFiles: gitChanges.added,
                deletedFiles: gitChanges.deleted,
                lastUpdateTime
            };
        } catch (error) {
            console.error('Error getting changes since last update:', error);
            // Return empty changes if we can't determine the diff
            return {
                changedFiles: [],
                addedFiles: [],
                deletedFiles: [],
                lastUpdateTime: new Date(0)
            };
        }
    }

    public async analyzeChangedFiles(changedFiles: string[]): Promise<AnalysisResult> {
        const config = vscode.workspace.getConfiguration('docGenerator');
        const supportedLanguages = config.get<string[]>('supportedLanguages') || [];
        
        // Filter files to only supported languages
        const supportedFiles = changedFiles.filter(file => {
            const ext = path.extname(file).slice(1);
            return supportedLanguages.some(lang => {
                switch (lang) {
                    case 'typescript':
                        return ['ts', 'tsx'].includes(ext);
                    case 'javascript':
                        return ['js', 'jsx'].includes(ext);
                    case 'python':
                        return ext === 'py';
                    default:
                        return ext === lang;
                }
            });
        });

        if (supportedFiles.length === 0) {
            return {
                elements: [],
                dependencies: [],
                fileStructure: [],
                metrics: {
                    linesOfCode: 0,
                    complexity: 0
                }
            };
        }

        return await this.codeAnalyzer.analyzeFiles(supportedFiles);
    }

    public async updateDocumentation(analysisResult: AnalysisResult, changes: ChangesSinceLastUpdate): Promise<DocumentationFile[]> {
        // Perform incremental update of documentation
        const documentationFiles: DocumentationFile[] = [];

        try {
            // Update README.md if needed
            if (changes.changedFiles.some(file => file.includes('package.json') || file.includes('README'))) {
                const readmeContent = await this.readmeGenerator.update(analysisResult, changes);
                documentationFiles.push({
                    path: 'README.md',
                    content: readmeContent,
                    type: 'readme'
                });
            }

            // Update API documentation
            const config = vscode.workspace.getConfiguration('docGenerator');
            const outputDir = config.get<string>('outputDirectory') || './docs';
            
            const apiContent = await this.markdownGenerator.updateApiDocumentation(analysisResult, changes);
            documentationFiles.push({
                path: path.join(outputDir, 'API.md'),
                content: apiContent,
                type: 'api'
            });

            // Update CHANGELOG.md
            const changelogContent = await this.changelogGenerator.update(analysisResult, changes);
            documentationFiles.push({
                path: 'CHANGELOG.md',
                content: changelogContent,
                type: 'changelog'
            });

            return documentationFiles;
            
        } catch (error) {
            console.error('Error updating documentation:', error);
            throw new Error(`Failed to update documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async generateAdditionalDocumentation(analysisResult: AnalysisResult, outputDir: string): Promise<DocumentationFile[]> {
        const additionalDocs: DocumentationFile[] = [];

        // Generate module-specific documentation
        if (analysisResult.fileStructure && analysisResult.fileStructure.length > 0) {
            const moduleContent = await this.markdownGenerator.generateModuleDocumentation(analysisResult);
            additionalDocs.push({
                path: path.join(outputDir, 'modules.md'),
                content: moduleContent,
                type: 'other'
            });
        }

        // Generate examples documentation if examples are found
        const examplesContent = await this.markdownGenerator.generateExamplesDocumentation(analysisResult);
        if (examplesContent.trim()) {
            additionalDocs.push({
                path: path.join(outputDir, 'examples.md'),
                content: examplesContent,
                type: 'other'
            });
        }

        return additionalDocs;
    }

    private async getLastGenerationTimestamp(): Promise<Date> {
        try {
            const timestamp = this.context.globalState.get<string>('lastDocumentationGeneration');
            return timestamp ? new Date(timestamp) : new Date(0);
        } catch {
            return new Date(0);
        }
    }

    private async updateLastGenerationTimestamp(): Promise<void> {
        await this.context.globalState.update('lastDocumentationGeneration', new Date().toISOString());
    }
}
