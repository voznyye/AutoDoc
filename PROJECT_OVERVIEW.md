# AI Documentation Generator - Technical Architecture Overview

## Technical Architecture

### System Design Pattern
The AI Documentation Generator follows a **modular plugin architecture** designed for VS Code/Cursor extensions, implementing the **Command Pattern** with **Observer Pattern** for real-time updates.

### Data Flow Architecture
1. **Input Layer**: VS Code commands, file changes, git commits
2. **Processing Layer**: Code analysis, AI processing, documentation generation
3. **Output Layer**: Markdown files, status updates, user notifications

### Component Relationships
- **Extension.ts**: Main entry point, command registration, lifecycle management
- **AICommands**: Orchestrates documentation generation workflows
- **AIService**: Manages DeepSeek R1T2 Chimera integration and API calls
- **CodeAnalyzer**: Performs AST parsing and project structure analysis
- **Generators**: Transform analysis results into formatted documentation

## Function Reference

### Core Functions

#### `aiCommands.generateProjectDocumentation()`
**Purpose**: Complete AI-powered project documentation generation
**Parameters**: None (uses workspace context)
**Return Value**: `Promise<void>`
**Error Handling**: Try-catch with user notifications and fallback mechanisms

```typescript
public async generateProjectDocumentation(): Promise<void> {
    // Validation and setup checks
    if (!(await FirstTimeSetup.ensureSetup(this.context))) return;
    if (!(await this.checkAIConfiguration())) return;
    
    // Progress tracking and user feedback
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "🤖 Generating comprehensive project documentation...",
        cancellable: false
    }, async (progress) => {
        // Multi-stage processing with progress reporting
        progress.report({ increment: 15, message: "Analyzing entire project structure..." });
        const analysisResult = await this.codeAnalyzer.analyzeProject(rootPath, [], excludePatterns);
        
        progress.report({ increment: 40, message: "Generating README with AI..." });
        const readme = await this.readmeGenerator.generate(analysisResult);
        
        progress.report({ increment: 65, message: "Creating comprehensive project overview..." });
        const overview = await this.readmeGenerator.generateComprehensiveOverview(analysisResult);
        
        // Atomic file operations
        await Promise.all([
            this.saveDocumentation(readme, 'README.md'),
            this.saveDocumentation(overview, 'PROJECT_OVERVIEW.md')
        ]);
    });
}
```

#### `aiService.generateDocumentation(request: DocumentationRequest, modelId?: string)`
**Purpose**: Core AI model interaction for documentation generation
**Parameters**:
- `request: DocumentationRequest` - Structured request with context and project info
- `modelId?: string` - Optional model override (defaults to DeepSeek R1T2 Chimera)

**Return Value**: `Promise<AIResponse>`
```typescript
interface AIResponse {
    content: string;           // Generated documentation content
    model: string;            // Model used for generation
    usage?: {                 // Token usage statistics
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
```

#### `codeAnalyzer.analyzeProject(rootPath: string, languages: string[], excludePatterns: string[])`
**Purpose**: Comprehensive codebase analysis and AST parsing
**Parameters**:
- `rootPath: string` - Project root directory path
- `languages: string[]` - Target programming languages (empty = auto-detect)
- `excludePatterns: string[]` - File/directory exclusion patterns

**Return Value**: `Promise<AnalysisResult>`
```typescript
interface AnalysisResult {
    elements: CodeElement[];      // Functions, classes, interfaces
    dependencies: string[];       // External dependencies
    metrics: ProjectMetrics;      // LOC, complexity, etc.
    structure: FileStructure[];   // Directory tree analysis
    metadata?: ProjectMetadata;   // Package.json, config files
}
```

## API Documentation

### OpenRouter API Integration
**Base URL**: `https://openrouter.ai/api/v1`
**Authentication**: Bearer token via `Authorization` header
**Model Endpoint**: `/chat/completions`

**Request Format**:
```typescript
{
    model: "tngtech/deepseek-r1t2-chimera:free",
    messages: [
        {
            role: "system",
            content: "You are a professional technical documentation specialist..."
        },
        {
            role: "user", 
            content: "Generated prompt with project context"
        }
    ],
    max_tokens: 8192,
    temperature: 0.1,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
}
```

### VS Code Extension API

