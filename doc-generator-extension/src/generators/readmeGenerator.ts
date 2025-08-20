// import * as fs from 'fs';
// import * as path from 'path';
import { AnalysisResult, CodeElement } from '../analyzers/codeAnalyzer';
import { ChangesSinceLastUpdate } from '../providers/documentationProvider';

export class ReadmeGenerator {
    
    public async generate(analysisResult: AnalysisResult): Promise<string> {
        const projectMetadata = analysisResult.metadata;
        let readme = '';

        // Project title and description
        readme += this.generateHeader(projectMetadata);
        
        // Table of contents
        readme += this.generateTableOfContents();
        
        // Installation section
        readme += this.generateInstallationSection(projectMetadata);
        
        // Usage section
        readme += this.generateUsageSection(analysisResult);
        
        // API overview
        readme += this.generateApiOverview(analysisResult);
        
        // Project structure
        readme += this.generateProjectStructure(analysisResult);
        
        // Contributing section
        readme += this.generateContributingSection();
        
        // License section
        readme += this.generateLicenseSection();
        
        // Footer
        readme += this.generateFooter();

        return readme;
    }

    public async update(analysisResult: AnalysisResult, _changes: ChangesSinceLastUpdate): Promise<string> {
        // For README updates, we'll regenerate most sections but preserve custom content
        // This is a simplified implementation - a more sophisticated version would
        // parse existing README and update only specific sections
        
        return await this.generate(analysisResult);
    }

    private generateHeader(metadata: any): string {
        const projectName = metadata?.projectName || 'Project';
        const description = metadata?.description || 'A software project with auto-generated documentation.';
        const version = metadata?.version;

        let header = `# ${projectName}\n\n`;
        
        if (version) {
            header += `![Version](https://img.shields.io/badge/version-${version}-blue.svg)\n`;
        }
        
        header += `![Auto-Generated](https://img.shields.io/badge/docs-auto--generated-brightgreen.svg)\n`;
        header += `![Last Updated](https://img.shields.io/badge/updated-${new Date().toISOString().split('T')[0]}-blue.svg)\n\n`;
        
        header += `${description}\n\n`;
        
        return header;
    }

    private generateTableOfContents(): string {
        return `## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

`;
    }

    private generateInstallationSection(metadata: any): string {
        let installation = `## Installation\n\n`;
        
        // Detect project type and provide appropriate installation instructions
        if (metadata?.projectName && this.isNodeProject(metadata)) {
            installation += `### npm\n\n`;
            installation += `\`\`\`bash\n`;
            installation += `npm install ${metadata.projectName}\n`;
            installation += `\`\`\`\n\n`;
            
            installation += `### yarn\n\n`;
            installation += `\`\`\`bash\n`;
            installation += `yarn add ${metadata.projectName}\n`;
            installation += `\`\`\`\n\n`;
        } else if (this.isPythonProject(metadata)) {
            installation += `### pip\n\n`;
            installation += `\`\`\`bash\n`;
            installation += `pip install ${metadata?.projectName || 'this-package'}\n`;
            installation += `\`\`\`\n\n`;
        } else {
            // Generic installation instructions
            installation += `### Clone the repository\n\n`;
            installation += `\`\`\`bash\n`;
            installation += `git clone <repository-url>\n`;
            installation += `cd ${metadata?.projectName || 'project-directory'}\n`;
            installation += `\`\`\`\n\n`;
            
            installation += `### Install dependencies\n\n`;
            installation += `Follow the setup instructions specific to your development environment.\n\n`;
        }
        
        return installation;
    }

