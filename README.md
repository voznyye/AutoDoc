

# AI Documentation Generator for VS Code

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Auto-Generated](https://img.shields.io/badge/docs-auto--generated-brightgreen.svg)
![AI Enhanced](https://img.shields.io/badge/AI-enhanced-purple.svg)

Automatically generate comprehensive documentation for your codebase using AI-powered analysis. This VS Code extension creates both user-friendly READMEs and technical project overviews with DeepSeek R1T2 Chimera's advanced AI capabilities.

## Features ✨

- **AI-Powered Documentation**: Generates human-readable READMEs and technical specifications
- **Smart Code Analysis**: Understands your project structure and code relationships
- **Git Integration**: Auto-updates documentation on commit (configurable)
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, C#, and more
- **Customizable Templates**: Control documentation depth and focus areas
- **One-Click Generation**: Create docs with a single command or via context menu
- **Secure Configuration**: API token management with persistent storage

## Installation 📦

1. Install via VS Code Marketplace:
   - Open Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
   - Search for "AI Documentation Generator"
   - Click Install

2. Configure your DeepSeek API token:
   ```bash
   Press F1 → "AI Doc Generator: Configure" → Enter your API token
   ```
   [Get free API key](https://openrouter.ai/keys)

## Usage 🚀

### Generate Documentation
1. Open your project in VS Code
2. Use any of these methods:
   - **Command Palette**: `Ctrl+Shift+P` → "Generate Project Documentation"
   - **Status Bar**: Click the 🤖 icon in bottom-right
   - **Right-Click**: Explorer context menu → "Generate Documentation"

3. Choose documentation type:
   - `README.md` (user-focused)
   - `PROJECT_OVERVIEW.md` (technical deep dive)

### Automatic Updates
Enable git-triggered updates in settings:
```json
"ai-doc-generator.autoUpdateOnCommit": true
```
The extension will:
- Detect significant code changes
- Regenerate documentation on commit
- Stage updated files automatically

## Configuration ⚙️

### Settings
Access via `Ctrl+,` → Extensions → AI Documentation Generator:
```json
{
  "ai-doc-generator.apiToken": "sk-...",
  "ai-doc-generator.autoUpdateOnCommit": true,
  "ai-doc-generator.excludePatterns": [
    "node_modules/**",
    "dist/**",
    "*.test.*"
  ]
}
```

### Custom Prompts
Override default AI instructions by creating `.aidocrc`:
```json
{
  "readmePrompt": "Custom instructions for README generation...",
  "overviewPrompt": "Custom technical documentation requirements..."
}
```

## Example Outputs 📄

### Generated README.md Includes:
- Project overview
- Installation guide
- Usage examples
- API reference
- Contribution guidelines
- License information

### PROJECT_OVERVIEW.md Includes:
- Architecture diagrams
- Class/method documentation
- Data flow explanations
- Configuration options
- Error handling strategies
- Performance characteristics

## Contributing 🤝

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

### Development Setup
```bash
git clone https://github.com/your-username/ai-doc-generator.git
cd ai-doc-generator
npm install
code .
```

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This README was automatically generated with AI assistance on 2023-12-15 by the Documentation Generator.*  
*To update this documentation, run the generator or modify source files and commit changes.*