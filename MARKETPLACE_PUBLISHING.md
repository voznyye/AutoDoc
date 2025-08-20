# 🏪 Publishing to VSCode Marketplace & Cursor Store

## 📋 Prerequisites Checklist

Before publishing, ensure you have:
- ✅ Azure DevOps account (for VSCode Marketplace)
- ✅ GitHub repository with your extension code
- ✅ Extension tested and working properly
- ✅ All required files (README, CHANGELOG, LICENSE)
- ✅ Proper package.json configuration

## 🚀 Step-by-Step Publishing Process

### Step 1: Create Azure DevOps Account

1. **Go to Azure DevOps**: https://dev.azure.com
2. **Sign in** with your Microsoft account (or create one)
3. **Create an organization** (can use your GitHub username)

### Step 2: Generate Personal Access Token

1. In Azure DevOps, click your **profile picture** → **Personal Access Tokens**
2. Click **"+ New Token"**
3. Configure the token:
   - **Name**: `VSCode Extensions Publishing`
   - **Organization**: Select your organization
   - **Expiration**: 1 year (or custom)
   - **Scopes**: Select **"Marketplace (manage)"**
4. Click **"Create"**
5. **⚠️ IMPORTANT**: Copy and save the token immediately (you won't see it again!)

### Step 3: Create Publisher Profile

```bash
# Install vsce (VSCode Extension Manager)
npm install -g @vscode/vsce

# Create a publisher (one-time setup)
vsce create-publisher voznyye

# Follow the prompts:
# - Display Name: "Yehor Voznyy" (or your preferred name)
# - Email: your email address
# - Personal Access Token: paste the token from Step 2
```

### Step 4: Login to Publisher Account

```bash
# Login to your publisher account
vsce login voznyye

# Enter your Personal Access Token when prompted
```

### Step 5: Prepare Extension for Publishing

```bash
# Navigate to extension directory
cd /Users/yehorvo/Programming/AutoDoc/doc-generator-extension

# Ensure everything is compiled
npm run compile

# Run final checks
vsce ls
```

### Step 6: Publish to Marketplace

```bash
# Publish the extension
vsce publish

# Or publish with automatic version increment
vsce publish patch  # 1.0.0 → 1.0.1
vsce publish minor  # 1.0.0 → 1.1.0
vsce publish major  # 1.0.0 → 2.0.0
```

## 🎯 For Cursor Store

Cursor uses the same VSCode Marketplace, so publishing to VSCode Marketplace automatically makes your extension available in Cursor!

### Cursor-Specific Considerations:

1. **Test in Cursor**: Make sure your extension works in Cursor IDE
2. **Cursor API Compatibility**: Cursor is based on VSCode, so VSCode extensions work
3. **No separate publishing needed**: Same marketplace serves both editors

## 📊 After Publishing

### Monitor Your Extension

1. **Check Marketplace**: https://marketplace.visualstudio.com/publishers/voznyye
2. **View Statistics**: 
   ```bash
   vsce show voznyye.auto-documentation-generator
   ```

### Update Your Extension

```bash
# Make changes to your code
# Update version in package.json
# Then publish update
vsce publish
```

## 🛠️ Complete Publishing Script

Create this script to automate the publishing process:

```bash
#!/bin/bash
# publish-extension.sh

echo "🚀 Publishing Auto Documentation Generator..."

# Navigate to extension directory
cd /Users/yehorvo/Programming/AutoDoc/doc-generator-extension

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npm run compile

# Run linting
echo "🔍 Running linter..."
npm run lint

# Package extension
echo "📦 Creating package..."
vsce package

# Publish to marketplace
echo "🚀 Publishing to VSCode Marketplace..."
vsce publish

echo "✅ Extension published successfully!"
echo "🔗 View at: https://marketplace.visualstudio.com/publishers/voznyye"
```

Make it executable and run:
```bash
chmod +x publish-extension.sh
./publish-extension.sh
```

## 📱 Installation After Publishing

Once published, users can install your extension in multiple ways:

### In VSCode/Cursor:
1. Open Extensions panel (`Ctrl+Shift+X`)
2. Search for "Auto Documentation Generator"
3. Click "Install"

### Command Line:
```bash
code --install-extension voznyye.auto-documentation-generator
```

### For Cursor:
```bash
cursor --install-extension voznyye.auto-documentation-generator
```

## 🔄 Automatic Publishing with GitHub Actions

Create `.github/workflows/publish.yml` in your repository:

```yaml
name: Publish Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd doc-generator-extension
          npm ci
          
      - name: Compile
        run: |
          cd doc-generator-extension
          npm run compile
          
      - name: Install vsce
        run: npm install -g @vscode/vsce
        
      - name: Publish
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: |
          cd doc-generator-extension
          vsce publish --pat $VSCE_PAT
```

Add your Personal Access Token as a GitHub Secret named `VSCE_PAT`.

## 📈 Marketing Your Extension

### 1. Create a Great README
- Clear description and screenshots
- Installation instructions
- Usage examples
- Feature highlights

### 2. Add Screenshots/GIFs
Create `media/` folder with:
- `screenshot1.png` - Main interface
- `screenshot2.png` - Generated documentation
- `demo.gif` - Extension in action

### 3. Social Media
- Tweet about your extension
- Post on LinkedIn
- Share in developer communities
- Write a blog post

### 4. GitHub Repository
- Add comprehensive README
- Include examples and documentation
- Add GitHub topics/tags
- Create releases with changelogs

## 🎯 Expected Timeline

- **Initial Setup**: 30-60 minutes
- **Publishing Process**: 5-10 minutes
- **Marketplace Review**: Usually instant, but can take up to 24 hours
- **Availability**: Immediately after approval

## 📊 Success Metrics to Track

- **Downloads**: Number of installations
- **Ratings**: User satisfaction (aim for 4+ stars)
- **Reviews**: User feedback and suggestions
- **GitHub Stars**: Community interest
- **Issues**: Bug reports and feature requests

## 🎉 Next Steps After Publishing

1. **Announce** your extension on social media
2. **Monitor** user feedback and reviews
3. **Respond** to issues and feature requests
4. **Update** regularly with new features
5. **Engage** with the developer community

Your extension will be available at:
- **VSCode Marketplace**: `https://marketplace.visualstudio.com/items?itemName=voznyye.auto-documentation-generator`
- **Searchable in VSCode/Cursor**: Users can find it by searching "Auto Documentation Generator"

Once published, anyone can install it with a single click! 🚀
