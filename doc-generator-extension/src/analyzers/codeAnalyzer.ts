import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface CodeElement {
    type: 'function' | 'class' | 'interface' | 'variable' | 'type' | 'enum' | 'module';
    name: string;
    description?: string | undefined;
    parameters?: Parameter[] | undefined;
    returnType?: string | undefined;
    visibility: 'public' | 'private' | 'protected';
    location: {
        file: string;
        line: number;
        column: number;
    };
    decorators?: string[] | undefined;
    examples?: string[] | undefined;
    since?: string | undefined;
    deprecated?: boolean | undefined;
    jsDoc?: string | undefined;
    signature?: string | undefined;
    parentClass?: string | undefined;
    implements?: string[] | undefined;
    extends?: string | undefined;
}

export interface Parameter {
    name: string;
    type: string;
    optional: boolean;
    description?: string | undefined;
    defaultValue?: string | undefined;
}

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
    size?: number;
    extension?: string;
}

export interface AnalysisResult {
    elements: CodeElement[];
    dependencies: string[];
    fileStructure: FileNode[];
    metrics: {
        linesOfCode: number;
        complexity: number;
        testCoverage?: number;
    };
    metadata?: {
        fileName?: string;
        projectName?: string;
        version?: string;
        description?: string;
    };
}

export class CodeAnalyzer {
    // private supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.php']);

    public async analyzeProject(
        rootPath: string,
        supportedLanguages: string[],
        excludePatterns: string[]
    ): Promise<AnalysisResult> {
        
        const fileStructure = await this.buildFileStructure(rootPath, excludePatterns);
        const sourceFiles = this.getSourceFiles(fileStructure, supportedLanguages);
        
        const elements: CodeElement[] = [];
        const dependencies = new Set<string>();
        let totalLines = 0;
        let totalComplexity = 0;

        for (const file of sourceFiles) {
            try {
                const fileAnalysis = await this.analyzeSingleFile(file.path);
                elements.push(...fileAnalysis.elements);
                
                fileAnalysis.dependencies.forEach(dep => dependencies.add(dep));
                totalLines += fileAnalysis.metrics.linesOfCode;
                totalComplexity += fileAnalysis.metrics.complexity;
                
            } catch (error) {
                console.warn(`Failed to analyze file ${file.path}:`, error);
            }
        }

        // Get project metadata
        const metadata = await this.getProjectMetadata(rootPath);

        return {
            elements,
            dependencies: Array.from(dependencies),
            fileStructure,
            metrics: {
                linesOfCode: totalLines,
                complexity: Math.round(totalComplexity / sourceFiles.length) || 0
            },
            metadata
        };
    }

    public async analyzeSingleFile(filePath: string): Promise<AnalysisResult> {
        const extension = path.extname(filePath).toLowerCase();
        let elements: CodeElement[] = [];
        let dependencies: string[] = [];
        let linesOfCode = 0;
        let complexity = 0;

        try {
            const content = await fs.promises.readFile(filePath, 'utf8');
            linesOfCode = content.split('\n').length;

            switch (extension) {
                case '.ts':
                case '.tsx':
                    const tsResult = this.analyzeTypeScriptFile(filePath, content);
                    elements = tsResult.elements;
                    dependencies = tsResult.dependencies;
                    complexity = tsResult.complexity;
                    break;
                    
                case '.js':
                case '.jsx':
                    const jsResult = this.analyzeJavaScriptFile(filePath, content);
                    elements = jsResult.elements;
                    dependencies = jsResult.dependencies;
                    complexity = jsResult.complexity;
                    break;
                    
                case '.py':
                    const pyResult = this.analyzePythonFile(filePath, content);
                    elements = pyResult.elements;
                    dependencies = pyResult.dependencies;
                    complexity = pyResult.complexity;
                    break;
                    
                default:
                    // Basic analysis for other file types
                    const basicResult = this.analyzeGenericFile(filePath, content);
                    elements = basicResult.elements;
                    dependencies = basicResult.dependencies;
                    complexity = basicResult.complexity;
            }

        } catch (error) {
            console.error(`Error analyzing file ${filePath}:`, error);
        }

        return {
            elements,
            dependencies,
            fileStructure: [],
            metrics: {
                linesOfCode,
                complexity
            },
            metadata: {
                fileName: path.basename(filePath)
            }
        };
    }

