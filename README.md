# 🤖 AI Documentation Generator

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![VS Code](https://img.shields.io/badge/VS%20Code-Extension-green.svg)
![AI Powered](https://img.shields.io/badge/AI-DeepSeek%20R1T2%20Chimera-purple.svg)
![Free](https://img.shields.io/badge/AI%20Model-Free-brightgreen.svg)

**Automatically generate and maintain comprehensive project documentation using advanced AI models.**

The AI Documentation Generator is a powerful VS Code/Cursor extension that leverages DeepSeek R1T2 Chimera (671B parameters) to create professional-grade documentation for any codebase. Transform your projects with intelligent, comprehensive documentation that stays synchronized with your code changes.

## ✨ Key Features

### 🧠 **AI-Powered Intelligence**
- **DeepSeek R1T2 Chimera**: 671B-parameter mixture-of-experts model with superior reasoning
- **163k Context Window**: Analyze entire codebases in a single pass
- **Professional Quality**: Enterprise-grade documentation generation
- **Free Access**: No cost barriers via OpenRouter integration

### 📚 **Comprehensive Documentation**
- **Complete Project Analysis**: Every function, class, and module documented
- **Architecture Diagrams**: System design and component relationships
- **API Reference**: Full technical specifications with examples
- **User Guides**: Installation, setup, and usage instructions
- **Real-time Updates**: Automatic synchronization with code changes

### ⚡ **Seamless Integration**
- **Git Hooks**: Auto-update on commits and file changes
- **Multi-language Support**: TypeScript, JavaScript, Python, Java, C#, Go, Rust, and more
- **VS Code Native**: Deep integration with VS Code/Cursor ecosystem
- **Zero Configuration**: Works out-of-the-box with minimal setup

## 🚀 Quick Start

### Installation

1. **From VS Code Marketplace**:
   - Search for "AI Documentation Generator" by voznyye
   - Click Install

2. **Command Line**:
   ```bash
   code --install-extension voznyye.auto-documentation-generator
   ```

3. **Direct Download**:
   - Visit: https://marketplace.visualstudio.com/items?itemName=voznyye.auto-documentation-generator

### Setup (2-minute process)

1. **Get Free API Key**:
   - Visit https://openrouter.ai/keys
   - Create free account and generate API key

2. **Configure Extension**:
   - Open Command Palette (`Ctrl/Cmd + Shift + P`)
   - Run: `AI Doc Generator: Configure AI Settings`
   - Enter your OpenRouter API key

3. **Generate Documentation**:
   - Run: `AI Doc Generator: Generate Project Documentation`
   - Watch as comprehensive docs are created automatically!

## 💡 Usage Examples

### For New Projects
```bash
# 1. Open your project in VS Code
code my-awesome-project/

# 2. Generate complete documentation
# Command Palette → "Generate Project Documentation"
```

**Result**: Professional README.md + PROJECT_OVERVIEW.md with:
- Complete feature documentation
- API references with examples
- Installation and setup guides
- Architecture explanations

### For Existing Projects
```bash
# Update documentation after code changes
# Command Palette → "Update Documentation"
```

**Result**: Intelligent updates that:
- Analyze recent changes
- Update affected sections
- Maintain documentation consistency
- Preserve custom content

### Automatic Updates
Enable Git integration for hands-free documentation:
- Documentation updates automatically on commits
- Real-time synchronization with code changes
- Consistent quality across team contributions

## 🏗️ How It Works

### 1. **Intelligent Code Analysis**
```mermaid
graph LR
    A[Your Codebase] --> B[AI Analysis Engine]
    B --> C[DeepSeek R1T2 Chimera]
    C --> D[Professional Documentation]
```

- Scans entire project structure
- Identifies functions, classes, modules
- Maps dependencies and relationships
- Analyzes code patterns and architecture

### 2. **AI-Powered Generation**
- **Context-Aware**: Understands your project's purpose and design
- **Comprehensive**: Documents every aspect from high-level overview to technical details
- **Professional**: Follows documentation best practices and standards
- **Consistent**: Maintains uniform style and formatting

### 3. **Continuous Maintenance**
- **Smart Updates**: Only updates sections affected by code changes
- **Version Control**: Integrates seamlessly with Git workflows
- **Team Friendly**: Maintains consistency across multiple contributors

## 🎯 Use Cases

### **For Individual Developers**
- **Open Source Projects**: Create professional READMEs that attract contributors
- **Portfolio Projects**: Showcase your code with comprehensive documentation
- **Learning Projects**: Document your learning journey and code decisions

### **For Development Teams**
- **API Documentation**: Maintain up-to-date technical specifications
- **Onboarding**: Help new team members understand codebase architecture
- **Knowledge Sharing**: Preserve institutional knowledge in documentation

### **For Project Managers**
- **Stakeholder Communication**: Explain technical projects in accessible language
- **Progress Tracking**: Document feature development and architectural decisions
- **Compliance**: Maintain documentation standards for enterprise requirements

## 🛠️ Advanced Features

### **Configuration Options**
```json
{
  "docGenerator.autoUpdate": true,           // Auto-update on file changes
  "docGenerator.ai.maxTokens": 8192,         // DeepSeek context size
  "docGenerator.ai.temperature": 0.1,        // Consistency level
  "docGenerator.excludePatterns": [          // Files to ignore
    "node_modules/**",
    "*.test.*"
  ]
}
```

### **File Structure Support**
- **Multi-root Workspaces**: Handle complex project structures
- **Monorepos**: Document individual packages and overall architecture
- **Legacy Codebases**: Understand and document existing code patterns

### **Output Formats**
- **README.md**: User-friendly project overview
- **PROJECT_OVERVIEW.md**: Technical architecture documentation
- **API.md**: Detailed API reference (coming soon)
- **Custom Templates**: Extensible documentation formats

## 🔧 Troubleshooting

### **Common Issues**

**API Key Not Working?**
```bash
# Verify your API key is valid
curl -H "Authorization: Bearer YOUR_KEY" https://openrouter.ai/api/v1/models
```

**Extension Not Activating?**
- Ensure you have a Git repository in your workspace
- Check VS Code Developer Tools (Help → Toggle Developer Tools)
- Restart VS Code after installation

**Documentation Quality Issues?**
- Ensure your code has meaningful function/class names
- Add comments for complex logic
- Check that file patterns aren't excluding important code

### **Performance Tips**
- **Large Projects**: Use exclude patterns to focus on main code
- **Faster Updates**: Enable auto-update for real-time documentation
- **Quality**: Lower temperature (0.1) for consistent output

## 🤝 Contributing

We welcome contributions to make AI Documentation Generator even better!

### **Development Setup**
```bash
# Clone the repository
git clone https://github.com/voznyye/AutoDoc
cd AutoDoc/doc-generator-extension

# Install dependencies
npm install

# Start development
npm run watch
```

### **How to Contribute**
1. **Report Issues**: Share bugs or feature requests on GitHub
2. **Submit PRs**: Improve code, fix bugs, add features
3. **Documentation**: Help improve guides and examples
4. **Testing**: Test with different project types and provide feedback

### **Areas for Contribution**
- Additional programming language support
- Documentation template improvements
- Performance optimizations
- UI/UX enhancements

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **DeepSeek**: For the incredible R1T2 Chimera model
- **OpenRouter**: For providing free AI model access
- **VS Code Team**: For the excellent extension APIs
- **Community**: For feedback and contributions

---

## 🔗 Links

- **Marketplace**: https://marketplace.visualstudio.com/items?itemName=voznyye.auto-documentation-generator
- **GitHub**: https://github.com/voznyye/AutoDoc
- **Issues**: https://github.com/voznyye/AutoDoc/issues
- **OpenRouter**: https://openrouter.ai

---

*Transform your documentation workflow today with AI-powered intelligence! 🚀*
