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

// Best free models from OpenRouter for documentation tasks
export const FREE_AI_MODELS: AIModel[] = [
    {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Llama 3.2 3B Instruct',
        description: 'Fast and efficient for code documentation',
        isFree: true,
        contextLength: 131072,
        strengths: ['Code understanding', 'Fast responses', 'Good for comments']
    },
    {
        id: 'meta-llama/llama-3.2-1b-instruct:free', 
        name: 'Llama 3.2 1B Instruct',
        description: 'Lightweight model for quick documentation tasks',
        isFree: true,
        contextLength: 131072,
        strengths: ['Very fast', 'Low resource usage', 'Basic documentation']
    },
    {
        id: 'qwen/qwen-2-7b-instruct:free',
        name: 'Qwen 2 7B Instruct',
        description: 'Excellent for technical documentation and explanations',
        isFree: true,
        contextLength: 131072,
        strengths: ['Technical writing', 'Detailed explanations', 'Multi-language support']
    },
    {
        id: 'microsoft/phi-3-mini-128k-instruct:free',
        name: 'Phi-3 Mini 128K',
        description: 'Microsoft\'s efficient model for code and documentation',
        isFree: true,
        contextLength: 128000,
        strengths: ['Code analysis', 'Structured output', 'Technical accuracy']
    },
    {
        id: 'huggingface/zephyr-7b-beta:free',
        name: 'Zephyr 7B Beta',
        description: 'Great for conversational documentation and explanations',
        isFree: true,
        contextLength: 32768,
        strengths: ['Natural language', 'User-friendly docs', 'Clear explanations']
    }
];

export class AIService {
    private baseUrl = 'https://openrouter.ai/api/v1';
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
        return config.get<string>('defaultModel') || 'qwen/qwen-2-7b-instruct:free';
    }

    public async isConfigured(): Promise<boolean> {
        await this.ensureInitialized();
        return await environmentManager.isConfigured();
    }

    public getAvailableModels(): AIModel[] {
        return FREE_AI_MODELS;
    }

    public async generateDocumentation(request: DocumentationRequest, modelId?: string): Promise<AIResponse> {
        await this.ensureInitialized();
        if (!(await this.isConfigured())) {
            throw new Error('AI service is not configured. Please set your OpenRouter API key in .env file or environment variables.');
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
        return `You are a technical documentation expert. Generate a comprehensive README.md for this project.

Project Context:
${request.context}

${request.projectInfo ? `
Project Information:
- Name: ${request.projectInfo.name}
- Description: ${request.projectInfo.description || 'Not provided'}
- Dependencies: ${request.projectInfo.dependencies?.join(', ') || 'Not provided'}
- Scripts: ${JSON.stringify(request.projectInfo.scripts || {}, null, 2)}
` : ''}

${request.existingContent ? `
Existing README content to improve/update:
${request.existingContent}
` : ''}

Generate a well-structured README.md with:
1. Project title and description
2. Installation instructions
3. Usage examples
4. API documentation (if applicable)
5. Contributing guidelines
6. License information

Use clear, professional language and proper Markdown formatting. Include code examples where appropriate.`;
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
        return `You are a technical writer. Generate a clear, concise description for this code or project component.

Content to describe:
${request.context}

${request.codeSnippet ? `
Code:
\`\`\`${request.language || 'typescript'}
${request.codeSnippet}
\`\`\`
` : ''}

Generate a clear, professional description that:
1. Explains what this code/component does
2. Highlights key features or functionality
3. Mentions any important usage notes
4. Uses appropriate technical terminology
5. Is concise but comprehensive

Focus on clarity and usefulness for developers.`;
    }

    private async makeAPIRequest(model: string, prompt: string): Promise<any> {
        const apiKey = await environmentManager.getSecureValue('openRouterApiKey');
        
        if (!apiKey) {
            throw new Error('OpenRouter API key not found. Please check your .env file or environment variables.');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/voznyye/AutoDoc',
                'X-Title': 'Auto Documentation Generator'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert technical documentation writer. Provide clear, comprehensive, and well-structured documentation.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7,
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed (${response.status}): ${errorText}`);
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
        return FREE_AI_MODELS.find(model => model.id === modelId);
    }

    public async selectBestModel(task: 'speed' | 'quality' | 'technical' | 'general'): Promise<string> {
        switch (task) {
            case 'speed':
                return 'meta-llama/llama-3.2-1b-instruct:free';
            case 'quality':
                return 'qwen/qwen-2-7b-instruct:free';
            case 'technical':
                return 'microsoft/phi-3-mini-128k-instruct:free';
            case 'general':
            default:
                return 'meta-llama/llama-3.2-3b-instruct:free';
        }
    }
}

export const aiService = new AIService();