    public async analyzeFiles(filePaths: string[]): Promise<AnalysisResult> {
        const allElements: CodeElement[] = [];
        const allDependencies = new Set<string>();
        let totalLines = 0;
        let totalComplexity = 0;

        for (const filePath of filePaths) {
            try {
                const fileResult = await this.analyzeSingleFile(filePath);
                allElements.push(...fileResult.elements);
                fileResult.dependencies.forEach(dep => allDependencies.add(dep));
                totalLines += fileResult.metrics.linesOfCode;
                totalComplexity += fileResult.metrics.complexity;
            } catch (error) {
                console.warn(`Failed to analyze ${filePath}:`, error);
            }
        }

        return {
            elements: allElements,
            dependencies: Array.from(allDependencies),
            fileStructure: [],
            metrics: {
                linesOfCode: totalLines,
                complexity: Math.round(totalComplexity / filePaths.length) || 0
            }
        };
    }

    private analyzeTypeScriptFile(filePath: string, content: string): {
        elements: CodeElement[];
        dependencies: string[];
        complexity: number;
    } {
        const elements: CodeElement[] = [];
        const dependencies: string[] = [];
        let complexity = 0;

        try {
            const sourceFile = ts.createSourceFile(
                filePath,
                content,
                ts.ScriptTarget.Latest,
                true
            );

            const visit = (node: ts.Node) => {
                switch (node.kind) {
                    case ts.SyntaxKind.FunctionDeclaration:
                        const funcElement = this.analyzeTSFunction(node as ts.FunctionDeclaration, sourceFile);
                        if (funcElement) {
                            elements.push(funcElement);
                            complexity += this.calculateFunctionComplexity(node);
                        }
                        break;

                    case ts.SyntaxKind.ClassDeclaration:
                        const classElement = this.analyzeTSClass(node as ts.ClassDeclaration, sourceFile);
                        if (classElement) {
                            elements.push(classElement);
                        }
                        break;

                    case ts.SyntaxKind.InterfaceDeclaration:
                        const interfaceElement = this.analyzeTSInterface(node as ts.InterfaceDeclaration, sourceFile);
                        if (interfaceElement) {
                            elements.push(interfaceElement);
                        }
                        break;

                    case ts.SyntaxKind.TypeAliasDeclaration:
                        const typeElement = this.analyzeTSTypeAlias(node as ts.TypeAliasDeclaration, sourceFile);
                        if (typeElement) {
                            elements.push(typeElement);
                        }
                        break;

                    case ts.SyntaxKind.EnumDeclaration:
                        const enumElement = this.analyzeTSEnum(node as ts.EnumDeclaration, sourceFile);
                        if (enumElement) {
                            elements.push(enumElement);
                        }
                        break;

                    case ts.SyntaxKind.ImportDeclaration:
                        const importDep = this.extractTSImport(node as ts.ImportDeclaration);
                        if (importDep) {
                            dependencies.push(importDep);
                        }
                        break;
                }

                ts.forEachChild(node, visit);
            };

            visit(sourceFile);

        } catch (error) {
            console.error(`Error parsing TypeScript file ${filePath}:`, error);
        }

        return { elements, dependencies, complexity };
    }

    private analyzeTSFunction(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): CodeElement | null {
        if (!node.name) return null;

        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const jsDoc = this.extractJSDoc(node);
        
        const parameters: Parameter[] = [];
        if (node.parameters) {
            node.parameters.forEach(param => {
                const paramName = param.name.getText();
                const paramType = param.type ? param.type.getText() : 'any';
                const isOptional = !!param.questionToken || !!param.initializer;
                
                parameters.push({
                    name: paramName,
                    type: paramType,
                    optional: isOptional,
                    description: this.extractParameterDescription(jsDoc, paramName) || undefined
                });
            });
        }

        const returnType = node.type ? node.type.getText() : 'void';
        const visibility = this.getTSVisibility(node);

        return {
            type: 'function',
            name: node.name.getText(),
            description: jsDoc?.description || undefined,
            parameters,
            returnType,
            visibility,
            location: {
                file: sourceFile.fileName,
                line: position.line + 1,
                column: position.character + 1
            },
            jsDoc: jsDoc?.raw || undefined,
            signature: this.generateFunctionSignature(node),
            deprecated: jsDoc?.deprecated || undefined
        };
    }

