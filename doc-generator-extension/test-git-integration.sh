#!/bin/bash

# Test script for Git Commit Documentation Update
# This script will help test if the git commit detection is working properly

echo "🧪 Testing Git Commit Documentation Update Integration"
echo "======================================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository. Please run this from your project root."
    exit 1
fi

echo "✅ Git repository detected"
echo ""

# Show current git status
echo "📊 Current Git Status:"
git status --short
echo ""

# Create a test file to commit
TEST_FILE="test-commit-$(date +%s).txt"
echo "This is a test file to trigger documentation update" > $TEST_FILE

echo "📝 Created test file: $TEST_FILE"
echo ""

# Stage the test file
git add $TEST_FILE
echo "✅ Staged test file"
echo ""

echo "🔄 Committing test file..."
echo "Watch the VS Code/Cursor output panel for:"
echo "  - 'Git HEAD log changed, checking for new commits...'"
echo "  - 'New commit detected: [hash]'"
echo "  - 'Updating documentation after commit...'"
echo ""

# Make the commit
git commit -m "test: trigger documentation update $(date +%s)"

echo ""
echo "✅ Commit completed!"
echo ""

echo "📋 Next steps:"
echo "1. Check VS Code/Cursor notifications for documentation update messages"
echo "2. Check if README.md and PROJECT_OVERVIEW.md were updated"
echo "3. Run 'git status' to see if documentation files are staged"
echo "4. You can also manually trigger update with Command Palette: 'AI Doc Generator: Update Documentation After Last Commit'"
echo ""

echo "🧹 Cleaning up test file..."
git rm $TEST_FILE
git commit -m "cleanup: remove test file"

echo ""
echo "✅ Test complete!"
