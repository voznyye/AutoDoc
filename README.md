# 🤖 AI Documentation Generator - AutoDoc Project

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VSCode](https://img.shields.io/badge/VSCode-1.80.0+-blue.svg)
![AI Powered](https://img.shields.io/badge/AI-powered-purple.svg)
![Refactored](https://img.shields.io/badge/refactored-v2.0.0-brightgreen.svg)

**🎉 MAJOR REFACTORING COMPLETE!** This repository contains a **streamlined, AI-powered VS Code/Cursor extension** that automatically generates and maintains comprehensive project documentation using intelligent AI analysis.

## ⚡ What's New in v2.0.0

**🎯 Focused AI-Only Approach:**
- **2 main commands** (down from 10) - Generate & Update documentation  
- **100% AI-powered** - No manual workflows
- **Simplified setup** - Just API key + model selection
- **8 essential settings** (down from 16) - Streamlined configuration
- **Template-free** - AI generates dynamic, contextual content

## 📁 Streamlined Project Structure (v2.0.0)

```
AutoDoc/
├── README.md                           # 🆕 Updated project overview
├── REFACTORING_SUMMARY.md              # 🆕 Complete refactoring details
├── documentation-plugin-prompt.md      # Original technical specification  
├── USAGE_EXAMPLES.md                   # Usage examples for different projects
├── WORKFLOW_GUIDE.md                   # Team workflow guide
├── PUBLISHING_GUIDE.md                 # Publishing to VSCode Marketplace
├── QUICK_START.md                      # Quick start guide
└── doc-generator-extension/             # 🤖 Streamlined AI Plugin
    ├── package.json                     # ✅ Updated v2.0.0 configuration
    ├── tsconfig.json                    # TypeScript configuration
    ├── webpack.config.js                # Build configuration
    ├── README.md                        # Plugin documentation
    ├── CHANGELOG.md                     # Change history
    ├── LICENSE                          # MIT License
    ├── src/                             # 🧹 Cleaned source code
    │   ├── extension.ts                 # ✅ Simplified activation (2 commands)
    │   ├── commands/
    │   │   └── aiCommands.ts            # ✅ All AI operations centralized
    │   ├── generators/
    │   │   ├── readmeGenerator.ts       # ✅ Base generator class
    │   │   └── aiEnhancedReadmeGenerator.ts # ✅ AI-powered generation
    │   ├── providers/
    │   │   ├── documentationProvider.ts # ✅ Core analysis (simplified)
    │   │   └── gitHookProvider.ts       # ✅ Git integration (simplified)
    │   ├── services/
    │   │   └── aiService.ts             # ✅ Core AI integration
    │   ├── analyzers/
    │   │   └── codeAnalyzer.ts          # ✅ Project analysis
    │   └── utils/                       # ✅ Essential utilities
    │       ├── fileUtils.ts             # File operations
    │       ├── gitUtils.ts              # Git operations  
    │       ├── environmentManager.ts    # Secure API key management
    │       └── firstTimeSetup.ts        # AI setup wizard
    ├── media/                           # Media files
    │   ├── icon.svg                     # Plugin icon
    │   └── icon.png                     # Plugin icon (PNG)
    └── out/                             # Compiled files
```

### 🗑️ Removed in Refactoring:
- ❌ `commands/generateDocs.ts` - Replaced by AI-only approach
- ❌ `commands/updateDocs.ts` - Integrated into aiCommands.ts
- ❌ `commands/configureDocs.ts` - Simplified to AI config only
- ❌ `providers/configurationProvider.ts` - No longer needed
- ❌ `generators/changelogGenerator.ts` - AI generates dynamically
- ❌ `generators/markdownGenerator.ts` - AI generates dynamically  
- ❌ `templates/` directory - AI creates content without templates

## 🚀 Streamlined AI Features (v2.0.0)

### 🤖 AI-Powered Core Features
- **🎯 2 Main Commands**: Generate Project Documentation & Update Documentation
- **🧠 100% AI-Driven**: Uses free OpenRouter models for intelligent documentation
- **🔄 Auto-Updates**: Monitors file changes and Git commits for documentation sync
- **🌍 Universal Language Support**: AI automatically detects and analyzes any programming language
- **📄 Dynamic Content**: No templates - AI generates contextual, human-readable documentation
- **🔒 Secure Setup**: API keys stored only in system environment variables

### 🎨 Simplified User Experience  
- **⚡ One-Click Generation**: Single command creates comprehensive project docs
- **📊 Real-Time Status**: Status bar shows AI operation progress
- **🔧 Streamlined Config**: Simple AI model selection and basic preferences
- **🎯 Smart Setup Wizard**: Guided first-time AI configuration

### 🔧 AI Technical Features
- **🔍 Intelligent Code Analysis**: Deep AST parsing for accurate project understanding
- **📝 Context-Aware Generation**: AI analyzes project structure, dependencies, and code patterns
- **🔄 Smart Updates**: AI preserves custom content while refreshing technical details
- **⚡ Free AI Models**: 5 high-quality, free models optimized for documentation tasks
- **🌐 Cross-Platform**: Works on Windows, macOS, and Linux
- **Asynchronous processing** without UI blocking

## 📦 Installation and Usage

### Requirements
- Node.js 16+
- VSCode 1.80.0+
- Git (for integration)

### Install Dependencies
```bash
cd doc-generator-extension
npm install
```

### Compile
```bash
npm run compile
```

### Development
```bash
npm run watch
```

### Test in VSCode
1. Open `doc-generator-extension` folder in VSCode
2. Press `F5` to launch Extension Development Host
3. In the new VSCode window, open any project
4. Use commands from Command Palette (`Ctrl+Shift+P`)

## 🎯 Using the Plugin

### Plugin Commands
- `Doc Generator: Generate Documentation` - Generate complete documentation
- `Doc Generator: Update Documentation` - Update existing documentation
- `Doc Generator: Configure Settings` - Open configuration wizard
- `Doc Generator: Preview Changes` - Preview documentation changes

### Configuration
Configure through VSCode settings.json:

```json
{
  "docGenerator.enabled": true,
  "docGenerator.autoUpdate": true,
  "docGenerator.includePrivate": false,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.supportedLanguages": [
    "typescript",
    "javascript", 
    "python"
  ],
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "autoStage": true,
    "commitMessage": "docs: update documentation"
  }
}
```

## 🔄 Git Integration

The plugin automatically:
- Installs pre-commit hooks
- Updates documentation before commits
- Stages changed documentation files
- Uses configurable commit messages

## 📋 Generated Documentation

### README.md
- Project description
- Installation instructions
- Usage examples
- API overview
- Project structure

### API Documentation
- Detailed API reference
- Function signatures and parameters
- Class hierarchies
- Interface definitions

### CHANGELOG.md
- Version history
- Categorized changes
- Automatic version detection

## 🏗️ Architecture

### Core Components
1. **Extension.ts** - Entry point and activation
2. **DocumentationProvider** - Main generation logic
3. **CodeAnalyzer** - Source code analysis with AST
4. **Generators** - Create different documentation types
5. **GitHookProvider** - Git integration
6. **ConfigurationProvider** - Settings management

### Data Flow
```
Source Code → CodeAnalyzer → AnalysisResult → Generators → Documentation Files → Git Integration
```

## 🧪 Testing

```bash
# Compile
npm run compile

# Lint
npm run lint

# Fix linting
npm run lint:fix
```

## 📦 Publishing to VSCode Marketplace

### 1. Install vsce
```bash
npm install -g @vscode/vsce
```

### 2. Create Publisher Account
1. Go to https://dev.azure.com
2. Create organization
3. Generate Personal Access Token

### 3. Create Publisher
```bash
vsce create-publisher your-publisher-name
vsce login your-publisher-name
```

### 4. Package and Publish
```bash
# Create .vsix package
vsce package

# Publish to Marketplace
vsce publish
```

## 📝 Development

### Adding New Language Support
1. Extend `CodeAnalyzer.ts`
2. Add parsing for specific constructs
3. Update `supportedLanguages` configuration

### Creating New Generator
1. Create class in `generators/` folder
2. Implement generation interface
3. Integrate with `DocumentationProvider`

### Custom Templates
1. Create template in `templates/` folder
2. Use Handlebars syntax
3. Configure path in settings

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](doc-generator-extension/LICENSE) file

## 🎉 Conclusion

This project provides a complete solution for automatic documentation generation that:

✅ **Fully implements** all requirements from the technical specification  
✅ **Ready for production** use  
✅ **Easily extensible** for new languages and formats  
✅ **Integrates** with existing workflows  
✅ **Optimized** for large projects  

The plugin can be published to VSCode Marketplace and used by developers to automate documentation creation and maintenance processes.

---

*Made with ❤️ for developers who value quality documentation*