    private generateUsageSection(analysisResult: AnalysisResult): string {
        let usage = `## Usage\n\n`;
        
        // Find main entry points (exported functions, main classes)
        const mainElements = this.findMainElements(analysisResult.elements);
        
        if (mainElements.length > 0) {
            usage += `### Quick Start\n\n`;
            
            // Generate basic usage examples based on main elements
            const mainClass = mainElements.find(e => e.type === 'class');
            const mainFunctions = mainElements.filter(e => e.type === 'function').slice(0, 3);
            
            if (mainClass) {
                usage += `\`\`\`typescript\n`;
                usage += `import { ${mainClass.name} } from '${this.getImportPath(analysisResult.metadata)}';\n\n`;
                usage += `const instance = new ${mainClass.name}();\n`;
                usage += `// Use the instance...\n`;
                usage += `\`\`\`\n\n`;
            }
            
            if (mainFunctions.length > 0) {
                usage += `### Main Functions\n\n`;
                for (const func of mainFunctions) {
                    usage += `#### ${func.name}\n\n`;
                    if (func.description) {
                        usage += `${func.description}\n\n`;
                    }
                    
                    usage += `\`\`\`typescript\n`;
                    usage += `import { ${func.name} } from '${this.getImportPath(analysisResult.metadata)}';\n\n`;
                    
                    // Generate example call
                    const exampleCall = this.generateExampleFunctionCall(func);
                    usage += `${exampleCall}\n`;
                    usage += `\`\`\`\n\n`;
                }
            }
        } else {
            usage += `Basic usage instructions will be added here.\n\n`;
            usage += `\`\`\`typescript\n`;
            usage += `// Example usage\n`;
            usage += `import * as lib from '${this.getImportPath(analysisResult.metadata)}';\n\n`;
            usage += `// Your code here\n`;
            usage += `\`\`\`\n\n`;
        }
        
        return usage;
    }

    private generateApiOverview(analysisResult: AnalysisResult): string {
        let apiOverview = `## API Overview\n\n`;
        
        const classes = analysisResult.elements.filter(e => e.type === 'class');
        const functions = analysisResult.elements.filter(e => e.type === 'function');
        const interfaces = analysisResult.elements.filter(e => e.type === 'interface');
        
        if (classes.length > 0) {
            apiOverview += `### Classes (${classes.length})\n\n`;
            apiOverview += `| Class | Description |\n`;
            apiOverview += `|-------|-------------|\n`;
            
            for (const cls of classes.slice(0, 10)) { // Show top 10
                const description = cls.description || 'No description available';
                apiOverview += `| \`${cls.name}\` | ${this.truncateDescription(description)} |\n`;
            }
            
            if (classes.length > 10) {
                apiOverview += `\n*And ${classes.length - 10} more classes...*\n`;
            }
            apiOverview += `\n`;
        }
        
        if (functions.length > 0) {
            apiOverview += `### Functions (${functions.length})\n\n`;
            apiOverview += `| Function | Description |\n`;
            apiOverview += `|----------|-------------|\n`;
            
            for (const func of functions.slice(0, 10)) { // Show top 10
                const description = func.description || 'No description available';
                apiOverview += `| \`${func.name}\` | ${this.truncateDescription(description)} |\n`;
            }
            
            if (functions.length > 10) {
                apiOverview += `\n*And ${functions.length - 10} more functions...*\n`;
            }
            apiOverview += `\n`;
        }
        
        if (interfaces.length > 0) {
            apiOverview += `### Interfaces (${interfaces.length})\n\n`;
            apiOverview += `| Interface | Description |\n`;
            apiOverview += `|-----------|-------------|\n`;
            
            for (const iface of interfaces.slice(0, 10)) { // Show top 10
                const description = iface.description || 'No description available';
                apiOverview += `| \`${iface.name}\` | ${this.truncateDescription(description)} |\n`;
            }
            
            if (interfaces.length > 10) {
                apiOverview += `\n*And ${interfaces.length - 10} more interfaces...*\n`;
            }
            apiOverview += `\n`;
        }
        
        apiOverview += `📖 **[View Full API Documentation](./docs/API.md)**\n\n`;
        
        return apiOverview;
    }

