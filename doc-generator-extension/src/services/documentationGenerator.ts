import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SettingsManager } from '../utils/settingsManager';

export class DocumentationGenerator {
    
    /**
     * Generate both README.md and PROJECT_OVERVIEW.md with full codebase analysis
     */
    async generateAllDocumentation(): Promise<void> {
        if (!SettingsManager.isApiTokenConfigured()) {
            throw new Error('DeepSeek API token not configured. Please configure it first.');
        }

        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspacePath) {
            throw new Error('No workspace found');
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "🤖 Generating comprehensive project documentation...",
            cancellable: false
        }, async (progress) => {
            try {
                // Step 1: Analyze entire codebase
                progress.report({ increment: 20, message: "Analyzing entire codebase..." });
                const fullCodebaseAnalysis = await this.analyzeEntireCodebase(workspacePath);

                // Step 2: Generate README.md (user-friendly)
                progress.report({ increment: 40, message: "Generating user-friendly README.md..." });
                const readmeContent = await this.generateReadme(fullCodebaseAnalysis);

                // Step 3: Generate PROJECT_OVERVIEW.md (technical)
                progress.report({ increment: 70, message: "Generating technical PROJECT_OVERVIEW.md..." });
                const overviewContent = await this.generateProjectOverview(fullCodebaseAnalysis);

                // Step 4: Write both files
                progress.report({ increment: 90, message: "Writing documentation files..." });
                await this.writeDocumentationFiles(readmeContent, overviewContent);

                progress.report({ increment: 100, message: "Documentation generation complete!" });
            } catch (error) {
                console.error('Documentation generation failed:', error);
                throw error;
            }
        });
    }

    /**
     * Analyze the entire codebase and return comprehensive context
     */
    private async analyzeEntireCodebase(workspacePath: string): Promise<string> {
        const excludePatterns = SettingsManager.getExcludePatterns();
        const codeFiles = await this.getAllCodeFiles(workspacePath, excludePatterns);
        let fullAnalysis = '';

        // Add project metadata
        const packageJsonPath = path.join(workspacePath, 'package.json');
        if (await this.fileExists(packageJsonPath)) {
            try {
                const packageContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
                const packageData = JSON.parse(packageContent);
                fullAnalysis += `PROJECT METADATA:\n`;
                fullAnalysis += `- Name: ${packageData.name || 'Unknown'}\n`;
                fullAnalysis += `- Description: ${packageData.description || 'No description'}\n`;
                fullAnalysis += `- Version: ${packageData.version || 'Unknown'}\n`;
                if (packageData.scripts) {
                    fullAnalysis += `- Available Scripts: ${Object.keys(packageData.scripts).join(', ')}\n`;
                }
                if (packageData.dependencies) {
                    fullAnalysis += `- Dependencies: ${Object.keys(packageData.dependencies).join(', ')}\n`;
                }
                fullAnalysis += '\n';
            } catch (error) {
                console.error('Failed to parse package.json:', error);
            }
        }

        // Analyze all relevant code files
        for (const file of codeFiles) {
            try {
                const content = await fs.promises.readFile(file, 'utf-8');
                const relativePath = path.relative(workspacePath, file);
                fullAnalysis += `\n\n=== FILE: ${relativePath} ===\n${content}`;
            } catch (error) {
                console.error(`Failed to read file ${file}:`, error);
            }
        }

        return fullAnalysis;
    }

    /**
     * Get all code files in the workspace, excluding specified patterns
     */
    private async getAllCodeFiles(workspacePath: string, excludePatterns: string[]): Promise<string[]> {
        const codeExtensions = [
            '.ts', '.tsx', '.js', '.jsx', '.py', '.pyi', '.java', '.kt', '.cs', '.fs',
            '.go', '.rs', '.php', '.rb', '.swift', '.m', '.mm', '.cpp', '.hpp', '.c', '.h'
        ];

        const allFiles: string[] = [];
        
        const scanDirectory = async (dirPath: string): Promise<void> => {
            try {
                const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    const relativePath = path.relative(workspacePath, fullPath);
                    
                    // Check if file should be excluded
                    const shouldExclude = excludePatterns.some(pattern => {
                        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                        return regex.test(relativePath);
                    });
                    
                    if (shouldExclude) continue;
                    
                    if (entry.isDirectory()) {
                        await scanDirectory(fullPath);
                    } else if (entry.isFile() && codeExtensions.includes(path.extname(entry.name))) {
                        allFiles.push(fullPath);
                    }
                }
            } catch (error) {
                console.error(`Failed to scan directory ${dirPath}:`, error);
            }
        };

        await scanDirectory(workspacePath);
        return allFiles;
    }

    /**
     * Generate README.md using DeepSeek R1T2 Chimera
     */
    private async generateReadme(fullCodebaseAnalysis: string): Promise<string> {
        const prompt = `Create a comprehensive user-friendly README.md for this VS Code extension project.

COMPLETE CODEBASE ANALYSIS:
${fullCodebaseAnalysis}

REQUIREMENTS:
- Clear project description for end users
- Installation and setup instructions  
- Key features and benefits overview
- Usage examples and basic workflows
- Contributing guidelines
- Professional, accessible tone for developers who want to use this extension
- Focus on what the extension does, not how it's implemented

OUTPUT: Complete README.md markdown content suitable for GitHub repository`;

        return await this.callDeepSeekAPI(prompt);
    }

    /**
     * Generate PROJECT_OVERVIEW.md using DeepSeek R1T2 Chimera
     */
    private async generateProjectOverview(fullCodebaseAnalysis: string): Promise<string> {
        const prompt = `Create comprehensive technical documentation for PROJECT_OVERVIEW.md.

COMPLETE CODEBASE ANALYSIS:
${fullCodebaseAnalysis}

REQUIREMENTS:
- Every function, class, and method documented with full signatures
- Complete API reference with parameters, return types, and examples
- Detailed architecture documentation and design patterns
- Implementation details, algorithms, and technical decisions
- All configuration options with technical specifications
- Error handling, edge cases, and troubleshooting
- Performance characteristics and limitations
- Internal workflows and data flow diagrams
- Technical specifications for contributors and maintainers
- Code examples for all major functionality

OUTPUT: Complete PROJECT_OVERVIEW.md markdown content for technical users`;

        return await this.callDeepSeekAPI(prompt);
    }

    /**
     * Call DeepSeek R1T2 Chimera API via OpenRouter with the specified prompt
     */
    private async callDeepSeekAPI(prompt: string): Promise<string> {
        const apiToken = SettingsManager.getApiToken();
        if (!apiToken) {
            throw new Error('API token not configured');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tngtech/deepseek-r1t2-chimera:free',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 8192,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek R1T2 Chimera API request failed (${response.status}): ${errorText}`);
        }

        const data: any = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Write both documentation files to the workspace
     */
    private async writeDocumentationFiles(readme: string, overview: string): Promise<void> {
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspacePath) return;

        await fs.promises.writeFile(path.join(workspacePath, 'README.md'), readme, 'utf-8');
        await fs.promises.writeFile(path.join(workspacePath, 'PROJECT_OVERVIEW.md'), overview, 'utf-8');
        
        console.log('✅ Generated: README.md and PROJECT_OVERVIEW.md');
    }

    /**
     * Check if a file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}
