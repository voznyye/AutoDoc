// import * as MarkdownIt from 'markdown-it';
import { AnalysisResult, CodeElement } from '../analyzers/codeAnalyzer';
import { ChangesSinceLastUpdate } from '../providers/documentationProvider';

export interface DocumentationSection {
    title: string;
    content: string;
    subsections?: DocumentationSection[];
    order: number;
}

export interface GenerationOptions {
    includeTableOfContents: boolean;
    includeExamples: boolean;
    includeSourceLinks: boolean;
    templatePath?: string;
    outputFormat: 'markdown' | 'html' | 'pdf';
}

export class MarkdownGenerator {
    // private md: MarkdownIt;

    constructor() {
        // this.md = new MarkdownIt({
        //     html: true,
        //     linkify: true,
        //     typographer: true
        // });
    }

    public async generateApiDocumentation(
        analysisResult: AnalysisResult,
        options: Partial<GenerationOptions> = {}
    ): Promise<string> {
        
        const defaultOptions: GenerationOptions = {
            includeTableOfContents: true,
            includeExamples: true,
            includeSourceLinks: true,
            outputFormat: 'markdown'
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        const sections: DocumentationSection[] = [];

        // Generate sections based on code elements
        const classesSections = this.generateClassesSections(analysisResult.elements);
        const functionsSections = this.generateFunctionsSections(analysisResult.elements);
        const interfacesSections = this.generateInterfacesSections(analysisResult.elements);
        const typesSections = this.generateTypesSections(analysisResult.elements);

        sections.push(...classesSections, ...functionsSections, ...interfacesSections, ...typesSections);

        // Sort sections by order
        sections.sort((a, b) => a.order - b.order);

        // Build the markdown content
        let markdown = '# API Documentation\n\n';

        if (analysisResult.metadata?.description) {
            markdown += `${analysisResult.metadata.description}\n\n`;
        }

        // Add table of contents if requested
        if (finalOptions.includeTableOfContents) {
            markdown += this.generateTableOfContents(sections);
        }

        // Add sections
        for (const section of sections) {
            markdown += this.renderSection(section, finalOptions);
        }

        // Add footer with generation info
        markdown += this.generateFooter(analysisResult);

        return markdown;
    }

    public async updateApiDocumentation(
        analysisResult: AnalysisResult,
        _changes: ChangesSinceLastUpdate
    ): Promise<string> {
        // For updates, we'll regenerate the entire API documentation
        // In a more sophisticated implementation, this could be incremental
        return await this.generateApiDocumentation(analysisResult);
    }

    public async generateModuleDocumentation(analysisResult: AnalysisResult): Promise<string> {
        let markdown = '# Module Documentation\n\n';

        // Group elements by file/module
        const moduleMap = new Map<string, CodeElement[]>();
        
        for (const element of analysisResult.elements) {
            const moduleName = this.getModuleName(element.location.file);
            if (!moduleMap.has(moduleName)) {
                moduleMap.set(moduleName, []);
            }
            moduleMap.get(moduleName)!.push(element);
        }

        // Generate documentation for each module
        for (const [moduleName, elements] of moduleMap) {
            markdown += `## ${moduleName}\n\n`;
            
            const classes = elements.filter(e => e.type === 'class');
            const functions = elements.filter(e => e.type === 'function');
            const interfaces = elements.filter(e => e.type === 'interface');

            if (classes.length > 0) {
                markdown += '### Classes\n\n';
                for (const cls of classes) {
                    markdown += this.generateClassDocumentation(cls);
                }
            }

            if (functions.length > 0) {
                markdown += '### Functions\n\n';
                for (const func of functions) {
                    markdown += this.generateFunctionDocumentation(func);
                }
            }

            if (interfaces.length > 0) {
                markdown += '### Interfaces\n\n';
                for (const iface of interfaces) {
                    markdown += this.generateInterfaceDocumentation(iface);
                }
            }

            markdown += '\n---\n\n';
        }

        return markdown;
    }

    public async generateExamplesDocumentation(analysisResult: AnalysisResult): Promise<string> {
        let markdown = '# Examples\n\n';

        const elementsWithExamples = analysisResult.elements.filter(e => e.examples && e.examples.length > 0);

        if (elementsWithExamples.length === 0) {
            return ''; // No examples found
        }

        markdown += 'This document contains usage examples for the API.\n\n';

        // Group by type
        const classes = elementsWithExamples.filter(e => e.type === 'class');
        const functions = elementsWithExamples.filter(e => e.type === 'function');

        if (classes.length > 0) {
            markdown += '## Class Examples\n\n';
            for (const cls of classes) {
                markdown += `### ${cls.name}\n\n`;
                if (cls.description) {
                    markdown += `${cls.description}\n\n`;
                }
                for (const example of cls.examples || []) {
                    markdown += '```typescript\n';
                    markdown += example;
                    markdown += '\n```\n\n';
                }
            }
        }

        if (functions.length > 0) {
            markdown += '## Function Examples\n\n';
            for (const func of functions) {
                markdown += `### ${func.name}\n\n`;
                if (func.description) {
                    markdown += `${func.description}\n\n`;
                }
                for (const example of func.examples || []) {
                    markdown += '```typescript\n';
                    markdown += example;
                    markdown += '\n```\n\n';
                }
            }
        }

        return markdown;
    }

    private generateClassesSections(elements: CodeElement[]): DocumentationSection[] {
        const classes = elements.filter(e => e.type === 'class');
        if (classes.length === 0) return [];

        const sections: DocumentationSection[] = [];

        sections.push({
            title: 'Classes',
            content: this.generateClassesOverview(classes),
            order: 1,
            subsections: classes.map(cls => ({
                title: cls.name,
                content: this.generateClassDocumentation(cls),
                order: 1
            }))
        });

        return sections;
    }

    private generateFunctionsSections(elements: CodeElement[]): DocumentationSection[] {
        const functions = elements.filter(e => e.type === 'function');
        if (functions.length === 0) return [];

        return [{
            title: 'Functions',
            content: this.generateFunctionsOverview(functions),
            order: 2,
            subsections: functions.map(func => ({
                title: func.name,
                content: this.generateFunctionDocumentation(func),
                order: 1
            }))
        }];
    }

    private generateInterfacesSections(elements: CodeElement[]): DocumentationSection[] {
        const interfaces = elements.filter(e => e.type === 'interface');
        if (interfaces.length === 0) return [];

        return [{
            title: 'Interfaces',
            content: this.generateInterfacesOverview(interfaces),
            order: 3,
            subsections: interfaces.map(iface => ({
                title: iface.name,
                content: this.generateInterfaceDocumentation(iface),
                order: 1
            }))
        }];
    }

    private generateTypesSections(elements: CodeElement[]): DocumentationSection[] {
        const types = elements.filter(e => e.type === 'type' || e.type === 'enum');
        if (types.length === 0) return [];

        return [{
            title: 'Types',
            content: this.generateTypesOverview(types),
            order: 4,
            subsections: types.map(type => ({
                title: type.name,
                content: this.generateTypeDocumentation(type),
                order: 1
            }))
        }];
    }

    private generateClassesOverview(classes: CodeElement[]): string {
        let content = 'This section contains all the classes in the codebase.\n\n';
        
        content += '| Class | Description | Location |\n';
        content += '|-------|-------------|----------|\n';
        
        for (const cls of classes) {
            const description = cls.description || 'No description available';
            const location = `${cls.location.file}:${cls.location.line}`;
            content += `| \`${cls.name}\` | ${description} | ${location} |\n`;
        }
        
        return content + '\n';
    }

    private generateFunctionsOverview(functions: CodeElement[]): string {
        let content = 'This section contains all the functions in the codebase.\n\n';
        
        content += '| Function | Description | Parameters | Return Type |\n';
        content += '|----------|-------------|------------|-------------|\n';
        
        for (const func of functions) {
            const description = func.description || 'No description available';
            const params = func.parameters?.map(p => p.name).join(', ') || 'None';
            const returnType = func.returnType || 'void';
            content += `| \`${func.name}\` | ${description} | ${params} | \`${returnType}\` |\n`;
        }
        
        return content + '\n';
    }

    private generateInterfacesOverview(interfaces: CodeElement[]): string {
        let content = 'This section contains all the interfaces in the codebase.\n\n';
        
        content += '| Interface | Description | Location |\n';
        content += '|-----------|-------------|----------|\n';
        
        for (const iface of interfaces) {
            const description = iface.description || 'No description available';
            const location = `${iface.location.file}:${iface.location.line}`;
            content += `| \`${iface.name}\` | ${description} | ${location} |\n`;
        }
        
        return content + '\n';
    }

    private generateTypesOverview(types: CodeElement[]): string {
        let content = 'This section contains all the type definitions in the codebase.\n\n';
        
        content += '| Type | Kind | Description | Location |\n';
        content += '|------|------|-------------|----------|\n';
        
        for (const type of types) {
            const description = type.description || 'No description available';
            const location = `${type.location.file}:${type.location.line}`;
            content += `| \`${type.name}\` | ${type.type} | ${description} | ${location} |\n`;
        }
        
        return content + '\n';
    }

    private generateClassDocumentation(cls: CodeElement): string {
        let content = `### ${cls.name}\n\n`;

        if (cls.deprecated) {
            content += '> **⚠️ Deprecated**: This class is deprecated and may be removed in future versions.\n\n';
        }

        if (cls.description) {
            content += `${cls.description}\n\n`;
        }

        // Add inheritance information
        if (cls.extends) {
            content += `**Extends:** \`${cls.extends}\`\n\n`;
        }

        if (cls.implements && cls.implements.length > 0) {
            content += `**Implements:** ${cls.implements.map(i => `\`${i}\``).join(', ')}\n\n`;
        }

        // Add location information
        content += `**Location:** \`${cls.location.file}:${cls.location.line}\`\n\n`;

        // Add examples if available
        if (cls.examples && cls.examples.length > 0) {
            content += '**Examples:**\n\n';
            for (const example of cls.examples) {
                content += '```typescript\n';
                content += example;
                content += '\n```\n\n';
            }
        }

        return content;
    }