#### Command Registration
```typescript
vscode.commands.registerCommand('docGenerator.generateProjectDocs', handler);
vscode.commands.registerCommand('docGenerator.updateDocs', handler);
vscode.commands.registerCommand('docGenerator.configureAI', handler);
```

#### Configuration Management
```typescript
const config = vscode.workspace.getConfiguration('docGenerator');
await config.update(key, value, vscode.ConfigurationTarget.Global);
```

## Configuration Reference

### Extension Settings Schema

#### Core Settings
```json
{
    "docGenerator.enabled": {
        "type": "boolean",
        "default": true,
        "description": "Master enable/disable toggle for AI documentation generator"
    },
    "docGenerator.autoUpdate": {
        "type": "boolean", 
        "default": true,
        "description": "Automatic documentation updates on Git commits and file changes"
    },
    "docGenerator.outputDirectory": {
        "type": "string",
        "default": "./docs",
        "description": "Target directory for generated documentation files"
    }
}
```

#### AI Model Configuration
```json
{
    "docGenerator.ai.defaultModel": {
        "type": "string",
        "default": "tngtech/deepseek-r1t2-chimera:free",
        "enum": ["tngtech/deepseek-r1t2-chimera:free"],
        "description": "DeepSeek R1T2 Chimera - 671B parameter model for professional documentation"
    },
    "docGenerator.ai.maxTokens": {
        "type": "number",
        "default": 8192,
        "minimum": 2000,
        "maximum": 8192,
        "description": "Maximum tokens per request (optimized for comprehensive documentation)"
    },
    "docGenerator.ai.temperature": {
        "type": "number",
        "default": 0.1,
        "minimum": 0,
        "maximum": 1.0,
        "description": "AI consistency level (0.1 = highly consistent, 1.0 = more creative)"
    }
}
```

### Environment Variables
- `OPENROUTER_API_KEY`: Required API key for DeepSeek R1T2 Chimera access
- `DOC_GENERATOR_DEBUG`: Enable debug logging (development only)
- `DOC_GENERATOR_CACHE_DIR`: Custom cache directory for analysis results

## Implementation Details

### Error Handling Strategy
```typescript
try {
    const result = await aiService.generateDocumentation(request);
    return this.postProcessContent(result.content);
} catch (error) {
    console.error('AI generation failed:', error);
    
    // Graceful degradation
    if (error instanceof NetworkError) {
        return this.generateBasicDocumentation(analysisResult);
    }
    
    // User notification with actionable guidance
    vscode.window.showErrorMessage(
        `Documentation generation failed: ${error.message}`,
        'Retry', 'Configure AI', 'Report Issue'
    );
    
    throw error;
}
```

### Project Analysis Algorithm
1. **File Discovery**: Recursive directory traversal with exclude pattern filtering
2. **Language Detection**: File extension mapping and content analysis
3. **AST Parsing**: TypeScript compiler API for syntax tree generation
4. **Dependency Resolution**: Package.json and import statement analysis
5. **Metric Calculation**: Lines of code, cyclomatic complexity, maintainability index

## Performance Characteristics

### Benchmarks
- **Small Projects** (< 100 files): ~5-10 seconds for complete documentation
- **Medium Projects** (100-1000 files): ~15-30 seconds with parallel processing
- **Large Projects** (1000+ files): ~30-60 seconds with intelligent caching

### Memory Usage
- **Base Extension**: ~50MB RAM footprint
- **Analysis Phase**: ~100-200MB depending on project size
- **AI Processing**: ~50MB for API communications
- **Peak Usage**: ~300MB for very large codebases

## Dependencies Analysis

### Production Dependencies
```json
{
    "typescript": "^5.0.0",           // AST parsing and type analysis
    "simple-git": "^3.19.0",         // Git operations and change detection  
    "markdown-it": "^13.0.0",        // Markdown processing and validation
    "cheerio": "^1.0.0-rc.12",       // HTML/XML parsing for documentation
    "dotenv": "^17.2.1"              // Environment variable management
}
```

### Development Dependencies
```json
{
    "@types/vscode": "^1.80.0",      // VS Code API type definitions
    "@types/node": "^20.0.0",        // Node.js type definitions
    "webpack": "^5.0.0",             // Extension bundling and optimization
    "eslint": "^8.0.0",              // Code quality and consistency
    "prettier": "^3.0.0"             // Code formatting
}
```

---

*This technical overview provides comprehensive implementation details for developers working on or extending the AI Documentation Generator. For user-focused information, see README.md.*
