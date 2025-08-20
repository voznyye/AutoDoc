# 🤖 AI Features Guide - Auto Documentation Generator

## Overview

The Auto Documentation Generator now includes powerful AI features that leverage free models from OpenRouter.ai to create intelligent, context-aware documentation. This guide explains how to set up and use these AI-powered features.

## 🚀 What's New in v1.1.0

### AI-Powered Documentation Generation
- **Smart README Generation**: AI analyzes your codebase and creates comprehensive, context-aware README files
- **Intelligent Code Comments**: Generate meaningful comments for selected code snippets
- **Smart Descriptions**: AI explains what your functions and classes do in natural language
- **Enhanced Existing Documentation**: AI improves your current documentation while preserving custom content

### Free AI Models Support
- **Meta Llama 3.2** (3B and 1B variants) - Fast and efficient for code documentation
- **Qwen 2 7B** - Excellent for technical documentation and explanations  
- **Microsoft Phi-3 Mini** - Great for code analysis and structured output
- **Zephyr 7B Beta** - Perfect for conversational documentation

### Smart Features
- **Context-Aware**: AI understands your project structure, dependencies, and code patterns
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, and more
- **Configurable**: Customize AI behavior, creativity levels, and token limits
- **Fallback Support**: Gracefully falls back to standard generation if AI is unavailable

## 🛠️ Setup Instructions

### Step 1: Get Your Free OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up with Google/GitHub or create an account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Click "Create Key" and give it a descriptive name
5. Copy your API key (starts with `sk-or-...`)

### Step 2: Configure AI Securely

🔐 **Security First!** For maximum security, use environment variables or `.env` files instead of VSCode settings.

#### Option A: Environment Variable (Most Secure)
```bash
# macOS/Linux
export OPENROUTER_API_KEY="your-api-key-here"

# Windows Command Prompt
set OPENROUTER_API_KEY=your-api-key-here

# Windows PowerShell
$env:OPENROUTER_API_KEY="your-api-key-here"
```

#### Option B: .env File (Recommended for Development)
1. Run `Doc Generator: Configure AI Settings`
2. Click "Setup .env" button
3. Edit the created `.env` file:
```bash
OPENROUTER_API_KEY=your-actual-api-key-here
```

