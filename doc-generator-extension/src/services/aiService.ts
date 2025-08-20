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
        return `You are an expert technical writer who creates documentation that developers love to read. 

**Your Task:** Generate a comprehensive, human-readable README.md that explains what this project actually DOES in plain English.

**Project Analysis:**
${request.context}

${request.projectInfo ? `
**Project Details:**
- Name: ${request.projectInfo.name}
- Current Description: ${request.projectInfo.description || 'None provided'}
- Key Dependencies: ${request.projectInfo.dependencies?.slice(0, 10).join(', ') || 'None'}
- Available Scripts: ${Object.keys(request.projectInfo.scripts || {}).join(', ') || 'None'}
` : ''}

${request.existingContent ? `
**Existing README to enhance:**
${request.existingContent}
` : ''}

**Critical Requirements:**
1. **Write in conversational, human English** - no robotic language
2. **Focus on WHAT the project does** and WHY someone would use it
3. **Explain the value proposition** in the first paragraph
4. **Use real-world examples** and practical use cases
5. **Make it engaging** - people should want to try this project

**Structure your README with:**

# Project Name
*One sentence that immediately explains what this does and why it matters*

## What This Project Does
*2-3 paragraphs explaining the core functionality in simple terms*

## Why You'd Want This
*Bullet points of key benefits and use cases*

## Quick Start
*Minimum steps to get running*

## How It Works
*Brief technical overview without jargon*

## Installation
*Step-by-step instructions*

## Usage Examples
*Real examples that show value*

## Configuration
*Key settings explained simply*

## Contributing
*How others can help*

**Writing Style:**
- Use "you" and "your" 
- Write like explaining to a smart colleague
- Avoid corporate speak
- Make every sentence add value
- Use examples and analogies
- Be enthusiastic but not overselling

**Remember:** A great README makes someone go "Oh cool, I need this!" within 30 seconds.`;
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
        return `You are an expert technical communicator who explains complex code in simple, human terms.

**Your Task:** Create a clear, engaging description that makes this code understandable to any developer.

**Content to analyze:**
${request.context}

${request.codeSnippet ? `
**Code to describe:**
\`\`\`${request.language || 'typescript'}
${request.codeSnippet}
\`\`\`
` : ''}

**Create a description that:**

1. **Starts with what it DOES** - not how it's implemented
2. **Explains the purpose** - why this exists and when you'd use it
3. **Highlights key benefits** - what makes this useful or special
4. **Mentions important details** - anything a developer should know
5. **Uses natural language** - write like explaining to a colleague

**Writing guidelines:**
- Lead with the main purpose/benefit
- Use active voice ("This function calculates..." not "Calculations are performed...")
- Avoid jargon when possible, explain when necessary
- Give practical context ("Perfect for validating user input" not "Performs validation")
- Be concise but complete
- Make it interesting - show why someone should care

**Example style:**
Instead of: "This function performs data validation operations on input parameters"
Write: "Validates user input and catches common mistakes before they cause problems in your app"

**Your response should be 1-3 sentences that immediately make the code's purpose and value clear.**`;
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