    private generateProjectStructure(analysisResult: AnalysisResult): string {
        let structure = `## Project Structure\n\n`;
        
        structure += `\`\`\`\n`;
        structure += this.renderFileStructure(analysisResult.fileStructure, '', 0);
        structure += `\`\`\`\n\n`;
        
        // Add metrics
        structure += `### Project Metrics\n\n`;
        structure += `- **Total Files:** ${this.countFiles(analysisResult.fileStructure)}\n`;
        structure += `- **Lines of Code:** ${analysisResult.metrics.linesOfCode.toLocaleString()}\n`;
        structure += `- **Code Elements:** ${analysisResult.elements.length}\n`;
        structure += `- **Dependencies:** ${analysisResult.dependencies.length}\n\n`;
        
        return structure;
    }

    private generateContributingSection(): string {
        return `## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Development Setup

1. Clone the repository
2. Install dependencies
3. Run tests to ensure everything works
4. Make your changes
5. Add tests for new functionality
6. Ensure all tests pass

### Code Style

Please follow the existing code style and conventions used in the project.

`;
    }

    private generateLicenseSection(): string {
        return `## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

`;
    }

    private generateFooter(): string {
        const timestamp = new Date().toISOString();
        return `---

*This README was automatically generated on ${timestamp.split('T')[0]} by the Documentation Generator.*

*To update this documentation, run the documentation generator or make changes to the source code and commit.*
`;
    }

    private isNodeProject(metadata: any): boolean {
        return metadata?.projectName && (
            metadata.dependencies || 
            metadata.devDependencies || 
            metadata.scripts
        );
    }

    private isPythonProject(_metadata: any): boolean {
        // This would check for Python-specific markers
        return false; // Simplified for now
    }

    private findMainElements(elements: CodeElement[]): CodeElement[] {
        // Find elements that are likely to be main entry points
        const mainElements: CodeElement[] = [];
        
        // Look for exported elements (simplified heuristic)
        const publicElements = elements.filter(e => e.visibility === 'public');
        
        // Prioritize classes and main functions
        const classes = publicElements.filter(e => e.type === 'class');
        const functions = publicElements.filter(e => e.type === 'function');
        
        // Add main classes (limit to prevent overwhelming the README)
        mainElements.push(...classes.slice(0, 3));
        
        // Add main functions
        mainElements.push(...functions.slice(0, 5));
        
        return mainElements;
    }

    private getImportPath(metadata: any): string {
        return metadata?.projectName || '.';
    }

    private generateExampleFunctionCall(func: CodeElement): string {
        let call = `const result = ${func.name}(`;
        
        if (func.parameters && func.parameters.length > 0) {
            const exampleParams = func.parameters.map(param => {
                switch (param.type.toLowerCase()) {
                    case 'string':
                        return `'example'`;
                    case 'number':
                        return '42';
                    case 'boolean':
                        return 'true';
                    case 'array':
                        return '[]';
                    case 'object':
                        return '{}';
                    default:
                        return param.optional ? 'undefined' : `/* ${param.type} */`;
                }
            });
            call += exampleParams.join(', ');
        }
        
        call += ');';
        return call;
    }

    private truncateDescription(description: string, maxLength: number = 100): string {
        if (description.length <= maxLength) {
            return description;
        }
        return description.substring(0, maxLength - 3) + '...';
    }

    private renderFileStructure(nodes: any[], prefix: string, depth: number): string {
        if (depth > 3) return ''; // Limit depth to prevent overwhelming output
        
        let result = '';
        const sortedNodes = nodes.sort((a, b) => {
            // Directories first, then files
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });

        for (let i = 0; i < sortedNodes.length && i < 20; i++) { // Limit items shown
            const node = sortedNodes[i];
            const isLast = i === sortedNodes.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            
            result += `${prefix}${connector}${node.name}\n`;
            
            if (node.type === 'directory' && node.children && node.children.length > 0) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                result += this.renderFileStructure(node.children, newPrefix, depth + 1);
            }
        }
        
        if (sortedNodes.length > 20) {
            result += `${prefix}└── ... and ${sortedNodes.length - 20} more items\n`;
        }
        
        return result;
    }

    private countFiles(nodes: any[]): number {
        let count = 0;
        for (const node of nodes) {
            if (node.type === 'file') {
                count++;
            } else if (node.type === 'directory' && node.children) {
                count += this.countFiles(node.children);
            }
        }
        return count;
    }
}
