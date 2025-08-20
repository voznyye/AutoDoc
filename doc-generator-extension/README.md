# Auto Documentation Generator

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![VSCode](https://img.shields.io/badge/VSCode-1.80.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A powerful VSCode extension that automatically generates and maintains project documentation on every Git commit.

## Features

- 🚀 **Automatic Documentation Generation** - Generate comprehensive documentation from your codebase
- 🔄 **Git Integration** - Auto-update documentation on every commit
- 🌐 **Multi-Language Support** - TypeScript, JavaScript, Python, Java, C#, Go, Rust, PHP
- 📝 **Multiple Output Formats** - README.md, API docs, CHANGELOG.md
- ⚙️ **Highly Configurable** - Customize output, templates, and behavior
- 🎨 **Beautiful UI** - Intuitive interface with preview capabilities
- 📊 **Code Analytics** - Complexity analysis and metrics

## Installation

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Auto Documentation Generator"
4. Click Install

Or install from command line:
```bash
code --install-extension autodoc.doc-generator-extension
```

## Quick Start

1. Open a project in VSCode
2. Press `Ctrl+Shift+P` to open command palette
3. Run `Doc Generator: Generate Documentation`
4. Your documentation will be created in the `docs/` folder

## Commands

- `Doc Generator: Generate Documentation` - Generate complete documentation
- `Doc Generator: Update Documentation` - Update existing documentation
- `Doc Generator: Configure Settings` - Open configuration wizard
- `Doc Generator: Preview Changes` - Preview documentation before applying

## Configuration

The extension can be configured through VSCode settings:

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

## Supported Languages

- **TypeScript** - Full AST parsing with JSDoc support
- **JavaScript** - ES6+ syntax with JSDoc
- **Python** - Docstrings and type hints
- **Java** - JavaDoc comments
- **C#** - XML documentation comments
- **Go** - Go doc comments
- **Rust** - Rust doc comments
- **PHP** - PHPDoc comments

## Generated Documentation

The extension generates several types of documentation:

### README.md
- Project overview and description
- Installation instructions
- Usage examples
- API overview
- Project structure

### API Documentation
- Detailed API reference
- Function signatures and parameters
- Class hierarchies
- Interface definitions
- Type definitions

### CHANGELOG.md
- Version history
- Categorized changes (Added, Changed, Fixed, etc.)
- Automatic version detection

## Git Integration

The extension integrates seamlessly with Git:

- **Pre-commit hooks** - Update documentation before commits
- **Auto-staging** - Automatically stage documentation files
- **Change detection** - Only update relevant documentation sections

## Examples

### Automatic Function Documentation

Input TypeScript code:
```typescript
/**
 * Calculates the factorial of a number
 * @param n The number to calculate factorial for
 * @returns The factorial result
 */
export function factorial(n: number): number {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
```

Generated documentation:
```markdown
### factorial

Calculates the factorial of a number

**Signature:**
```typescript
function factorial(n: number): number
```

**Parameters:**
| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `n` | `number` | No | The number to calculate factorial for |

**Returns:** `number`
```

## Advanced Features

### Custom Templates
Create custom documentation templates using Handlebars:

```handlebars
# {{projectName}}

{{description}}

## Classes
{{#each classes}}
### {{name}}
{{description}}
{{/each}}
```

### Performance Optimization
- Incremental updates for large codebases
- Intelligent caching system
- Asynchronous processing
- Memory-efficient parsing

### Analytics and Metrics
- Code complexity analysis
- Documentation coverage
- Dependency tracking
- Project statistics

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/autodoc/doc-generator-extension/wiki)
- 🐛 [Issue Tracker](https://github.com/autodoc/doc-generator-extension/issues)
- 💬 [Discussions](https://github.com/autodoc/doc-generator-extension/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

*Made with ❤️ for developers who love good documentation*
