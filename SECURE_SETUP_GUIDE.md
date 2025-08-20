# 🔐 Secure Setup Guide - Auto Documentation Generator

## Overview

This guide covers how to securely configure the Auto Documentation Generator with your API keys and sensitive information using environment variables and `.env` files. **Never commit API keys to version control!**

## 🛡️ Security Best Practices

### 1. **Use Environment Variables**
Store sensitive information in environment variables or `.env` files, never in:
- VSCode settings files
- Source code
- Configuration files committed to Git
- Shared documentation

### 2. **Priority Order**
The extension checks for API keys in this order (highest to lowest priority):
1. **System Environment Variables** (most secure)
2. **`.env` file in workspace root** (recommended for development)
3. **VSCode settings** (not recommended, shows security warning)

### 3. **Ignore Sensitive Files**
Always add these patterns to your `.gitignore`:
```gitignore
# Environment variables
.env
.env.local
.env.development
.env.test
.env.production

# API keys and secrets
*.key
*.pem
secrets.json
```

## 🚀 Quick Setup

### Step 1: Get Your Free API Key

1. Visit [OpenRouter.ai](https://openrouter.ai)
2. Sign up with Google/GitHub (free)
3. Go to [API Keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Copy your key (starts with `sk-or-...`)

### Step 2: Choose Your Setup Method

#### Option A: System Environment Variables (Most Secure)

**macOS/Linux:**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export OPENROUTER_API_KEY="sk-or-your-key-here"

# Reload your shell or restart VSCode/Cursor
source ~/.zshrc  # or ~/.bashrc
```

**Windows:**
```cmd
# Command Prompt (temporary)
set OPENROUTER_API_KEY=sk-or-your-key-here

# PowerShell (temporary)
$env:OPENROUTER_API_KEY="sk-or-your-key-here"

# Permanent (System Properties > Environment Variables)
# Add OPENROUTER_API_KEY with your key value
```

#### Option B: Project .env File (Recommended for Development)

1. **Create .env template:**
   - Run command: `Doc Generator: Configure AI Settings`
   - Click "Setup .env" button
   - Or manually copy `.env.example` to `.env`

2. **Edit .env file:**
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env file
OPENROUTER_API_KEY=sk-or-your-actual-key-here
```

3. **Verify .env is ignored:**
```bash
# Check .gitignore contains:
echo ".env" >> .gitignore

# Verify it's ignored:
git status  # .env should not appear
```

### Step 3: Enable AI Features

1. Open VSCode/Cursor settings (`Ctrl+,` or `Cmd+,`)
2. Search for "docGenerator.ai"
3. Enable: `docGenerator.ai.enabled: true`

### Step 4: Test Your Setup

1. Run command: `Doc Generator: Test AI Connection`
2. Should see: ✅ Connection successful!

## 🔧 Configuration Options

### Environment Variables Supported

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features | Yes |
| `OPENAI_API_KEY` | OpenAI API key (future feature) | No |
| `CLAUDE_API_KEY` | Anthropic Claude API key (future feature) | No |
| `GEMINI_API_KEY` | Google Gemini API key (future feature) | No |
| `GITHUB_TOKEN` | GitHub token for enhanced Git integration | No |

### VSCode Settings (Fallback Only)

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

**⚠️ Security Warning:** Only use VSCode settings for non-sensitive configuration. API keys in settings will trigger a security warning.

## 🛠️ Advanced Setup

### Multiple Projects

For multiple projects with different API keys:

1. **Create project-specific .env files:**
```bash
# Project A
cd /path/to/project-a
echo "OPENROUTER_API_KEY=project-a-key" > .env

# Project B  
cd /path/to/project-b
echo "OPENROUTER_API_KEY=project-b-key" > .env
```

2. **Use different models per project:**
```json
// Project A: .vscode/settings.json
{
  "docGenerator.ai.defaultModel": "qwen/qwen-2-7b-instruct:free"
}

// Project B: .vscode/settings.json
{
  "docGenerator.ai.defaultModel": "meta-llama/llama-3.2-3b-instruct:free"
}
```

### Team Setup

For team environments:

1. **Share .env.example template:**
```bash
# Add to your repository
git add .env.example
git commit -m "Add secure API key template"
```

2. **Document setup in README:**
```markdown
## Setup
1. Copy `.env.example` to `.env`
2. Add your OpenRouter API key to `.env`
3. Never commit `.env` files!
```

3. **Verify .gitignore protection:**
```bash
# Ensure .env is ignored
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Protect environment variables"
```

### CI/CD Setup

For automated environments:

```yaml
# GitHub Actions example
env:
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

# GitLab CI example
variables:
  OPENROUTER_API_KEY: $OPENROUTER_API_KEY
```

## 🔍 Troubleshooting

### Common Issues

**"AI service is not configured"**
- Check API key is set correctly
- Verify `.env` file is in workspace root
- Ensure environment variable is exported
- Restart VSCode/Cursor after setting environment variables

**"API key not found"**
- Verify `.env` file location (workspace root)
- Check `.env` file syntax (no spaces around `=`)
- Ensure API key starts with `sk-or-`
- Try system environment variable instead

**".env file not found"**
```bash
# Check current directory
pwd

# List files (including hidden)
ls -la

# Create .env from template
cp .env.example .env
```

**"Permission denied"**
```bash
# Fix file permissions
chmod 600 .env  # Read/write for owner only

# Check ownership
ls -la .env
```

### Validation Commands

```bash
# Check if .env exists and is readable
test -r .env && echo "✅ .env readable" || echo "❌ .env missing/unreadable"

# Check if API key is set (without showing value)
test -n "$OPENROUTER_API_KEY" && echo "✅ API key set" || echo "❌ API key not set"

# Verify .env is ignored by Git
git check-ignore .env && echo "✅ .env ignored" || echo "❌ .env NOT ignored!"
```

### Debug Mode

1. Open VSCode Developer Console (`Help > Toggle Developer Tools`)
2. Look for extension logs starting with `Documentation Generator`
3. Check for environment loading messages

## 📊 Security Checklist

- [ ] ✅ API keys stored in environment variables or `.env` files
- [ ] ✅ `.env` files added to `.gitignore`
- [ ] ✅ No API keys in VSCode settings
- [ ] ✅ No API keys in source code
- [ ] ✅ Team has `.env.example` template
- [ ] ✅ CI/CD uses secret management
- [ ] ✅ File permissions set correctly (`chmod 600 .env`)
- [ ] ✅ API keys rotated periodically
- [ ] ✅ Old API keys revoked when no longer needed

## 🚨 What NOT to Do

❌ **Never commit .env files:**
```bash
# BAD - Don't do this!
git add .env
git commit -m "Add API keys"  # This exposes your keys!
```

❌ **Never share API keys in:**
- Slack messages
- Email
- GitHub issues
- Stack Overflow questions
- Documentation
- Code comments

❌ **Never hardcode API keys:**
```javascript
// BAD - Don't do this!
const apiKey = "sk-or-actual-key-here";
```

❌ **Never use production keys in development:**
- Use separate API keys for development and production
- Rotate keys regularly
- Monitor API key usage

## 🔗 Related Resources

- [OpenRouter.ai Documentation](https://openrouter.ai/docs)
- [Environment Variables Best Practices](https://12factor.net/config)
- [VSCode Settings Security](https://code.visualstudio.com/docs/getstarted/settings)
- [Git Security Best Practices](https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage)

## 🆘 Need Help?

If you're having trouble with secure setup:

1. Run `Doc Generator: Test AI Connection` for diagnostics
2. Check the [AI Features Guide](AI_FEATURES_GUIDE.md) for complete setup
3. Create an issue on [GitHub](https://github.com/voznyye/AutoDoc/issues)
4. Include error messages (but never include your actual API keys!)

---

*Remember: Keeping your API keys secure protects both your account and your projects. When in doubt, use environment variables!* 🔐
