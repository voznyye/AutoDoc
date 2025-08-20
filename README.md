
# 🤖 AI Documentation Generator for VS Code

![Auto-Generated](https://img.shields.io/badge/docs-auto--generated-brightgreen.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![AI-Powered](https://img.shields.io/badge/AI-Enhanced-purple.svg)

Automatically generate comprehensive documentation for your projects using DeepSeek's advanced AI models. This VS Code extension creates both user-friendly READMEs and technical overviews with a single command.

## Features

- **AI-Powered Documentation**: Generates README.md and PROJECT_OVERVIEW.md using DeepSeek R1T2 Chimera
- **Full Codebase Analysis**: Understands your project structure, dependencies, and code patterns
- **Git Integration**: Auto-updates documentation on commit (optional)
- **Customizable Templates**: Control documentation style and content focus
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, and more
- **Smart Updates**: Only regenerates documentation when code changes warrant it

## Installation

1. Install from VS Code Marketplace:
   ```bash
   ext install ai-doc-generator
   ```
2. Configure your DeepSeek API token:
   - Get a free API key from [OpenRouter.ai](https://openrouter.ai/keys)
   - Run `AI Doc Generator: Configure API Token` from the command palette
   - Enter your `sk-...` API key when prompted

## Usage

### Generate Documentation
1. Open your project in VS Code
2. Open command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run `AI Doc Generator: Generate Project Documentation`

The extension will:
1. Analyze your entire codebase
2. Generate two documentation files:
   - `README.md` (user-friendly overview)
   - `PROJECT_OVERVIEW.md` (technical deep dive)

### Auto-Update on Commit
Enable automatic documentation updates:
```bash
AI Doc Generator: Toggle Auto-Update on Commit
```

## Configuration

Customize your documentation generation through settings (`Ctrl+,`):
```json
"ai-doc-generator": {
  "apiToken": "your-deepseek-api-key",
  "autoUpdateOnCommit": true,
  "excludePatterns": ["node_modules/**", "dist/**"],
  "ai": {
    "defaultModel": "tngtech/deepseek-r1t2-chimera:free",
    "maxTokens": 8192,
    "temperature": 0.1
  }
}
```

## Example Outputs

### README.md Includes:
- Project description
- Installation instructions
- Usage examples
- Features overview
- Contributing guidelines
- Badges and metadata

### PROJECT_OVERVIEW.md Includes:
- Complete API reference
- Architecture diagrams
- Technical specifications
- Code examples
- Error handling documentation
- Performance characteristics

## How It Works

1. **Code Analysis**: The extension scans your project, excluding specified patterns
2. **AI Processing**: Sends code context to DeepSeek R1T2 Chimera via OpenRouter API
3. **Document Generation**: Creates comprehensive markdown files tailored to your project
4. **Git Integration**: Optionally stages updated docs for your next commit

## Contributing

We welcome contributions! Here's how to help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
git clone https://github.com/your-repo/ai-doc-generator.git
cd ai-doc-generator
npm install
code .
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This README was automatically generated with AI assistance. To update, run the documentation generator or make changes to the source code and commit.*