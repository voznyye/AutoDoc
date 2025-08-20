# AutoDoc - Auto Documentation Generation Project

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VSCode](https://img.shields.io/badge/VSCode-1.80.0+-blue.svg)

This repository contains a full-featured plugin for VSCode and Cursor Pro that automatically generates and maintains project documentation on every Git commit.

## 📁 Project Structure

```
AutoDoc/
├── README.md                           # This file
├── documentation-plugin-prompt.md      # Original technical specification
├── USAGE_EXAMPLES.md                   # Usage examples for different projects
├── WORKFLOW_GUIDE.md                   # Team workflow guide
├── PUBLISHING_GUIDE.md                 # Publishing to VSCode Marketplace
├── QUICK_START.md                      # Quick start guide
└── doc-generator-extension/             # Main VSCode plugin
    ├── package.json                     # Package configuration
    ├── tsconfig.json                    # TypeScript configuration
    ├── webpack.config.js                # Build configuration
    ├── README.md                        # Plugin documentation
    ├── CHANGELOG.md                     # Change history
    ├── LICENSE                          # MIT License
    ├── src/                             # Source code
    │   ├── extension.ts                 # Main activation file
    │   ├── commands/                    # Plugin commands
    │   │   ├── generateDocs.ts          # Documentation generation
    │   │   ├── updateDocs.ts            # Documentation updates
    │   │   └── configureDocs.ts         # Configuration
    │   ├── providers/                   # Providers
    │   │   ├── documentationProvider.ts # Main provider
    │   │   ├── gitHookProvider.ts       # Git integration
    │   │   └── configurationProvider.ts # Configuration
    │   ├── analyzers/                   # Code analyzers
    │   │   └── codeAnalyzer.ts          # TypeScript/JavaScript analysis
    │   ├── generators/                  # Documentation generators
    │   │   ├── markdownGenerator.ts     # API documentation
    │   │   ├── readmeGenerator.ts       # README generator
    │   │   └── changelogGenerator.ts    # CHANGELOG generator
    │   ├── utils/                       # Utilities
    │   │   ├── gitUtils.ts              # Git operations
    │   │   └── fileUtils.ts             # File operations
    │   └── templates/                   # Documentation templates
    │       ├── readme.template.md
    │       ├── api.template.md
    │       └── changelog.template.md
    ├── media/                           # Media files
    │   ├── icon.svg                     # Plugin icon
    │   └── icon.png                     # Plugin icon (PNG)
    └── out/                             # Compiled files
```

## 🚀 Plugin Features

### ✨ Core Features
- **Automatic documentation generation** from source code
- **Git integration** with pre-commit hooks
- **Multi-language support**: TypeScript, JavaScript, Python, Java, C#, Go, Rust, PHP
- **Multiple output formats**: README.md, API docs, CHANGELOG.md
- **Highly configurable** through VSCode settings

### 🎨 User Interface
- VSCode Command Palette integration
- Status bar indicator
- Web panel for preview
- Configuration wizard

### 🔧 Technical Features
- **AST parsing** for accurate code analysis
- **JSDoc/docstrings** support
- **Incremental updates** for large projects
- **Caching** for performance optimization
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