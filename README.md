

# AI Documentation Generator 🤖

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Auto-Generated](https://img.shields.io/badge/docs-auto--generated-brightgreen.svg)
![Last Updated](https://img.shields.io/badge/updated-2023-10-15-blue.svg)

The AI Documentation Generator is a powerful VS Code extension that automatically creates comprehensive documentation for your projects using DeepSeek's advanced R1T2 Chimera AI model. Save hours of manual documentation work with AI-generated READMEs and technical overviews that stay in sync with your codebase.

## Features ✨

- **AI-Powered Documentation**: Generates both user-friendly READMEs and technical PROJECT_OVERVIEW.md files
- **Smart Code Analysis**: Understands your project structure, dependencies, and code patterns
- **Git Integration**: Auto-updates documentation on commit (configurable)
- **Multi-Language Support**: Works with TypeScript, JavaScript, Python, Java, C#, and more
- **Customizable Templates**: Control documentation depth and focus areas
- **One-Click Generation**: Create documentation with a single command
- **Secure Configuration**: API token management with persistent storage

## Installation 📦

1. Install from VS Code Marketplace:
   - Open Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
   - Search for "AI Documentation Generator"
   - Click Install

2. Configure your DeepSeek API token:
   - Press `Ctrl+Shift+P` or `Cmd+Shift+P` to open Command Palette
   - Run `AI Doc Generator: Configure`
   - Enter your [DeepSeek R1T2 Chimera API key](https://openrouter.ai/keys) (free account available)

## Usage 🚀

### Basic Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `AI Doc Generator: Generate` | Create full documentation suite | `Ctrl+Alt+D` |
| `AI Doc Generator: Configure` | Set/update API token | - |
| `AI Doc Generator: Toggle Auto-Update` | Enable/disable commit-based updates | - |

### Generating Documentation

1. Open your project in VS Code
2. Run the `AI Doc Generator: Generate` command
3. Watch as the extension:
   - Analyzes your entire codebase
   - Generates README.md (end-user focused)
   - Creates PROJECT_OVERVIEW.md (technical deep dive)
4. Review and commit the generated files

![Demo Animation](https://example.com/path/to/demo.gif) *Example documentation generation workflow*

### Auto-Update on Commit

Enable this feature to automatically keep documentation synchronized with your code:

```bash
1. Toggle: AI Doc Generator: Toggle Auto-Update
2. Make code changes and commit as normal
3. Documentation updates automatically staged for next commit
```

## Configuration ⚙️

Customize the extension through VS Code settings (`settings.json`):

```json
{
  "ai-doc-generator.apiToken": "sk-your-token-here",
  "ai-doc-generator.autoUpdateOnCommit": true,
  "ai-doc-generator.excludePatterns": [
    "node_modules/**",
    "dist/**",
    "*.test.*"
  ],
  "ai-doc-generator.ai.maxTokens": 8192,
  "ai-doc-generator.ai.temperature": 0.1
}
```

## Supported Languages 🌐

| Language | File Extensions | 
|----------|-----------------|
| TypeScript | `.ts`, `.tsx` |
| JavaScript | `.js`, `.jsx` |
| Python | `.py`, `.pyi` |
| Java | `.java` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| PHP | `.php` |
| Ruby | `.rb` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp` |

## Contributing 🤝

We welcome contributions! Here's how to help:

1. **Report Issues**  
   Found a bug? [Open an issue](https://github.com/your-repo/issues) with steps to reproduce

2. **Suggest Improvements**  
   Have feature ideas? Submit a feature request with use cases

3. **Code Contributions**  
   ```bash
   # Development setup
   git clone https://github.com/your-repo.git
   cd ai-doc-generator
   npm install
   npm run watch
   # Test in VS Code with F5
   ```

4. **Documentation Updates**  
   Improve our docs or translate them into new languages

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*This README was automatically generated with AI assistance. To update documentation, run the generator or make code changes and commit.*