    private generateFunctionDocumentation(func: CodeElement): string {
        let content = `### ${func.name}\n\n`;

        if (func.deprecated) {
            content += '> **⚠️ Deprecated**: This function is deprecated and may be removed in future versions.\n\n';
        }

        if (func.description) {
            content += `${func.description}\n\n`;
        }

        // Add signature
        if (func.signature) {
            content += '**Signature:**\n\n';
            content += '```typescript\n';
            content += func.signature;
            content += '\n```\n\n';
        }

        // Add parameters
        if (func.parameters && func.parameters.length > 0) {
            content += '**Parameters:**\n\n';
            content += '| Name | Type | Optional | Description |\n';
            content += '|------|------|----------|-------------|\n';
            
            for (const param of func.parameters) {
                const optional = param.optional ? 'Yes' : 'No';
                const description = param.description || 'No description';
                content += `| \`${param.name}\` | \`${param.type}\` | ${optional} | ${description} |\n`;
            }
            content += '\n';
        }

        // Add return type
        if (func.returnType) {
            content += `**Returns:** \`${func.returnType}\`\n\n`;
        }

        // Add location information
        content += `**Location:** \`${func.location.file}:${func.location.line}\`\n\n`;

        // Add examples if available
        if (func.examples && func.examples.length > 0) {
            content += '**Examples:**\n\n';
            for (const example of func.examples) {
                content += '```typescript\n';
                content += example;
                content += '\n```\n\n';
            }
        }

        return content;
    }

