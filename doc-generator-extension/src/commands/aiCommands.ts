import * as vscode from 'vscode';
import { aiService, DocumentationRequest } from '../services/aiService';
import { CodeAnalyzer } from '../analyzers/codeAnalyzer';
import { AIEnhancedReadmeGenerator } from '../generators/aiEnhancedReadmeGenerator';
import { environmentManager } from '../utils/environmentManager';
import { FirstTimeSetup } from '../utils/firstTimeSetup';

export class AICommands {
    private codeAnalyzer: CodeAnalyzer;
    private readmeGenerator: AIEnhancedReadmeGenerator;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.codeAnalyzer = new CodeAnalyzer();
        this.readmeGenerator = new AIEnhancedReadmeGenerator();
    }

    /**
     * Generate documentation with AI assistance
     */
    public async generateWithAI(): Promise<void> {
        // Ensure setup is complete before proceeding
        if (!(await FirstTimeSetup.ensureSetup(this.context))) {
            return;
        }

        if (!(await this.checkAIConfiguration())) {
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating AI-enhanced documentation...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Analyzing project structure..." });

                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    throw new Error('No workspace folder found');
                }

                const rootPath = workspaceFolders[0].uri.fsPath;
                
                progress.report({ increment: 20, message: "Analyzing code..." });
                const analysisResult = await this.codeAnalyzer.analyzeProject(rootPath, [], []);

                progress.report({ increment: 50, message: "Generating documentation with AI..." });
                const readme = await this.readmeGenerator.generate(analysisResult);

                progress.report({ increment: 80, message: "Saving documentation..." });
                await this.saveDocumentation(readme, 'README.md');

                progress.report({ increment: 100, message: "Done!" });
            });

            vscode.window.showInformationMessage(
                'AI-enhanced documentation generated successfully! 🤖✨',
                'View README'
            ).then((selection) => {
                if (selection === 'View README') {
                    this.openDocument('README.md');
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to generate AI documentation: ${errorMessage}`);
        }
    }

    /**
     * Configure AI settings through UI
     */
    public async configureAI(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'aiConfiguration',
            'AI Documentation Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getConfigurationWebviewContent();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'saveSettings':
                    await this.saveAISettings(message.settings);
                    vscode.window.showInformationMessage('AI settings saved successfully!');
                    panel.dispose();
                    break;
                case 'testConnection':
                    await this.testAIConnection(message.settings);
                    break;
                case 'getModels':
                    const models = aiService.getAvailableModels();
                    panel.webview.postMessage({ command: 'modelsData', models });
                    break;
                case 'getCurrentSettings':
                    const currentSettings = this.getCurrentAISettings();
                    panel.webview.postMessage({ command: 'currentSettings', settings: currentSettings });
                    break;

            }
        });
    }

    /**
     * Test AI connection and show results
     */
    public async testAI(): Promise<void> {
        // Ensure setup is complete before proceeding
        if (!(await FirstTimeSetup.ensureSetup(this.context))) {
            return;
        }

        if (!(await this.checkAIConfiguration())) {
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Testing AI connection...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Connecting to AI service..." });

                const config = vscode.workspace.getConfiguration('docGenerator.ai');
                const selectedModel = config.get<string>('defaultModel') || 'qwen/qwen-2-7b-instruct:free';

                progress.report({ increment: 50, message: `Testing model: ${selectedModel}` });
                
                const isConnected = await aiService.testConnection(selectedModel);
                
                progress.report({ increment: 100, message: "Test complete!" });

                if (isConnected) {
                    const modelInfo = await aiService.getModelInfo(selectedModel);
                    vscode.window.showInformationMessage(
                        `✅ AI connection successful!\n\nModel: ${modelInfo?.name || selectedModel}\nDescription: ${modelInfo?.description || 'No description'}`,
                        'Show Models'
                    ).then((selection) => {
                        if (selection === 'Show Models') {
                            this.showAvailableModels();
                        }
                    });
                } else {
                    vscode.window.showErrorMessage(
                        '❌ AI connection failed. Please check your API key and try again.',
                        'Configure AI'
                    ).then((selection) => {
                        if (selection === 'Configure AI') {
                            this.configureAI();
                        }
                    });
                }
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`AI test failed: ${errorMessage}`);
        }
    }

    /**
     * Generate smart comments for selected code
     */
    public async generateSmartComments(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        // Ensure setup is complete before proceeding
        if (!(await FirstTimeSetup.ensureSetup(this.context))) {
            return;
        }

        if (!(await this.checkAIConfiguration())) {
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText.trim()) {
            vscode.window.showWarningMessage('Please select code to generate comments for');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating smart comments...",
                cancellable: false
            }, async () => {
                const request: DocumentationRequest = {
                    type: 'comment',
                    context: `Generate appropriate comments for this code. Consider the programming language, complexity, and purpose.`,
                    codeSnippet: selectedText,
                    language: editor.document.languageId
                };

                const fastModel = await aiService.selectBestModel('speed');
                const response = await aiService.generateDocumentation(request, fastModel);

                // Insert the generated comments
                await editor.edit((editBuilder) => {
                    const startLine = selection.start.line;
                    const lineText = editor.document.lineAt(startLine).text;
                    const indentation = lineText.match(/^\s*/)?.[0] || '';
                    
                    // Format the comment with proper indentation
                    const formattedComment = this.formatComment(response.content, indentation, editor.document.languageId);
                    
                    editBuilder.insert(selection.start, formattedComment + '\n');
                });

                vscode.window.showInformationMessage('Smart comments generated! 🧠✨');
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to generate comments: ${errorMessage}`);
        }
    }

    /**
     * Generate smart description for a function or class
     */
    public async generateSmartDescription(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }

        // Ensure setup is complete before proceeding
        if (!(await FirstTimeSetup.ensureSetup(this.context))) {
            return;
        }

        if (!(await this.checkAIConfiguration())) {
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText.trim()) {
            vscode.window.showWarningMessage('Please select a function or class to describe');
            return;
        }

        try {
            const request: DocumentationRequest = {
                type: 'description',
                context: `Analyze this code and provide a clear, concise description of what it does, its purpose, and how it works.`,
                codeSnippet: selectedText,
                language: editor.document.languageId
            };

            const technicalModel = await aiService.selectBestModel('technical');
            const response = await aiService.generateDocumentation(request, technicalModel);

            // Show the description in a new document
            const doc = await vscode.workspace.openTextDocument({
                content: `# Code Description\n\n## Code:\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\`\n\n## AI Analysis:\n\n${response.content}`,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(doc);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to generate description: ${errorMessage}`);
        }
    }

    private async checkAIConfiguration(): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        const aiEnabled = config.get<boolean>('enabled', false);

        if (!aiEnabled) {
            vscode.window.showWarningMessage(
                'AI features are disabled. Enable them in settings to use AI-powered documentation.',
                'Enable AI'
            ).then((selection) => {
                if (selection === 'Enable AI') {
                    this.configureAI();
                }
            });
            return false;
        }

        const isConfigured = await aiService.isConfigured();
        if (!isConfigured) {
            vscode.window.showWarningMessage(
                'AI service is not configured. Please set your OpenRouter API key in system environment variables.',
                'Configure AI', 'Learn More'
            ).then((selection) => {
                if (selection === 'Configure AI') {
                    this.configureAI();
                } else if (selection === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com/voznyye/AutoDoc#secure-setup'));
                }
            });
            return false;
        }

        return true;
    }



    private async saveDocumentation(content: string, filename: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, filename);
        const fileContent = new TextEncoder().encode(content);
        
        await vscode.workspace.fs.writeFile(filePath, fileContent);
    }

    private async openDocument(filename: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, filename);
        
        try {
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            console.error('Failed to open document:', error);
        }
    }

    private async showAvailableModels(): Promise<void> {
        const models = aiService.getAvailableModels();
        
        const quickPickItems = models.map(model => ({
            label: model.name,
            description: model.id,
            detail: `${model.description} | Context: ${model.contextLength.toLocaleString()} tokens | Strengths: ${model.strengths.join(', ')}`
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Available AI Models (all free)',
            ignoreFocusOut: true
        });

        if (selected) {
            const setAsDefault = await vscode.window.showInformationMessage(
                `Selected: ${selected.label}\n\n${selected.detail}`,
                'Set as Default',
                'OK'
            );

            if (setAsDefault === 'Set as Default') {
                const config = vscode.workspace.getConfiguration('docGenerator.ai');
                await config.update('defaultModel', selected.description, vscode.ConfigurationTarget.Workspace);
                vscode.window.showInformationMessage(`✅ ${selected.label} is now your default AI model`);
            }
        }
    }

    private formatComment(comment: string, indentation: string, languageId: string): string {
        const lines = comment.split('\n');
        
        switch (languageId) {
            case 'typescript':
            case 'javascript':
                if (lines.length === 1) {
                    return `${indentation}// ${lines[0]}`;
                } else {
                    let formatted = `${indentation}/**\n`;
                    for (const line of lines) {
                        formatted += `${indentation} * ${line}\n`;
                    }
                    formatted += `${indentation} */`;
                    return formatted;
                }
            
            case 'python':
                if (lines.length === 1) {
                    return `${indentation}# ${lines[0]}`;
                } else {
                    let formatted = `${indentation}"""\n`;
                    for (const line of lines) {
                        formatted += `${indentation}${line}\n`;
                    }
                    formatted += `${indentation}"""`;
                    return formatted;
                }
            
            case 'java':
            case 'csharp':
                if (lines.length === 1) {
                    return `${indentation}// ${lines[0]}`;
                } else {
                    let formatted = `${indentation}/**\n`;
                    for (const line of lines) {
                        formatted += `${indentation} * ${line}\n`;
                    }
                    formatted += `${indentation} */`;
                    return formatted;
                }
            
            default:
                // Generic comment format
                if (lines.length === 1) {
                    return `${indentation}// ${lines[0]}`;
                } else {
                    return lines.map(line => `${indentation}// ${line}`).join('\n');
                }
        }
    }

    private getConfigurationWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Documentation Settings</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .setting-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select, textarea {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 3px;
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .test-result {
            margin-top: 10px;
            padding: 10px;
            border-radius: 3px;
        }
        .success {
            background: var(--vscode-editorInfo-background);
            color: var(--vscode-editorInfo-foreground);
        }
        .error {
            background: var(--vscode-editorError-background);
            color: var(--vscode-editorError-foreground);
        }
        .model-info {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 10px;
            margin: 10px 0;
            border-radius: 3px;
            font-size: 0.9em;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <h1>🤖 AI Documentation Settings</h1>
    
    <div class="setting-group">
        <div class="checkbox-group">
            <input type="checkbox" id="aiEnabled" />
            <label for="aiEnabled">Enable AI-powered documentation</label>
        </div>
    </div>

    <div class="setting-group">
        <label for="apiKey">OpenRouter API Key:</label>
        <input type="password" id="apiKey" placeholder="sk-or-..." />
        <small>🔐 <strong>Secure Storage:</strong> Keys are stored in system environment variables only<br/>
        Get your free API key from <a href="https://openrouter.ai/keys" target="_blank">openrouter.ai/keys</a></small>
    </div>

    <div class="setting-group">
        <label for="defaultModel">Default AI Model:</label>
        <select id="defaultModel">
            <option value="">Loading models...</option>
        </select>
        <div id="modelInfo" class="model-info" style="display: none;"></div>
    </div>

    <div class="setting-group">
        <div class="checkbox-group">
            <input type="checkbox" id="enhanceExisting" />
            <label for="enhanceExisting">Enhance existing documentation instead of replacing</label>
        </div>
    </div>

    <div class="setting-group">
        <div class="checkbox-group">
            <input type="checkbox" id="includeExamples" />
            <label for="includeExamples">Include code examples in generated documentation</label>
        </div>
    </div>

    <div class="setting-group">
        <label for="maxTokens">Max Tokens (100-8000):</label>
        <input type="range" id="maxTokens" min="100" max="8000" step="100" />
        <span id="maxTokensValue">4000</span>
    </div>

    <div class="setting-group">
        <label for="temperature">Creativity Level (0=deterministic, 2=very creative):</label>
        <input type="range" id="temperature" min="0" max="2" step="0.1" />
        <span id="temperatureValue">0.7</span>
    </div>

    <div>
        <button onclick="testConnection()">🔧 Test Connection</button>
        <button onclick="saveSettings()">💾 Save API Key to System</button>
        <button onclick="resetSettings()">🔄 Reset to Defaults</button>
    </div>

    <div id="testResult"></div>

    <script>
        const vscode = acquireVsCodeApi();
        let availableModels = [];

        // Load current settings and models
        vscode.postMessage({ command: 'getCurrentSettings' });
        vscode.postMessage({ command: 'getModels' });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'modelsData':
                    availableModels = message.models;
                    updateModelSelect();
                    break;
                case 'currentSettings':
                    loadSettings(message.settings);
                    break;
                case 'testResult':
                    showTestResult(message.success, message.message);
                    break;
            }
        });

        function updateModelSelect() {
            const select = document.getElementById('defaultModel');
            select.innerHTML = '';
            
            availableModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                select.appendChild(option);
            });
        }

        function loadSettings(settings) {
            document.getElementById('aiEnabled').checked = settings.enabled || false;
            document.getElementById('apiKey').value = settings.openRouterApiKey || '';
            document.getElementById('defaultModel').value = settings.defaultModel || '';
            document.getElementById('enhanceExisting').checked = settings.enhanceExisting !== false;
            document.getElementById('includeExamples').checked = settings.includeExamples !== false;
            
            const maxTokens = settings.maxTokens || 4000;
            document.getElementById('maxTokens').value = maxTokens;
            document.getElementById('maxTokensValue').textContent = maxTokens;
            
            const temperature = settings.temperature || 0.7;
            document.getElementById('temperature').value = temperature;
            document.getElementById('temperatureValue').textContent = temperature;
            
            updateModelInfo();
        }

        // Update model info display
        document.getElementById('defaultModel').addEventListener('change', updateModelInfo);
        
        function updateModelInfo() {
            const selectedModelId = document.getElementById('defaultModel').value;
            const modelInfo = availableModels.find(m => m.id === selectedModelId);
            const infoDiv = document.getElementById('modelInfo');
            
            if (modelInfo) {
                infoDiv.style.display = 'block';
                infoDiv.innerHTML = \`
                    <strong>\${modelInfo.name}</strong><br/>
                    <em>\${modelInfo.description}</em><br/>
                    Context Length: \${modelInfo.contextLength.toLocaleString()} tokens<br/>
                    Strengths: \${modelInfo.strengths.join(', ')}
                \`;
            } else {
                infoDiv.style.display = 'none';
            }
        }

        // Update range input displays
        document.getElementById('maxTokens').addEventListener('input', function() {
            document.getElementById('maxTokensValue').textContent = this.value;
        });

        document.getElementById('temperature').addEventListener('input', function() {
            document.getElementById('temperatureValue').textContent = this.value;
        });

        function saveSettings() {
            const settings = {
                enabled: document.getElementById('aiEnabled').checked,
                openRouterApiKey: document.getElementById('apiKey').value,
                defaultModel: document.getElementById('defaultModel').value,
                enhanceExisting: document.getElementById('enhanceExisting').checked,
                includeExamples: document.getElementById('includeExamples').checked,
                maxTokens: parseInt(document.getElementById('maxTokens').value),
                temperature: parseFloat(document.getElementById('temperature').value)
            };
            
            vscode.postMessage({ command: 'saveSettings', settings });
        }

        function testConnection() {
            const settings = {
                openRouterApiKey: document.getElementById('apiKey').value,
                defaultModel: document.getElementById('defaultModel').value
            };
            
            vscode.postMessage({ command: 'testConnection', settings });
            
            document.getElementById('testResult').innerHTML = '<div style="color: orange;">Testing connection...</div>';
        }



        function resetSettings() {
            if (confirm('Reset all AI settings to defaults?')) {
                document.getElementById('aiEnabled').checked = false;
                document.getElementById('apiKey').value = '';
                document.getElementById('defaultModel').value = 'qwen/qwen-2-7b-instruct:free';
                document.getElementById('enhanceExisting').checked = true;
                document.getElementById('includeExamples').checked = true;
                document.getElementById('maxTokens').value = 4000;
                document.getElementById('maxTokensValue').textContent = '4000';
                document.getElementById('temperature').value = 0.7;
                document.getElementById('temperatureValue').textContent = '0.7';
                updateModelInfo();
            }
        }

        function showTestResult(success, message) {
            const resultDiv = document.getElementById('testResult');
            resultDiv.innerHTML = \`<div class="\${success ? 'success' : 'error'}">\${message}</div>\`;
        }
    </script>
</body>
</html>`;
    }

    private getCurrentAISettings(): any {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        return {
            enabled: config.get('enabled'),
            openRouterApiKey: config.get('openRouterApiKey'),
            defaultModel: config.get('defaultModel'),
            enhanceExisting: config.get('enhanceExisting'),
            includeExamples: config.get('includeExamples'),
            maxTokens: config.get('maxTokens'),
            temperature: config.get('temperature')
        };
    }

    private async saveAISettings(settings: any): Promise<void> {
        const config = vscode.workspace.getConfiguration('docGenerator.ai');
        
        // Save API key to system environment variable if provided
        if (settings.openRouterApiKey && settings.openRouterApiKey.trim()) {
            await this.saveApiKeyToSystem(settings.openRouterApiKey.trim());
        }
        
        // Save non-sensitive settings to VSCode configuration
        await Promise.all([
            config.update('enabled', settings.enabled, vscode.ConfigurationTarget.Workspace),
            // Don't save API key to VSCode settings for security
            config.update('defaultModel', settings.defaultModel, vscode.ConfigurationTarget.Workspace),
            config.update('enhanceExisting', settings.enhanceExisting, vscode.ConfigurationTarget.Workspace),
            config.update('includeExamples', settings.includeExamples, vscode.ConfigurationTarget.Workspace),
            config.update('maxTokens', settings.maxTokens, vscode.ConfigurationTarget.Workspace),
            config.update('temperature', settings.temperature, vscode.ConfigurationTarget.Workspace)
        ]);

        // Reload environment manager configuration
        await environmentManager.reload();
    }

    private async saveApiKeyToSystem(apiKey: string): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Saving API key to system environment...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Setting system environment variable...' });
                
                await environmentManager.setSystemEnvironmentVariable('OPENROUTER_API_KEY', apiKey);
                
                progress.report({ increment: 100, message: 'Done!' });
            });

            const platform = process.platform;
            const restartMessage = platform === 'win32' 
                ? 'API key saved to system environment! Please restart VSCode/Cursor for changes to take effect.'
                : 'API key saved to system environment! Please restart VSCode/Cursor or reload your shell.';

            vscode.window.showInformationMessage(
                `✅ ${restartMessage}`,
                'Restart Now'
            ).then((selection) => {
                if (selection === 'Restart Now') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
            
        } catch (error) {
            throw new Error(`Failed to save API key to system environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async testAIConnection(settings: any): Promise<void> {
        // Temporarily use the provided settings for testing
        const originalApiKey = process.env.OPENROUTER_API_KEY;
        
        try {
            // Set temporary API key
            if (settings.openRouterApiKey) {
                process.env.OPENROUTER_API_KEY = settings.openRouterApiKey;
                await environmentManager.reload();
            }

            const isConnected = await aiService.testConnection(settings.defaultModel);
            
            const message = isConnected 
                ? '✅ Connection successful! AI features are ready to use.'
                : '❌ Connection failed. Please check your API key and try again.';
                
            // Here you would send the result back to the webview
            // This is a simplified version
            vscode.window.showInformationMessage(message);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            // Restore original API key
            if (originalApiKey) {
                process.env.OPENROUTER_API_KEY = originalApiKey;
            } else {
                delete process.env.OPENROUTER_API_KEY;
            }
            await environmentManager.reload();
        }
    }

    /**
     * Generate comprehensive project overview
     */
    public async generateProjectOverview(): Promise<void> {
        // Ensure setup is complete before proceeding
        if (!(await FirstTimeSetup.ensureSetup(this.context))) {
            return;
        }

        if (!(await this.checkAIConfiguration())) {
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating comprehensive project overview...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Analyzing entire project..." });

                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    throw new Error('No workspace folder found');
                }

                const rootPath = workspaceFolders[0].uri.fsPath;
                
                progress.report({ increment: 20, message: "Analyzing codebase structure..." });
                
                // Use improved exclude patterns
                const config = vscode.workspace.getConfiguration('docGenerator');
                const excludePatterns = config.get<string[]>('excludePatterns') || [];
                const supportedLanguages = config.get<string[]>('supportedLanguages') || ['typescript', 'javascript'];
                
                const analysisResult = await this.codeAnalyzer.analyzeProject(rootPath, supportedLanguages, excludePatterns);

                progress.report({ increment: 60, message: "Generating comprehensive overview with AI..." });
                
                const overview = await this.readmeGenerator.generateComprehensiveOverview(analysisResult);

                progress.report({ increment: 90, message: "Finalizing documentation..." });

                // Save overview to PROJECT_OVERVIEW.md
                await this.saveDocumentation(overview, 'PROJECT_OVERVIEW.md');
                
                progress.report({ increment: 100, message: "Complete!" });

                // Show the generated overview
                const doc = await vscode.workspace.openTextDocument({
                    content: overview,
                    language: 'markdown'
                });
                
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                
                vscode.window.showInformationMessage(
                    '🎉 Comprehensive project overview generated! \n📁 Saved as PROJECT_OVERVIEW.md',
                    'View File'
                ).then((selection) => {
                    if (selection === 'View File') {
                        vscode.commands.executeCommand('workbench.explorer.fileView.focus');
                    }
                });
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate project overview: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
