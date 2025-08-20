import * as vscode from 'vscode';
import { environmentManager } from '../utils/environmentManager';

export interface AIModel {
    id: string;
    name: string;
    description: string;
    isFree: boolean;
    contextLength: number;
    strengths: string[];
}

export interface AIResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface DocumentationRequest {
    type: 'readme' | 'api' | 'changelog' | 'comment' | 'description';
    context: string;
    codeSnippet?: string;
    existingContent?: string;
    language?: string;
    projectInfo?: {
        name: string;
        description?: string | undefined;
        dependencies?: string[] | undefined;
        scripts?: Record<string, string> | undefined;
    };
}

// Superior AI model for professional documentation generation
export const DEEPSEEK_R1T2_CHIMERA: AIModel = {
    id: 'tngtech/deepseek-r1t2-chimera:free',
    name: 'TNG: DeepSeek R1T2 Chimera (free)',
    description: 'Second-generation 671B-parameter mixture-of-experts model with strong reasoning performance, 60k context length, and consistent <think> token behavior for comprehensive documentation',
    isFree: true,
    contextLength: 163840, // ~163k context as per OpenRouter specs
    strengths: [
        'Superior reasoning capabilities',
        'Long-context analysis (60k+ tokens)',
        'Professional documentation generation', 
        'Technical depth and accuracy',
        'Structured markdown output',
        'Architecture understanding',
        'Cost-effective intelligence',
        'Consistent analysis behavior'
    ]
};

// Available AI models for documentation tasks - DeepSeek R1T2 Chimera is the primary model
export const AVAILABLE_AI_MODELS: AIModel[] = [
    DEEPSEEK_R1T2_CHIMERA
];

export class AIService {
    private baseUrl = 'https://openrouter.ai/api/v1';  // OpenRouter endpoint for DeepSeek R1T2 Chimera
    private defaultModel: string;
    private isInitialized = false;

