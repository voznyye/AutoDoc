

# AI Documentation Generator for VS Code 🤖

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Auto-Generated](https://img.shields.io/badge/docs-auto--generated-brightgreen.svg)
![Last Updated](https://img.shields.io/badge/updated-2023-10-15-blue.svg)

Automatically generate comprehensive documentation for your projects using AI-powered analysis. This VS Code extension creates both user-friendly READMEs and technical overviews with DeepSeek R1T2 Chimera's advanced AI capabilities.

## Features ✨

- **AI-Powered Documentation**: Generates README.md (user-focused) and PROJECT_OVERVIEW.md (technical) 
- **Smart Code Analysis**: Understands your entire codebase structure and dependencies
- **Git Integration**: Auto-updates documentation after commits (configurable)
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, C#, and more
- **Customizable Templates**: Control documentation depth and focus areas
- **Secure Configuration**: API token management with persistent storage
- **Real-Time Progress**: Visual feedback during documentation generation

## Installation 📦

1. Install from VS Code Marketplace:
   - Open Extensions view (`Ctrl+Shift+X`)
   - Search for "AI Documentation Generator"
   - Click Install

2. Configure your DeepSeek API token:
   ```bash
   # Get free API key from:
   https://openrouter.ai/keys
   ```
   - Press `Ctrl+Shift+P` and run "AI Doc Generator: Configure"
   - Enter your API key when prompted (starts with `sk-`)

## Usage 🚀

### Basic Commands:
| Command                          | Description                                  | Shortcut     |
|----------------------------------|----------------------------------------------|--------------|
| Generate Documentation           | Creates README.md + PROJECT_OVERVIEW.md     | `Ctrl+Alt+D` |
| Update After Commit              | Manual trigger for post-commit update       | -            |
| Toggle Auto-Update               | Enable/disable automatic Git integration    | -            |

### Workflow:
1. Open your project in VS Code
2. Use command palette (`Ctrl+Shift+P`) and select:
   > "AI Doc Generator: Generate Project Documentation"
3. Watch real-time progress in notifications
4. Access generated files:
   - `README.md` - End-user documentation
   - `PROJECT_OVERVIEW.md` - Technical specifications

![Demo Animation](https://example.com/path/to/demo.gif)

## Configuration ⚙️

Customize via VS Code settings (`Ctrl+,`):
```json
"ai-doc-generator": {
  "autoUpdateOnCommit": true,
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "*.test.*"
  ],
  "ai": {
    "maxTokens": 8192,
    "temperature": 0.1
  }
}
```

## Contributing 🤝

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow our [contribution guidelines](CONTRIBUTING.md) and code style.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This README was automatically generated with AI assistance on 2023-10-15*  
*To update this documentation, run the generator or make code changes and commit.*