import { SettingsManager } from '../utils/settingsManager';

export interface DeepSeekResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export class DeepSeekClient {
    private readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    /**
     * Generate documentation using DeepSeek R1T2 Chimera model
     */
    async generateDocumentation(prompt: string, codeContext: string): Promise<string> {
        const apiToken = SettingsManager.getApiToken();
        if (!apiToken) {
            throw new Error('DeepSeek API token not configured. Please configure it in settings.');
        }

        const aiConfig = SettingsManager.getAIConfig();

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/voznyye/AutoDoc',
                    'X-Title': 'AutoDoc-DeepSeek-Extension-v2.0.1'
                },
                body: JSON.stringify({
                    model: aiConfig.model,
                    messages: [
                        { 
                            role: 'system', 
                            content: prompt 
                        },
                        { 
                            role: 'user', 
                            content: codeContext 
                        }
                    ],
                    max_tokens: aiConfig.maxTokens,
                    temperature: aiConfig.temperature,
                    top_p: 0.9,
                    frequency_penalty: 0.1,
                    presence_penalty: 0.1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`DeepSeek API request failed (${response.status}): ${errorText}`);
            }

            const data: any = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from DeepSeek API');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek API Error:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate documentation: ${error.message}`);
            }
            throw new Error('Unknown error occurred while generating documentation');
        }
    }

    /**
     * Test API connection and token validity
     */
    async testConnection(): Promise<boolean> {
        try {
            const testPrompt = 'You are a documentation assistant. Reply with just "OK" to confirm the connection.';
            const testContext = 'Test connection request.';
            
            const result = await this.generateDocumentation(testPrompt, testContext);
            return result.trim().toLowerCase().includes('ok');
        } catch (error) {
            console.error('DeepSeek connection test failed:', error);
            return false;
        }
    }

    /**
     * Get README.md generation prompt
     */
    getReadmePrompt(): string {
        return `Create a user-friendly README.md for this VS Code/Cursor plugin.

REQUIREMENTS:
- Clear project description in simple terms that any developer can understand
- Key features and benefits for end users
- Installation and setup instructions (step-by-step)
- Quick start guide with practical examples
- Use cases and real-world scenarios where this plugin helps
- Contributing guidelines for community involvement
- Professional but accessible tone - not too technical

FORMAT: Clean GitHub markdown suitable for end users and potential contributors.
AUDIENCE: Developers who want to understand and use this plugin.
TONE: Friendly, welcoming, and helpful.

Focus on what the plugin does, how it helps users, and how to get started quickly.`;
    }

    /**
     * Get PROJECT_OVERVIEW.md generation prompt
     */
    getTechnicalOverviewPrompt(): string {
        return `Create comprehensive technical documentation for PROJECT_OVERVIEW.md.

REQUIREMENTS:
- Complete function reference with parameters, return types, and detailed examples
- Detailed API documentation with all endpoints and interfaces
- System architecture and data flow explanations
- Implementation details and design decisions
- Configuration options with technical specifications
- Performance characteristics and limitations
- Dependency analysis and requirements
- Error handling and troubleshooting guides
- Code patterns and algorithms used
- Memory usage and optimization strategies

FORMAT: Detailed technical markdown for developers and maintainers.
DEPTH: Production-level technical documentation with complete code examples.
AUDIENCE: Developers working on or extending this codebase.

Include comprehensive technical details that would help a developer understand, maintain, or extend this system.`;
    }
}
