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
        let totalTokens = 0;
        const maxTokens = 120000; // Оставляем запас для API лимита 163840
        const maxFileSize = 50000; // Максимальный размер файла в символах

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
                totalTokens += fullAnalysis.length / 4; // Примерная оценка токенов
            } catch (error) {
                console.error('Failed to parse package.json:', error);
            }
        }

        // Сортируем файлы по важности (основные файлы сначала)
        const sortedFiles = this.prioritizeFiles(codeFiles, workspacePath);
        
        // Analyze code files with size and token limits
        let processedFiles = 0;
        const maxFiles = 50; // Ограничиваем количество файлов

        for (const file of sortedFiles) {
            if (processedFiles >= maxFiles) {
                console.log(`Reached maximum file limit (${maxFiles}), skipping remaining files`);
                break;
            }

            try {
                const stats = await fs.promises.stat(file);
                
                // Пропускаем слишком большие файлы
                if (stats.size > maxFileSize) {
                    console.log(`Skipping large file: ${file} (${stats.size} bytes)`);
                    continue;
                }

                const content = await fs.promises.readFile(file, 'utf-8');
                
                // Проверяем лимит токенов
                const estimatedTokens = content.length / 4;
                if (totalTokens + estimatedTokens > maxTokens) {
                    console.log(`Token limit reached, stopping analysis. Processed ${processedFiles} files.`);
                    break;
                }

                const relativePath = path.relative(workspacePath, file);
                
                // Для больших файлов берем только ключевые части
                const processedContent = this.extractKeyContent(content, file);
                
                fullAnalysis += `\n\n=== FILE: ${relativePath} ===\n${processedContent}`;
                totalTokens += estimatedTokens;
                processedFiles++;
                
            } catch (error) {
                console.error(`Failed to read file ${file}:`, error);
            }
        }

        console.log(`Analysis complete: ${processedFiles} files processed, ~${Math.round(totalTokens)} tokens`);
        return fullAnalysis;
    }

    /**
     * Prioritize files by importance (main files first)
     */
    private prioritizeFiles(files: string[], _workspacePath: string): string[] {
        return files.sort((a, b) => {
            const aName = path.basename(a).toLowerCase();
            const bName = path.basename(b).toLowerCase();
            
            // Приоритет основным файлам
            const priority = [
                'main', 'index', 'app', 'server', 'client', 'config',
                'package.json', 'tsconfig', 'webpack', 'setup'
            ];
            
            const aPriority = priority.findIndex(p => aName.includes(p));
            const bPriority = priority.findIndex(p => bName.includes(p));
            
            if (aPriority !== -1 && bPriority !== -1) {
                return aPriority - bPriority;
            }
            if (aPriority !== -1) return -1;
            if (bPriority !== -1) return 1;
            
            // Сортируем по размеру (меньшие файлы сначала)
            try {
                const aStats = fs.statSync(a);
                const bStats = fs.statSync(b);
                return aStats.size - bStats.size;
            } catch {
                return 0;
            }
        });
    }

    /**
     * Extract key content from large files
     */
    private extractKeyContent(content: string, _filePath: string): string {
        const maxLength = 2000; // Максимальная длина содержимого файла
        
        if (content.length <= maxLength) {
            return content;
        }

        // Для больших файлов извлекаем ключевые части
        const lines = content.split('\n');
        const keyLines: string[] = [];
        let currentLength = 0;

        // Добавляем импорты и экспорты
        for (const line of lines) {
            if (currentLength > maxLength) break;
            
            const trimmed = line.trim();
            if (trimmed.startsWith('import ') || 
                trimmed.startsWith('export ') ||
                trimmed.startsWith('from ') ||
                trimmed.startsWith('class ') ||
                trimmed.startsWith('function ') ||
                trimmed.startsWith('interface ') ||
                trimmed.startsWith('type ') ||
                trimmed.startsWith('const ') ||
                trimmed.startsWith('let ') ||
                trimmed.startsWith('var ') ||
                trimmed.startsWith('def ') ||
                trimmed.startsWith('public ') ||
                trimmed.startsWith('private ') ||
                trimmed.includes('TODO') ||
                trimmed.includes('FIXME') ||
                trimmed.startsWith('//') ||
                trimmed.startsWith('#') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('"""') ||
                trimmed.startsWith("'''")) {
                
                keyLines.push(line);
                currentLength += line.length;
            }
        }

        if (keyLines.length === 0) {
            // Если не нашли ключевых строк, берем начало файла
            return content.substring(0, maxLength) + '\n\n... [FILE TRUNCATED] ...';
        }

        return keyLines.join('\n') + '\n\n... [KEY CONTENT EXTRACTED] ...';
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