    constructor() {
        this.defaultModel = this.getDefaultModel();
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            await environmentManager.loadEnvironment();
            this.isInitialized = true;
        }
    }

    private getDefaultModel(): string {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        return config.get<string>('defaultModel') || 'tngtech/deepseek-r1t2-chimera:free';
    }

    public async isConfigured(): Promise<boolean> {
        await this.ensureInitialized();
        return await environmentManager.isConfigured();
    }

    public getAvailableModels(): AIModel[] {
        return AVAILABLE_AI_MODELS;
    }

    public async generateDocumentation(request: DocumentationRequest, modelId?: string): Promise<AIResponse> {
        await this.ensureInitialized();
        if (!(await this.isConfigured())) {
            throw new Error('AI service is not configured. Please set your OpenRouter API key in environment variables for DeepSeek R1T2 Chimera access.');
        }

        const model = modelId || this.defaultModel;
        const prompt = this.buildPrompt(request);

        try {
            const response = await this.makeAPIRequest(model, prompt);
            return {
                content: response.choices[0].message.content,
                model: model,
                usage: response.usage
            };
        } catch (error) {
            console.error('AI API Error:', error);
            throw new Error(`Failed to generate documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private buildPrompt(request: DocumentationRequest): string {
        const prompts = {
            readme: this.buildReadmePrompt(request),
            api: this.buildApiPrompt(request),
            changelog: this.buildChangelogPrompt(request),
            comment: this.buildCommentPrompt(request),
            description: this.buildDescriptionPrompt(request)
        };

        return prompts[request.type];
    }

    private buildReadmePrompt(request: DocumentationRequest): string {
        return `You are an expert technical documentation specialist. Analyze this codebase comprehensively and create detailed, professional documentation.

REQUIREMENTS:
- Generate complete, production-ready documentation
- Include detailed API references with examples
- Document architecture, patterns, and design decisions
- Provide comprehensive setup and usage instructions
- Create clear, structured markdown with proper hierarchy
- Include code examples for all major features
- Document error handling and edge cases

ANALYSIS DEPTH:
- Full codebase understanding, not surface-level
- Identify core functionality and user workflows  
- Document internal architecture and data flow
- Explain configuration options and customization
- Include troubleshooting and FAQ sections

**PROJECT ANALYSIS:**
${request.context}

${request.projectInfo ? `
**PROJECT METADATA:**
- Name: ${request.projectInfo.name}
- Current Description: ${request.projectInfo.description || 'None provided'}
- Dependencies: ${request.projectInfo.dependencies?.join(', ') || 'None'}
- Available Scripts: ${Object.keys(request.projectInfo.scripts || {}).join(', ') || 'None'}
` : ''}

${request.existingContent ? `
**EXISTING CONTENT TO ENHANCE:**
${request.existingContent}
` : ''}

**DOCUMENTATION STRUCTURE REQUIRED:**

# Project Name
*Clear, compelling project description with immediate value proposition*

## Overview
*Comprehensive explanation of what this project does, its purpose, and target use cases*

## Architecture
*System design, component relationships, and data flow diagrams*

## Features
*Detailed feature breakdown with technical specifications*

## Installation & Setup
*Complete setup instructions with system requirements*

## API Reference
*Full API documentation with parameters, return values, and examples*

## Configuration
*All configuration options with detailed explanations*

## Usage Examples
*Comprehensive examples covering common and advanced use cases*

## Development
*Development environment setup, build process, testing*

## Troubleshooting
*Common issues and their solutions*

## Contributing
*Contribution guidelines and development workflow*

## License & Credits
*License information and acknowledgments*

OUTPUT FORMAT: Professional markdown documentation suitable for GitHub/enterprise use with proper formatting, code blocks, tables, and technical depth.`;
    }

    private buildApiPrompt(request: DocumentationRequest): string {
        return `You are a technical writer specializing in API documentation. Generate comprehensive API documentation.

Code to document:
\`\`\`${request.language || 'typescript'}
${request.codeSnippet || request.context}
\`\`\`

Context: ${request.context}

Generate API documentation that includes:
1. Function/method descriptions
2. Parameter descriptions with types
3. Return value descriptions
4. Usage examples
5. Error handling information
6. Any relevant notes or warnings

Use clear, concise language and follow standard API documentation practices.`;
    }

    private buildChangelogPrompt(request: DocumentationRequest): string {
        return `You are maintaining a project changelog. Generate or update changelog entries based on the provided changes.

Changes Context:
${request.context}

${request.existingContent ? `
Existing CHANGELOG.md:
${request.existingContent}
` : ''}

Generate changelog entries following the "Keep a Changelog" format:
- Use semantic versioning
- Group changes into Added, Changed, Deprecated, Removed, Fixed, Security
- Include dates in YYYY-MM-DD format
- Write clear, concise descriptions
- Focus on user-facing changes

Provide the new changelog section to add.`;
    }

    private buildCommentPrompt(request: DocumentationRequest): string {
        return `You are a code documentation expert. Generate clear, helpful code comments.

Code to document:
\`\`\`${request.language || 'typescript'}
${request.codeSnippet || request.context}
\`\`\`

Context: ${request.context}

Generate appropriate code comments:
1. JSDoc/docstring format for functions and classes
2. Inline comments for complex logic
3. Clear parameter and return value descriptions
4. Examples where helpful
5. Any important notes about usage or behavior

Use the appropriate comment format for the programming language.`;
    }

    private buildDescriptionPrompt(request: DocumentationRequest): string {
        return `You are analyzing code changes to update existing documentation. Be precise and comprehensive.

CHANGE ANALYSIS:
- Identify what functionality was added, modified, or removed
- Determine impact on existing documentation sections
- Update affected documentation while maintaining consistency
- Add new sections for new features
- Mark deprecated functionality clearly

**CONTENT TO ANALYZE:**
${request.context}

${request.codeSnippet ? `
**CODE CHANGES:**
\`\`\`${request.language || 'typescript'}
${request.codeSnippet}
\`\`\`
` : ''}

UPDATE REQUIREMENTS:
- Maintain documentation quality and structure
- Update examples and code snippets to reflect changes
- Ensure all cross-references remain valid
- Update table of contents and navigation
- Preserve existing documentation style and format

OUTPUT: Updated documentation sections with change summary and detailed technical analysis.`;
    }

    private async makeAPIRequest(model: string, prompt: string): Promise<any> {
        const apiKey = await environmentManager.getSecureValue('openRouterApiKey');
        
        if (!apiKey) {
            throw new Error('OpenRouter API key not found. Please set your OPENROUTER_API_KEY environment variable for DeepSeek R1T2 Chimera access.');
        }

        // DeepSeek R1T2 Chimera optimized configuration
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        const maxTokens = config.get<number>('maxTokens') || 8192;
        const temperature = config.get<number>('temperature') || 0.1; // Low temperature for consistent documentation

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/voznyye/AutoDoc',
                'X-Title': 'AutoDoc-DeepSeek-Extension-v2.0.0'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional technical documentation specialist with expertise in software architecture, API design, and developer experience. Generate comprehensive, production-ready documentation with technical depth and clarity.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: temperature,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek R1T2 Chimera API request failed (${response.status}): ${errorText}`);
        }

        return await response.json();
    }

    public async testConnection(modelId?: string): Promise<boolean> {
        try {
            await this.ensureInitialized();
            
            // First check if we have a valid API key
            const isConfigured = await this.isConfigured();
            if (!isConfigured) {
                return false;
            }

            // Test with environment manager's secure test
            const testResult = await environmentManager.testApiKey('openrouter');
            if (!testResult) {
                return false;
            }

            // Additional test with a minimal documentation request
            const testRequest: DocumentationRequest = {
                type: 'description',
                context: 'Test connection to AI service.'
            };
            
            await this.generateDocumentation(testRequest, modelId);
            return true;
        } catch (error) {
            console.error('AI connection test failed:', error);
            return false;
        }
    }

    public async getModelInfo(modelId: string): Promise<AIModel | undefined> {
        return AVAILABLE_AI_MODELS.find(model => model.id === modelId);
    }

    public async selectBestModel(_task: 'speed' | 'quality' | 'technical' | 'general'): Promise<string> {
        // DeepSeek R1T2 Chimera is optimized for all documentation tasks
        return 'tngtech/deepseek-r1t2-chimera:free';
    }
}

export const aiService = new AIService();
