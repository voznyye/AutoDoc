import { AnalysisResult } from '../analyzers/codeAnalyzer';
import { ChangesSinceLastUpdate } from '../types/documentation';
import { ReadmeGenerator } from './readmeGenerator';
import { aiService, DocumentationRequest } from '../services/aiService';
import * as vscode from 'vscode';

export class AIEnhancedReadmeGenerator extends ReadmeGenerator {
    
    public async generate(analysisResult: AnalysisResult): Promise<string> {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        const aiEnabled = config.get<boolean>('enabled', false);
        
        if (!aiEnabled || !aiService.isConfigured()) {
            // Fallback to regular generation
            return super.generate(analysisResult);
        }
        
        try {
            // First generate basic README structure
            const basicReadme = await super.generate(analysisResult);
            
            // Then enhance it with AI
            return await this.enhanceWithAI(analysisResult, basicReadme);
        } catch (error) {
            console.error('AI enhancement failed, falling back to basic generation:', error);
            return super.generate(analysisResult);
        }
    }
    
    public async update(analysisResult: AnalysisResult, changes: ChangesSinceLastUpdate): Promise<string> {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        const aiEnabled = config.get<boolean>('enabled', false);
        const enhanceExisting = config.get<boolean>('enhanceExisting', true);
        
        if (!aiEnabled || !aiService.isConfigured()) {
            return super.update(analysisResult, changes);
        }
        
        try {
            if (enhanceExisting) {
                // Get existing README and enhance it
                const existingReadme = await this.getExistingReadme();
                return await this.updateWithAI(analysisResult, changes, existingReadme);
            } else {
                // Generate completely new README
                return await this.generate(analysisResult);
            }
        } catch (error) {
            console.error('AI update failed, falling back to basic update:', error);
            return super.update(analysisResult, changes);
        }
    }
    
    public async enhanceWithAI(analysisResult: AnalysisResult, basicReadme: string): Promise<string> {
        const context = this.buildEnhancementContext(analysisResult);
        
        const request: DocumentationRequest = {
            type: 'readme',
            context: context,
            existingContent: basicReadme,
            projectInfo: {
                name: analysisResult.metadata?.projectName || 'Project',
                description: analysisResult.metadata?.description || undefined,
                dependencies: analysisResult.dependencies || undefined,
                scripts: (analysisResult.metadata as any)?.scripts || undefined
            }
        };
        
        try {
            // Use the best model for quality README generation
            const bestModel = await aiService.selectBestModel('quality');
            const response = await aiService.generateDocumentation(request, bestModel);
            
            return this.postProcessAIReadme(response.content, analysisResult);
        } catch (error) {
            console.error('AI enhancement error:', error);
            return basicReadme;
        }
    }
    
    private async updateWithAI(
        analysisResult: AnalysisResult, 
        changes: ChangesSinceLastUpdate, 
        existingReadme: string
    ): Promise<string> {
        const context = this.buildUpdateContext(analysisResult, changes);
        
        const request: DocumentationRequest = {
            type: 'readme',
            context: context,
            existingContent: existingReadme,
            projectInfo: {
                name: analysisResult.metadata?.projectName || 'Project',
                description: analysisResult.metadata?.description || undefined,
                dependencies: analysisResult.dependencies || undefined,
                scripts: (analysisResult.metadata as any)?.scripts || undefined
            }
        };
        
        try {
            const bestModel = await aiService.selectBestModel('quality');
            const response = await aiService.generateDocumentation(request, bestModel);
            
            return this.postProcessAIReadme(response.content, analysisResult);
        } catch (error) {
            console.error('AI update error:', error);
            return existingReadme;
        }
    }
    