    private generateInterfaceDocumentation(iface: CodeElement): string {
        let content = `### ${iface.name}\n\n`;

        if (iface.deprecated) {
            content += '> **⚠️ Deprecated**: This interface is deprecated and may be removed in future versions.\n\n';
        }

        if (iface.description) {
            content += `${iface.description}\n\n`;
        }

        // Add inheritance information
        if (iface.extends) {
            content += `**Extends:** \`${iface.extends}\`\n\n`;
        }

        // Add location information
        content += `**Location:** \`${iface.location.file}:${iface.location.line}\`\n\n`;

        return content;
    }

    private generateTypeDocumentation(type: CodeElement): string {
        let content = `### ${type.name}\n\n`;

        if (type.deprecated) {
            content += '> **⚠️ Deprecated**: This type is deprecated and may be removed in future versions.\n\n';
        }

        if (type.description) {
            content += `${type.description}\n\n`;
        }

        // Add type definition
        if (type.returnType) {
            content += '**Definition:**\n\n';
            content += '```typescript\n';
            content += `type ${type.name} = ${type.returnType}`;
            content += '\n```\n\n';
        }

        // Add location information
        content += `**Location:** \`${type.location.file}:${type.location.line}\`\n\n`;

        return content;
    }

    private generateTableOfContents(sections: DocumentationSection[]): string {
        let toc = '## Table of Contents\n\n';
        
        for (const section of sections) {
            toc += `- [${section.title}](#${this.createAnchor(section.title)})\n`;
            
            if (section.subsections) {
                for (const subsection of section.subsections) {
                    toc += `  - [${subsection.title}](#${this.createAnchor(subsection.title)})\n`;
                }
            }
        }
        
        return toc + '\n';
    }

    private renderSection(section: DocumentationSection, _options: GenerationOptions): string {
        let content = `## ${section.title}\n\n`;
        content += section.content;
        
        if (section.subsections) {
            for (const subsection of section.subsections) {
                content += subsection.content;
            }
        }
        
        return content;
    }

    private generateFooter(analysisResult: AnalysisResult): string {
        const now = new Date().toISOString().split('T')[0];
        let footer = '\n---\n\n';
        footer += '*This documentation was automatically generated';
        
        if (analysisResult.metadata?.version) {
            footer += ` for version ${analysisResult.metadata.version}`;
        }
        
        footer += ` on ${now}.*\n\n`;
        footer += `*Generated from ${analysisResult.elements.length} code elements across ${analysisResult.fileStructure.length} files.*\n`;
        
        return footer;
    }

    private createAnchor(text: string): string {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');
    }

    private getModuleName(filePath: string): string {
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1];
        return fileName.replace(/\.[^/.]+$/, ''); // Remove extension
    }
}