    private analyzeTSClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): CodeElement | null {
        if (!node.name) return null;

        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const jsDoc = this.extractJSDoc(node);
        
        const extendsClause = node.heritageClauses?.find(clause => 
            clause.token === ts.SyntaxKind.ExtendsKeyword
        );
        const implementsClause = node.heritageClauses?.find(clause => 
            clause.token === ts.SyntaxKind.ImplementsKeyword
        );

        return {
            type: 'class',
            name: node.name.getText(),
            description: jsDoc?.description || undefined,
            visibility: this.getTSVisibility(node),
            location: {
                file: sourceFile.fileName,
                line: position.line + 1,
                column: position.character + 1
            },
            jsDoc: jsDoc?.raw || undefined,
            extends: extendsClause?.types[0]?.getText() || undefined,
            implements: implementsClause?.types.map(type => type.getText()) || undefined,
            deprecated: jsDoc?.deprecated || undefined
        };
    }

    private analyzeTSInterface(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): CodeElement | null {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const jsDoc = this.extractJSDoc(node);

        const extendsClause = node.heritageClauses?.find(clause => 
            clause.token === ts.SyntaxKind.ExtendsKeyword
        );

        return {
            type: 'interface',
            name: node.name.getText(),
            description: jsDoc?.description || undefined,
            visibility: 'public', // Interfaces are always public in TS
            location: {
                file: sourceFile.fileName,
                line: position.line + 1,
                column: position.character + 1
            },
            jsDoc: jsDoc?.raw || undefined,
            extends: extendsClause?.types[0]?.getText() || undefined,
            deprecated: jsDoc?.deprecated || undefined
        };
    }

    private analyzeTSTypeAlias(node: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): CodeElement | null {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const jsDoc = this.extractJSDoc(node);

        return {
            type: 'type',
            name: node.name.getText(),
            description: jsDoc?.description || undefined,
            visibility: this.getTSVisibility(node),
            location: {
                file: sourceFile.fileName,
                line: position.line + 1,
                column: position.character + 1
            },
            jsDoc: jsDoc?.raw || undefined,
            returnType: node.type.getText(),
            deprecated: jsDoc?.deprecated || undefined
        };
    }

    private analyzeTSEnum(node: ts.EnumDeclaration, sourceFile: ts.SourceFile): CodeElement | null {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const jsDoc = this.extractJSDoc(node);

        return {
            type: 'enum',
            name: node.name.getText(),
            description: jsDoc?.description || undefined,
            visibility: this.getTSVisibility(node),
            location: {
                file: sourceFile.fileName,
                line: position.line + 1,
                column: position.character + 1
            },
            jsDoc: jsDoc?.raw || undefined,
            deprecated: jsDoc?.deprecated || undefined
        };
    }

    private extractTSImport(node: ts.ImportDeclaration): string | null {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
            return moduleSpecifier.text;
        }
        return null;
    }

    private analyzeJavaScriptFile(filePath: string, content: string): {
        elements: CodeElement[];
        dependencies: string[];
        complexity: number;
    } {
        // For JavaScript, we'll do a simpler regex-based analysis
        const elements: CodeElement[] = [];
        const dependencies: string[] = [];
        let complexity = 0;

        // const lines = content.split('\n');

        // Extract function declarations
        const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const functionName = match[1];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            
            elements.push({
                type: 'function',
                name: functionName,
                visibility: 'public',
                location: {
                    file: filePath,
                    line: lineNumber,
                    column: 1
                }
            });
            complexity += 1;
        }

        // Extract class declarations
        const classRegex = /(?:export\s+)?class\s+(\w+)/g;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            
            elements.push({
                type: 'class',
                name: className,
                visibility: 'public',
                location: {
                    file: filePath,
                    line: lineNumber,
                    column: 1
                }
            });
        }

        // Extract imports/requires
        const importRegex = /(?:import.*from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1] || match[2];
            if (importPath && !importPath.startsWith('.')) {
                dependencies.push(importPath);
            }
        }

        return { elements, dependencies, complexity };
    }

    private analyzePythonFile(filePath: string, content: string): {
        elements: CodeElement[];
        dependencies: string[];
        complexity: number;
    } {
        const elements: CodeElement[] = [];
        const dependencies: string[] = [];
        let complexity = 0;

        // const lines = content.split('\n');

        // Extract function definitions
        const functionRegex = /^(\s*)def\s+(\w+)\s*\([^)]*\):/gm;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            // const indent = match[1];
            const functionName = match[2];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            
            // Determine if it's a method (indented) or standalone function
            const visibility = functionName.startsWith('_') ? 'private' : 'public';
            
            elements.push({
                type: 'function',
                name: functionName,
                visibility,
                location: {
                    file: filePath,
                    line: lineNumber,
                    column: 1
                }
            });
            complexity += 1;
        }

        // Extract class definitions
        const classRegex = /^class\s+(\w+)/gm;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const lineNumber = content.substring(0, match.index).split('\n').length;
            
            elements.push({
                type: 'class',
                name: className,
                visibility: 'public',
                location: {
                    file: filePath,
                    line: lineNumber,
                    column: 1
                }
            });
        }

        // Extract imports
        const importRegex = /^(?:from\s+(\w+)|import\s+(\w+))/gm;
        while ((match = importRegex.exec(content)) !== null) {
            const importName = match[1] || match[2];
            if (importName) {
                dependencies.push(importName);
            }
        }

        return { elements, dependencies, complexity };
    }

    private analyzeGenericFile(_filePath: string, _content: string): {
        elements: CodeElement[];
        dependencies: string[];
        complexity: number;
    } {
        // Basic analysis for unsupported file types
        return {
            elements: [],
            dependencies: [],
            complexity: 0
        };
    }

    private extractJSDoc(node: ts.Node): { description?: string; raw?: string; deprecated?: boolean } | null {
        const jsDocTags = ts.getJSDocTags(node);
        if (jsDocTags.length === 0) return null;

        const jsDocComments = ts.getJSDocCommentsAndTags(node);
        let description = '';
        let raw = '';
        let deprecated = false;

        jsDocComments.forEach(comment => {
            if (ts.isJSDoc(comment)) {
                raw = comment.getFullText();
                if (comment.comment) {
                    description = typeof comment.comment === 'string' ? comment.comment : comment.comment.map(part => part.text).join('');
                }
                
                comment.tags?.forEach(tag => {
                    if (tag.tagName.text === 'deprecated') {
                        deprecated = true;
                    }
                });
            }
        });

        return { description, raw, deprecated };
    }

    private extractParameterDescription(jsDoc: { raw?: string } | null, paramName: string): string | undefined {
        if (!jsDoc?.raw) return undefined;
        
        const paramRegex = new RegExp(`@param\\s+(?:\\{[^}]*\\}\\s+)?${paramName}\\s+(.*)`, 'i');
        const match = jsDoc.raw.match(paramRegex);
        return match ? match[1].trim() : undefined;
    }

    private getTSVisibility(node: ts.Node): 'public' | 'private' | 'protected' {
        const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
        if (!modifiers) return 'public';

        for (const modifier of modifiers) {
            if (modifier.kind === ts.SyntaxKind.PrivateKeyword) return 'private';
            if (modifier.kind === ts.SyntaxKind.ProtectedKeyword) return 'protected';
        }
        return 'public';
    }

    private generateFunctionSignature(node: ts.FunctionDeclaration): string {
        return node.getText().split('{')[0].trim();
    }

    private calculateFunctionComplexity(node: ts.Node): number {
        let complexity = 1; // Base complexity

        const visit = (child: ts.Node) => {
            switch (child.kind) {
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.SwitchStatement:
                case ts.SyntaxKind.CatchClause:
                case ts.SyntaxKind.ConditionalExpression:
                    complexity++;
                    break;
                case ts.SyntaxKind.CaseClause:
                    complexity++;
                    break;
            }
            ts.forEachChild(child, visit);
        };

        ts.forEachChild(node, visit);
        return complexity;
    }

    private async buildFileStructure(rootPath: string, excludePatterns: string[]): Promise<FileNode[]> {
        const buildNode = async (currentPath: string, name: string): Promise<FileNode | null> => {
            // Check if path should be excluded
            if (this.shouldExclude(currentPath, excludePatterns)) {
                return null;
            }

            const stats = await fs.promises.stat(currentPath);
            
            if (stats.isDirectory()) {
                const children: FileNode[] = [];
                try {
                    const entries = await fs.promises.readdir(currentPath);
                    for (const entry of entries) {
                        const childPath = path.join(currentPath, entry);
                        const childNode = await buildNode(childPath, entry);
                        if (childNode) {
                            children.push(childNode);
                        }
                    }
                } catch (error) {
                    console.warn(`Cannot read directory ${currentPath}:`, error);
                }

                return {
                    name,
                    path: currentPath,
                    type: 'directory',
                    children
                };
            } else {
                return {
                    name,
                    path: currentPath,
                    type: 'file',
                    size: stats.size,
                    extension: path.extname(name)
                };
            }
        };

        try {
            const entries = await fs.promises.readdir(rootPath);
            const structure: FileNode[] = [];
            
            for (const entry of entries) {
                const entryPath = path.join(rootPath, entry);
                const node = await buildNode(entryPath, entry);
                if (node) {
                    structure.push(node);
                }
            }
            
            return structure;
        } catch (error) {
            console.error(`Error building file structure for ${rootPath}:`, error);
            return [];
        }
    }

    private shouldExclude(filePath: string, excludePatterns: string[]): boolean {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Always exclude hidden files and directories (starting with .)
        if (fileName.startsWith('.') && !fileName.match(/^\.(env|gitignore|vscode)$/)) {
            return true;
        }
        
        // Default exclusions for common directories/files
        const defaultExclusions = [
            'node_modules',
            'dist',
            'build',
            'out',
            'target',
            'bin',
            'obj',
            'vendor',
            '__pycache__',
            '.git',
            '.svn',
            '.hg',
            'coverage',
            '.coverage',
            '.pytest_cache',
            '.mypy_cache',
            '.tox',
            'venv',
            'env',
            '.venv',
            '.env',
            'bower_components',
            'jspm_packages',
            '.npm',
            '.yarn',
            'logs',
            '*.log',
            'temp',
            'tmp',
            '.tmp',
            '.DS_Store',
            'Thumbs.db',
            '.idea',
            '.vscode/settings.json',
            '*.vsix',
            '*.map',
            '*.min.js',
            '*.min.css'
        ];

        // Check if file/directory matches default exclusions
        const isDefaultExcluded = defaultExclusions.some(exclusion => {
            if (exclusion.includes('*')) {
                // Handle wildcards
                const regexPattern = exclusion
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                const regex = new RegExp(regexPattern);
                return regex.test(fileName) || regex.test(relativePath);
            } else {
                // Direct match
                return fileName === exclusion || 
                       relativePath.includes(exclusion) ||
                       relativePath.split(path.sep).includes(exclusion);
            }
        });

        if (isDefaultExcluded) {
            return true;
        }
        
        // Check user-defined exclude patterns
        return excludePatterns.some(pattern => {
            // Convert glob pattern to regex
            const regexPattern = pattern
                .replace(/\*\*/g, '.*')
                .replace(/\*/g, '[^/]*')
                .replace(/\?/g, '.');
            
            const regex = new RegExp(regexPattern);
            return regex.test(relativePath) || regex.test(fileName);
        });
    }

    private getSourceFiles(fileStructure: FileNode[], supportedLanguages: string[]): FileNode[] {
        const sourceFiles: FileNode[] = [];

        const traverse = (nodes: FileNode[]) => {
            for (const node of nodes) {
                if (node.type === 'file' && node.extension) {
                    const isSupported = supportedLanguages.some(lang => {
                        switch (lang) {
                            case 'typescript':
                                return ['.ts', '.tsx'].includes(node.extension!);
                            case 'javascript':
                                return ['.js', '.jsx'].includes(node.extension!);
                            case 'python':
                                return node.extension === '.py';
                            case 'java':
                                return node.extension === '.java';
                            case 'csharp':
                                return node.extension === '.cs';
                            case 'go':
                                return node.extension === '.go';
                            case 'rust':
                                return node.extension === '.rs';
                            case 'php':
                                return node.extension === '.php';
                            default:
                                return node.extension === `.${lang}`;
                        }
                    });

                    if (isSupported) {
                        sourceFiles.push(node);
                    }
                } else if (node.type === 'directory' && node.children) {
                    traverse(node.children);
                }
            }
        };

        traverse(fileStructure);
        return sourceFiles;
    }

    private async getProjectMetadata(rootPath: string): Promise<any> {
        const metadata: any = {};

        // Try to read package.json
        const packageJsonPath = path.join(rootPath, 'package.json');
        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));
                metadata.projectName = packageJson.name;
                metadata.version = packageJson.version;
                metadata.description = packageJson.description;
            }
        } catch (error) {
            console.warn('Could not read package.json:', error);
        }

        // Try to read other project files (pyproject.toml, Cargo.toml, etc.)
        // This could be extended for other project types

        return metadata;
    }
}