#### Option C: Configuration UI (Creates .env automatically)
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Doc Generator: Configure AI Settings`
3. Enter your API key (stored securely in .env)
4. Choose your preferred AI model
5. Adjust settings as needed
6. Click "Save Settings"

#### Option D: Manual VSCode Settings (Not Recommended)
⚠️ **Security Warning**: Only use for testing. Production setups should use environment variables.

```json
{
  "docGenerator.ai.enabled": true,
  "docGenerator.ai.defaultModel": "qwen/qwen-2-7b-instruct:free",
  "docGenerator.ai.enhanceExisting": true,
  "docGenerator.ai.includeExamples": true,
  "docGenerator.ai.maxTokens": 4000,
  "docGenerator.ai.temperature": 0.7
}
```

📚 **[Complete Security Guide](SECURE_SETUP_GUIDE.md)** - Detailed instructions for secure setup

### Step 3: Test Your Setup

1. Open Command Palette
2. Run `Doc Generator: Test AI Connection`
3. You should see a success message if everything is configured correctly

## 🎯 How to Use AI Features

### 1. Generate AI-Enhanced Documentation

**Command**: `Doc Generator: Generate Documentation with AI`

This command analyzes your entire project and creates comprehensive documentation:
- Intelligent README.md with project overview, installation instructions, usage examples
- API documentation with detailed descriptions
- Code structure analysis
- Dependency information
- Project metrics

**Usage**:
1. Open your project in VSCode/Cursor
2. Run the command from Command Palette
3. Wait for AI analysis to complete
4. Review the generated documentation

### 2. Generate Smart Comments

**Command**: `Doc Generator: Generate Smart Comments for Selected Code`

Creates intelligent comments for your code:
- JSDoc/TSDoc format for functions and classes
- Inline comments for complex logic
- Parameter and return value descriptions
- Usage examples when helpful

**Usage**:
1. Select code you want to comment
2. Right-click → "🤖 AI Documentation" → "Generate Smart Comments"
3. Or use Command Palette with the command above
4. AI-generated comments will be inserted above your selection

### 3. Generate Smart Descriptions

**Command**: `Doc Generator: Generate Smart Description for Selected Code`

Explains what your code does in natural language:
- Function/class purpose and behavior
- How it fits into the larger system
- Important implementation details
- Usage considerations

**Usage**:
1. Select a function, class, or code block
2. Right-click → "🤖 AI Documentation" → "Generate Smart Description"
3. A new document opens with detailed AI analysis

### 4. Context Menu Integration

For quick access, right-click on any selected code to see the "🤖 AI Documentation" submenu with:
- Generate Smart Comments
- Generate Smart Description

## ⚙️ Configuration Options

### AI Models

Choose the best model for your needs:

| Model | Best For | Speed | Quality |
|-------|----------|-------|---------|
| **Qwen 2 7B** (default) | Technical documentation | Medium | High |
| **Llama 3.2 3B** | General documentation | Fast | Good |
| **Llama 3.2 1B** | Quick comments | Very Fast | Basic |
| **Phi-3 Mini** | Code analysis | Fast | High |
| **Zephyr 7B** | User-friendly docs | Medium | Good |

### Settings Explained

- **`enabled`**: Turn AI features on/off
- **`enhanceExisting`**: Improve existing docs vs. replace completely
- **`includeExamples`**: Add code examples to generated documentation
- **`maxTokens`**: Maximum length of AI responses (100-8000)
- **`temperature`**: AI creativity (0=deterministic, 2=very creative)

## 🎨 AI Enhancement Features

### Context-Aware Analysis

The AI analyzes your project holistically:
- **Project Structure**: Understands file organization and architecture
- **Dependencies**: Knows what libraries you're using
- **Code Patterns**: Recognizes design patterns and conventions
- **Existing Documentation**: Preserves and enhances your custom content

### Smart README Generation

AI-generated READMEs include:
- Professional project description based on code analysis
- Installation instructions appropriate for your project type
- Usage examples with actual code from your project
- API overview with your classes and functions
- Project metrics and structure visualization
- Contributing guidelines and license information

### Intelligent Code Comments

The AI generates appropriate comments based on:
- Programming language (different formats for TS/JS/Python/etc.)
- Code complexity and purpose
- Function signatures and parameters
- Existing comment patterns in your codebase

## 🔧 Troubleshooting

### Common Issues

**"AI service is not configured"**
- Check your API key is correct
- Ensure `docGenerator.ai.enabled` is `true`
- Verify your OpenRouter account has credits (free tier includes credits)

**"Connection failed"**
- Test your internet connection
- Try a different AI model
- Check OpenRouter service status
- Verify API key hasn't expired

**"Generation takes too long"**
- Try a faster model like Llama 3.2 1B
- Reduce `maxTokens` setting
- Ensure you're on a stable internet connection

**"Documentation quality is poor"**
- Try Qwen 2 7B for better technical documentation
- Increase `temperature` for more creative output
- Add more descriptive comments to your code
- Ensure your code follows clear naming conventions

### Getting Help

1. **Test Connection**: Use `Doc Generator: Test AI Connection` to diagnose issues
2. **Check Logs**: Look at VSCode Developer Console for error details
3. **Model Selection**: Try different models if one isn't working well
4. **Fallback**: Extension works without AI if needed

## 💡 Best Practices

### For Better AI Results

1. **Clean Code**: Well-structured code with good naming produces better documentation
2. **Existing Comments**: Add basic comments to complex functions to guide the AI
3. **Project Description**: Add a description to your package.json for better context
4. **Consistent Style**: Use consistent coding patterns across your project

### Performance Tips

1. **Model Selection**: Use faster models for quick comments, slower for comprehensive docs
2. **Selective Generation**: Generate documentation for specific files/functions rather than entire projects when possible
3. **Batch Operations**: Generate multiple pieces of documentation at once rather than one by one

### Quality Guidelines

1. **Review Generated Content**: Always review AI-generated documentation before committing
2. **Combine with Manual**: Use AI as a starting point, then refine manually
3. **Preserve Custom Content**: AI enhancement preserves your custom documentation sections
4. **Iterative Improvement**: Regenerate documentation as your code evolves

## 🌟 Advanced Usage

### Custom Templates

While the extension provides smart defaults, you can influence AI output by:
- Adding example documentation to your project
- Using consistent comment styles
- Providing project description and metadata

### Integration with Existing Workflow

The AI features integrate seamlessly with existing documentation workflows:
- **Git Integration**: AI-enhanced docs are automatically staged with commits
- **Template Support**: Works with your existing documentation templates
- **Multi-Language**: Maintains consistency across different programming languages in your project

### Automation

Set up automated documentation:
1. Enable `docGenerator.autoUpdate` for automatic updates on file changes
2. Use `docGenerator.gitIntegration.preCommitHook` to update docs before commits
3. Configure AI to enhance documentation automatically

## 🚀 What's Next

The AI features are continuously being improved. Upcoming enhancements include:
- More AI models and providers
- Custom prompt templates
- Integration with more documentation formats
- Advanced code analysis and suggestions

---

*This guide covers version 1.1.0 of the Auto Documentation Generator. For the latest updates, check the [marketplace page](https://marketplace.visualstudio.com/items?itemName=voznyye.auto-documentation-generator).*

## 📚 Related Documentation

- [Quick Start Guide](QUICK_START.md)
- [Publishing Guide](PUBLISHING_GUIDE.md)
- [Usage Examples](USAGE_EXAMPLES.md)
- [Workflow Guide](WORKFLOW_GUIDE.md)