    private buildEnhancementContext(analysisResult: AnalysisResult): string {
        let context = 'Project Analysis Results:\n\n';
        
        // Project metadata
        if (analysisResult.metadata) {
            context += 'Project Metadata:\n';
            context += `- Name: ${analysisResult.metadata.projectName || 'Unknown'}\n`;
            context += `- Description: ${analysisResult.metadata.description || 'No description'}\n`;
            context += `- Version: ${analysisResult.metadata.version || 'Unknown'}\n`;
            if ((analysisResult.metadata as any)?.scripts) {
                context += `- Available Scripts: ${Object.keys((analysisResult.metadata as any).scripts).join(', ')}\n`;
            }
            context += '\n';
        }
        
        // Code structure summary
        const classes = analysisResult.elements.filter(e => e.type === 'class');
        const functions = analysisResult.elements.filter(e => e.type === 'function');
        const interfaces = analysisResult.elements.filter(e => e.type === 'interface');
        
        context += 'Code Structure:\n';
        context += `- ${classes.length} classes\n`;
        context += `- ${functions.length} functions\n`;
        context += `- ${interfaces.length} interfaces\n`;
        context += `- ${analysisResult.dependencies.length} dependencies\n`;
        context += `- ${analysisResult.metrics.linesOfCode} lines of code\n\n`;
        
        // Key components (top classes and functions)
        if (classes.length > 0) {
            context += 'Main Classes:\n';
            classes.slice(0, 5).forEach(cls => {
                context += `- ${cls.name}`;
                if (cls.description) {
                    context += `: ${cls.description}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        if (functions.length > 0) {
            context += 'Main Functions:\n';
            functions.slice(0, 5).forEach(func => {
                context += `- ${func.name}`;
                if (func.description) {
                    context += `: ${func.description}`;
                }
                if (func.parameters && func.parameters.length > 0) {
                    const paramTypes = func.parameters.map(p => p.type).join(', ');
                    context += ` (${paramTypes})`;
                }
                if (func.returnType) {
                    context += ` -> ${func.returnType}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        // Dependencies
        if (analysisResult.dependencies.length > 0) {
            context += 'Key Dependencies:\n';
            analysisResult.dependencies.slice(0, 10).forEach(dep => {
                context += `- ${dep}\n`;
            });
            context += '\n';
        }
        
        return context;
    }
    
    private buildUpdateContext(analysisResult: AnalysisResult, changes: ChangesSinceLastUpdate): string {
        let context = this.buildEnhancementContext(analysisResult);
        
        context += 'Recent Changes:\n\n';
        
        if (changes.changedFiles.length > 0) {
            context += 'Modified Files:\n';
            changes.changedFiles.forEach(file => {
                context += `- ${file}\n`;
            });
            context += '\n';
        }
        
        if ((changes as any).addedFunctions?.length > 0) {
            context += 'New Functions:\n';
            (changes as any).addedFunctions.forEach((func: any) => {
                context += `- ${func.name}`;
                if (func.description) {
                    context += `: ${func.description}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        if ((changes as any).modifiedFunctions?.length > 0) {
            context += 'Modified Functions:\n';
            (changes as any).modifiedFunctions.forEach((func: any) => {
                context += `- ${func.name}`;
                if (func.description) {
                    context += `: ${func.description}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        if ((changes as any).addedClasses?.length > 0) {
            context += 'New Classes:\n';
            (changes as any).addedClasses.forEach((cls: any) => {
                context += `- ${cls.name}`;
                if (cls.description) {
                    context += `: ${cls.description}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        context += 'Please update the README to reflect these changes while preserving the existing structure and any custom content.';
        
        return context;
    }
    
    private postProcessAIReadme(aiContent: string, analysisResult: AnalysisResult): string {
        let processedContent = aiContent;
        
        // Ensure proper metadata is included
        if (!processedContent.includes('![Auto-Generated]')) {
            const timestamp = new Date().toISOString().split('T')[0];
            const badges = `![Auto-Generated](https://img.shields.io/badge/docs-auto--generated-brightgreen.svg)\n![Last Updated](https://img.shields.io/badge/updated-${timestamp}-blue.svg)\n![AI Enhanced](https://img.shields.io/badge/AI-enhanced-purple.svg)\n\n`;
            
            // Try to insert after the first heading
            const firstHeadingMatch = processedContent.match(/^# .+$/m);
            if (firstHeadingMatch) {
                const insertIndex = processedContent.indexOf(firstHeadingMatch[0]) + firstHeadingMatch[0].length + 1;
                processedContent = processedContent.slice(0, insertIndex) + badges + processedContent.slice(insertIndex);
            } else {
                processedContent = badges + processedContent;
            }
        }
        
        // Add generation footer if not present
        if (!processedContent.includes('automatically generated')) {
            const timestamp = new Date().toISOString();
            const footer = `\n\n---\n\n*This README was automatically generated with AI assistance on ${timestamp.split('T')[0]} by the Documentation Generator.*\n\n*Enhanced by AI to provide comprehensive project documentation. To update, run the documentation generator or make changes to the source code and commit.*\n`;
            processedContent += footer;
        }
        
        // Ensure project metrics are accurate
        processedContent = this.updateMetricsInContent(processedContent, analysisResult);
        
        return processedContent;
    }
    
    private updateMetricsInContent(content: string, analysisResult: AnalysisResult): string {
        let updatedContent = content;
        
        // Update lines of code if mentioned
        const locRegex = /(\*\*Lines of Code:\*\*\s*)\d+/g;
        updatedContent = updatedContent.replace(locRegex, `$1${analysisResult.metrics.linesOfCode.toLocaleString()}`);
        
        // Update total files if mentioned
        const filesCount = this.countTotalFiles(analysisResult.fileStructure);
        const filesRegex = /(\*\*Total Files:\*\*\s*)\d+/g;
        updatedContent = updatedContent.replace(filesRegex, `$1${filesCount}`);
        
        // Update code elements count if mentioned
        const elementsRegex = /(\*\*Code Elements:\*\*\s*)\d+/g;
        updatedContent = updatedContent.replace(elementsRegex, `$1${analysisResult.elements.length}`);
        
        // Update dependencies count if mentioned
        const depsRegex = /(\*\*Dependencies:\*\*\s*)\d+/g;
        updatedContent = updatedContent.replace(depsRegex, `$1${analysisResult.dependencies.length}`);
        
        return updatedContent;
    }
    
    private async getExistingReadme(): Promise<string> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return '';
            }
            
            const readmePath = vscode.Uri.joinPath(workspaceFolders[0].uri, 'README.md');
            const readmeContent = await vscode.workspace.fs.readFile(readmePath);
            return new TextDecoder().decode(readmeContent);
        } catch (error) {
            // README doesn't exist or can't be read
            return '';
        }
    }
    
    private countTotalFiles(nodes: any[]): number {
        let count = 0;
        for (const node of nodes) {
            if (node.type === 'file') {
                count++;
            } else if (node.type === 'directory' && node.children) {
                count += this.countTotalFiles(node.children);
            }
        }
        return count;
    }
    
    /**
     * Generate a smart, context-aware project description using AI
     */
    public async generateSmartDescription(analysisResult: AnalysisResult): Promise<string> {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        const aiEnabled = config.get<boolean>('enabled', false);
        
        if (!aiEnabled || !aiService.isConfigured()) {
            return analysisResult.metadata?.description || 'A software project with auto-generated documentation.';
        }
        
        try {
            const context = this.buildProjectAnalysisForDescription(analysisResult);
            
            const request: DocumentationRequest = {
                type: 'description',
                context: context,
                projectInfo: {
                    name: analysisResult.metadata?.projectName || 'Project',
                    description: analysisResult.metadata?.description || undefined,
                    dependencies: analysisResult.dependencies || undefined,
                    scripts: (analysisResult.metadata as any)?.scripts || undefined
                }
            };
            
            const fastModel = await aiService.selectBestModel('speed');
            const response = await aiService.generateDocumentation(request, fastModel);
            
            return response.content.trim();
        } catch (error) {
            console.error('AI description generation failed:', error);
            return analysisResult.metadata?.description || 'A software project with auto-generated documentation.';
        }
    }
    
    private buildProjectAnalysisForDescription(analysisResult: AnalysisResult): string {
        let context = 'Analyze this project and generate a clear, concise description (1-2 sentences) that explains what this project does:\n\n';
        
        // Project structure overview
        const classes = analysisResult.elements.filter(e => e.type === 'class');
        const functions = analysisResult.elements.filter(e => e.type === 'function');
        const interfaces = analysisResult.elements.filter(e => e.type === 'interface');
        
        context += `Project has ${classes.length} classes, ${functions.length} functions, ${interfaces.length} interfaces.\n\n`;
        
        // Key components with their descriptions
        if (classes.length > 0) {
            context += 'Main classes and their purposes:\n';
            classes.slice(0, 3).forEach(cls => {
                context += `- ${cls.name}`;
                if (cls.description) {
                    context += `: ${cls.description}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        if (functions.length > 0) {
            context += 'Key functions:\n';
            functions.slice(0, 3).forEach(func => {
                context += `- ${func.name}`;
                if (func.description) {
                    context += `: ${func.description}`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        // Dependencies hint at project type
        if (analysisResult.dependencies?.length > 0) {
            context += `Uses dependencies: ${analysisResult.dependencies.slice(0, 5).join(', ')}\n\n`;
        }
        
        context += 'Generate a professional, clear description that captures what this project does and its main purpose.';
        
        return context;
    }

    /**
     * Generate a comprehensive project overview for detailed documentation
     */
    public async generateComprehensiveOverview(analysisResult: AnalysisResult): Promise<string> {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        const aiEnabled = config.get<boolean>('enabled', false);
        
        if (!aiEnabled || !aiService.isConfigured()) {
            return this.generateFallbackOverview(analysisResult);
        }
        
        try {
            const context = this.buildComprehensiveProjectContext(analysisResult);
            
            const request: DocumentationRequest = {
                type: 'readme',
                context: context,
                projectInfo: {
                    name: analysisResult.metadata?.projectName || 'Project',
                    description: analysisResult.metadata?.description || undefined,
                    dependencies: analysisResult.dependencies || undefined,
                    scripts: (analysisResult.metadata as any)?.scripts || undefined
                }
            };
            
            const qualityModel = await aiService.selectBestModel('quality');
            const response = await aiService.generateDocumentation(request, qualityModel);
            
            return response.content;
        } catch (error) {
            console.error('AI comprehensive overview generation failed:', error);
            return this.generateFallbackOverview(analysisResult);
        }
    }

    private buildComprehensiveProjectContext(analysisResult: AnalysisResult): string {
        let context = `**MISSION: Create a comprehensive, human-readable project overview that explains what this project ACTUALLY DOES and why someone would use it.**

**PROJECT ANALYSIS:**

`;
        
        // Project metadata
        if (analysisResult.metadata) {
            context += `**Project Information:**
- Name: ${analysisResult.metadata.projectName || 'Unknown Project'}
- Current Description: ${analysisResult.metadata.description || 'None provided'}
- Version: ${analysisResult.metadata.version || 'Unknown'}
- Main Dependencies: ${analysisResult.dependencies.slice(0, 8).join(', ') || 'None'}
- Available Scripts: ${Object.keys((analysisResult.metadata as any)?.scripts || {}).join(', ') || 'None'}

`;
        }
        
        // Code structure with emphasis on functionality
        const classes = analysisResult.elements.filter(e => e.type === 'class');
        const functions = analysisResult.elements.filter(e => e.type === 'function');
        const interfaces = analysisResult.elements.filter(e => e.type === 'interface');
        const publicElements = analysisResult.elements.filter(e => e.visibility === 'public');
        
        context += `**Codebase Structure:**
- Total Code Elements: ${analysisResult.elements.length}
- Classes: ${classes.length}
- Functions: ${functions.length}
- Interfaces: ${interfaces.length}
- Public API Elements: ${publicElements.length}
- Lines of Code: ${analysisResult.metrics.linesOfCode.toLocaleString()}
- Average Complexity: ${analysisResult.metrics.complexity}

`;
        
        // Core functionality analysis
        if (classes.length > 0) {
            context += `**Core Classes (what they do):**
`;
            classes.slice(0, 6).forEach(cls => {
                context += `- **${cls.name}**`;
                if (cls.description) {
                    context += `: ${cls.description}`;
                } else {
                    context += `: [Main class component]`;
                }
                if (cls.extends) {
                    context += ` (extends ${cls.extends})`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        if (functions.length > 0) {
            context += `**Key Functions (what they do):**
`;
            functions.slice(0, 8).forEach(func => {
                context += `- **${func.name}**`;
                if (func.description) {
                    context += `: ${func.description}`;
                } else if (func.parameters && func.parameters.length > 0) {
                    context += `: Takes ${func.parameters.map(p => p.type).join(', ')}`;
                    if (func.returnType && func.returnType !== 'void') {
                        context += ` → Returns ${func.returnType}`;
                    }
                } else {
                    context += `: [Core function]`;
                }
                context += '\n';
            });
            context += '\n';
        }
        
        // File structure insights
        if (analysisResult.fileStructure && analysisResult.fileStructure.length > 0) {
            context += `**Project Structure Analysis:**
`;
            const topLevelDirs = analysisResult.fileStructure.filter(n => n.type === 'directory').slice(0, 6);
            const topLevelFiles = analysisResult.fileStructure.filter(n => n.type === 'file').slice(0, 6);
            
            if (topLevelDirs.length > 0) {
                context += 'Main directories: ' + topLevelDirs.map(d => d.name).join(', ') + '\n';
            }
            if (topLevelFiles.length > 0) {
                context += 'Key files: ' + topLevelFiles.map(f => f.name).join(', ') + '\n';
            }
            context += '\n';
        }
        
        // Technology stack analysis
        if (analysisResult.dependencies && analysisResult.dependencies.length > 0) {
            const frameworks = this.identifyFrameworks(analysisResult.dependencies);
            const libraries = this.identifyLibraries(analysisResult.dependencies);
            
            if (frameworks.length > 0 || libraries.length > 0) {
                context += `**Technology Stack:**
`;
                if (frameworks.length > 0) {
                    context += `Frameworks: ${frameworks.join(', ')}\n`;
                }
                if (libraries.length > 0) {
                    context += `Key Libraries: ${libraries.slice(0, 8).join(', ')}\n`;
                }
                context += '\n';
            }
        }
        
        context += `**YOUR TASK:** Generate a comprehensive README that:

1. **Immediately explains WHAT this project does** (in the first sentence)
2. **Shows WHY someone would want to use it** (real benefits)
3. **Demonstrates HOW to get started** (practical examples)
4. **Covers all major functionality** based on the code analysis above
5. **Uses engaging, human language** - no corporate speak!

Write like you're excited about this project and want others to try it. Make it practical, clear, and helpful!`;
        
        return context;
    }

    private identifyFrameworks(dependencies: string[]): string[] {
        const frameworks: string[] = [];
        const frameworkPatterns = [
            'react', 'vue', 'angular', 'svelte', 'express', 'fastify', 'koa',
            'nestjs', 'nextjs', 'nuxt', 'gatsby', 'electron', 'react-native',
            'django', 'flask', 'fastapi', 'spring', 'rails', 'laravel'
        ];
        
        dependencies.forEach(dep => {
            frameworkPatterns.forEach(pattern => {
                if (dep.toLowerCase().includes(pattern)) {
                    frameworks.push(dep);
                }
            });
        });
        
        return [...new Set(frameworks)];
    }

    private identifyLibraries(dependencies: string[]): string[] {
        return dependencies.filter(dep => {
            // Filter out common dev dependencies
            const devPatterns = ['@types/', 'eslint', 'prettier', 'webpack', 'babel', 'jest', 'mocha', 'chai'];
            return !devPatterns.some(pattern => dep.includes(pattern));
        });
    }

    private generateFallbackOverview(analysisResult: AnalysisResult): string {
        return `# ${analysisResult.metadata?.projectName || 'Project'}

${analysisResult.metadata?.description || 'A software project with comprehensive functionality.'}

## Overview

This project contains ${analysisResult.elements.length} code elements including ${analysisResult.elements.filter(e => e.type === 'class').length} classes and ${analysisResult.elements.filter(e => e.type === 'function').length} functions.

## Features

- Comprehensive codebase with ${analysisResult.metrics.linesOfCode.toLocaleString()} lines of code
- Built with ${analysisResult.dependencies.length} dependencies
- Well-structured architecture

## Getting Started

[Installation and usage instructions would go here]

---

*Documentation generated automatically. For more details, explore the source code.*`;
    }
}
