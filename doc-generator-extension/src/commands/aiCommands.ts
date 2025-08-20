import * as vscode from 'vscode';
import { aiService } from '../services/aiService';
import { CodeAnalyzer } from '../analyzers/codeAnalyzer';
import { AIEnhancedReadmeGenerator } from '../generators/aiEnhancedReadmeGenerator';

import { FirstTimeSetup } from '../utils/firstTimeSetup';
import { DocumentationGenerator } from '../services/documentationGenerator';
import { DeepSeekClient } from '../services/deepSeekClient';
import { SettingsManager } from '../utils/settingsManager';

export class AICommands {
    private codeAnalyzer: CodeAnalyzer;
    private readmeGenerator: AIEnhancedReadmeGenerator;
    private context: vscode.ExtensionContext;
    private statusChangeEmitter = new vscode.EventEmitter<string>();
    public readonly onStatusChange = this.statusChangeEmitter.event;
    private documentationGenerator: DocumentationGenerator;
    private deepSeekClient: DeepSeekClient;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.codeAnalyzer = new CodeAnalyzer();
        this.readmeGenerator = new AIEnhancedReadmeGenerator();
        this.documentationGenerator = new DocumentationGenerator();
        this.deepSeekClient = new DeepSeekClient();
    }

        /**
     * Function 2: Generate Project Documentation using DeepSeek R1T2 Chimera
     * Creates both README.md (user-friendly) and PROJECT_OVERVIEW.md (technical)
     */
    public async generateProjectDocumentation(): Promise<void> {
        try {
            this.statusChangeEmitter.fire('Generating...');
            
            // Use the new DocumentationGenerator with DeepSeek integration
            await this.documentationGenerator.generateAllDocumentation();

            this.statusChangeEmitter.fire('Ready');
            
            const choice = await vscode.window.showInformationMessage(
                '🎉 Documentation generated successfully with DeepSeek R1T2 Chimera!\n\n📄 Created: README.md (user-friendly) + PROJECT_OVERVIEW.md (technical)',
                'View README',
                'View Technical Overview',
                'Test AI Connection'
            );

            switch (choice) {
                case 'View README':
                    await this.openDocument('README.md');
                    break;
                case 'View Technical Overview':
                    await this.openDocument('PROJECT_OVERVIEW.md');
                    break;
                case 'Test AI Connection':
                    await this.testAIConnection();
                    break;
            }

        } catch (error) {
            this.statusChangeEmitter.fire('Error');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            if (errorMessage.includes('API token not configured')) {
                const choice = await vscode.window.showErrorMessage(
                    'DeepSeek API token not configured. Would you like to configure it now?',
                    'Configure API Token',
                    'Learn More'
                );
                
                if (choice === 'Configure API Token') {
                    await this.configureAI();
                } else if (choice === 'Learn More') {
                    vscode.env.openExternal(vscode.Uri.parse('https://openrouter.ai/keys'));
                }
            } else {
                vscode.window.showErrorMessage(`Failed to generate documentation: ${errorMessage}`);
            }
        }
    }

        /**
     * Function 3: Manual Update Documentation using DeepSeek R1T2 Chimera
     * Updates both README.md and PROJECT_OVERVIEW.md based on current codebase state
     */
    public async updateDocumentation(): Promise<void> {
        try {
            this.statusChangeEmitter.fire('Updating...');
            
            // Use the new DocumentationGenerator with DeepSeek integration
            await this.documentationGenerator.generateAllDocumentation();

            this.statusChangeEmitter.fire('Ready');
            
            vscode.window.showInformationMessage(
                '✅ Documentation updated successfully with DeepSeek R1T2 Chimera!',
                'View README',
                'View Technical Overview'
            ).then((selection) => {
                if (selection === 'View README') {
                    this.openDocument('README.md');
                } else if (selection === 'View Technical Overview') {
                    this.openDocument('PROJECT_OVERVIEW.md');
                }
            });

        } catch (error) {
            this.statusChangeEmitter.fire('Error');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            if (errorMessage.includes('API token not configured')) {
                const choice = await vscode.window.showErrorMessage(
                    'DeepSeek API token not configured. Would you like to configure it now?',
                    'Configure API Token'
                );
                
                if (choice === 'Configure API Token') {
                    await this.configureAI();
                }
            } else {
                vscode.window.showErrorMessage(`Failed to update documentation: ${errorMessage}`);
            }
        }
    }

    /**
     * Handle file changes for auto-update functionality
     */
    public async handleFileChange(filePath: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('docGenerator');
        if (!config.get('autoUpdate') || !config.get('enabled')) {
            return;
        }

        // Debounced update - only update if AI is configured
        if (SettingsManager.isApiTokenConfigured()) {
            console.log(`File changed: ${filePath} - scheduling documentation update`);
            this.statusChangeEmitter.fire('Auto-updating...');
            
            // Simple auto-update without progress dialog
            setTimeout(async () => {
                try {
                    await this.updateDocumentation();
                } catch (error) {
                    console.error('Auto-update failed:', error);
                    this.statusChangeEmitter.fire('Ready');
                }
            }, 1000);
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
                    await this.testAIConnection();
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
     * Function 1: Check if DeepSeek API token is configured (persistent storage)
     */
    private async checkAIConfiguration(): Promise<boolean> {
        const isConfigured = SettingsManager.isApiTokenConfigured();
        if (!isConfigured) {
            vscode.window.showWarningMessage(
                'DeepSeek R1T2 Chimera API token not configured. Please configure it to generate documentation.',
                'Configure API Token', 'Get Free API Key'
            ).then((selection) => {
                if (selection === 'Configure API Token') {
                    this.configureAI();
                } else if (selection === 'Get Free API Key') {
                    vscode.env.openExternal(vscode.Uri.parse('https://openrouter.ai/keys'));
                }
            });
            return false;
        }
        return true;
    }

    /**
     * Test DeepSeek API connection
     */
    private async testAIConnection(): Promise<void> {
        try {
            const isConnected = await this.deepSeekClient.testConnection();
            
            if (isConnected) {
                vscode.window.showInformationMessage(
                    '✅ DeepSeek R1T2 Chimera connection successful! Ready to generate documentation.'
                );
            } else {
                vscode.window.showErrorMessage(
                    '❌ Failed to connect to DeepSeek R1T2 Chimera. Please check your API token.',
                    'Configure API Token'
                ).then((selection) => {
                    if (selection === 'Configure API Token') {
                        this.configureAI();
                    }
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(
                `❌ DeepSeek connection test failed: ${errorMessage}`,
                'Configure API Token'
            ).then((selection) => {
                if (selection === 'Configure API Token') {
                    this.configureAI();
                }
            });
        }
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
            <label for="apiToken">DeepSeek R1T2 Chimera API Token:</label>
            <input type="password" id="apiToken" placeholder="sk-..." />
            <small>🔐 <strong>Persistent Storage:</strong> Token survives IDE restarts<br/>
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
                <input type="checkbox" id="autoUpdateOnCommit" />
                <label for="autoUpdateOnCommit">Auto-update documentation after git commits</label>
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
            <button onclick="testConnection()">🔧 Test DeepSeek Connection</button>
            <button onclick="saveSettings()">💾 Save Settings (Persistent)</button>
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
            document.getElementById('apiToken').value = settings.apiToken || '';
            document.getElementById('defaultModel').value = settings.defaultModel || '';
            document.getElementById('autoUpdateOnCommit').checked = settings.autoUpdateOnCommit !== false;
            
            const maxTokens = settings.maxTokens || 8192;
            document.getElementById('maxTokens').value = maxTokens;
            document.getElementById('maxTokensValue').textContent = maxTokens;
            
            const temperature = settings.temperature || 0.1;
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
                apiToken: document.getElementById('apiToken').value,
                defaultModel: document.getElementById('defaultModel').value,
                autoUpdateOnCommit: document.getElementById('autoUpdateOnCommit').checked,
                maxTokens: parseInt(document.getElementById('maxTokens').value),
                temperature: parseFloat(document.getElementById('temperature').value)
            };
            
            vscode.postMessage({ command: 'saveSettings', settings });
        }

        function testConnection() {
            const settings = {
                apiToken: document.getElementById('apiToken').value,
                defaultModel: document.getElementById('defaultModel').value
            };
            
            vscode.postMessage({ command: 'testConnection', settings });
            
            document.getElementById('testResult').innerHTML = '<div style="color: orange;">Testing DeepSeek R1T2 Chimera connection...</div>';
        }



        function resetSettings() {
            if (confirm('Reset all DeepSeek settings to defaults?')) {
                document.getElementById('aiEnabled').checked = true;
                document.getElementById('apiToken').value = '';
                document.getElementById('defaultModel').value = 'tngtech/deepseek-r1t2-chimera:free';
                document.getElementById('autoUpdateOnCommit').checked = true;
                document.getElementById('maxTokens').value = 8192;
                document.getElementById('maxTokensValue').textContent = '8192';
                document.getElementById('temperature').value = 0.1;
                document.getElementById('temperatureValue').textContent = '0.1';
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
        const aiConfig = SettingsManager.getAIConfig();
        return {
            enabled: true,
            apiToken: SettingsManager.getApiToken() || '',
            defaultModel: aiConfig.model,
            maxTokens: aiConfig.maxTokens,
            temperature: aiConfig.temperature,
            autoUpdateOnCommit: SettingsManager.getAutoUpdateOnCommit()
        };
    }

    private async saveAISettings(settings: any): Promise<void> {
        try {
            // Save API token with persistent storage that survives IDE restarts
            if (settings.apiToken && settings.apiToken.trim()) {
                await SettingsManager.saveApiToken(settings.apiToken.trim());
            }
            
            // Save other AI configuration settings
            const config = vscode.workspace.getConfiguration('docGenerator');
            await Promise.all([
                config.update('ai.defaultModel', settings.defaultModel, vscode.ConfigurationTarget.Global),
                config.update('ai.maxTokens', settings.maxTokens, vscode.ConfigurationTarget.Global),
                config.update('ai.temperature', settings.temperature, vscode.ConfigurationTarget.Global),
                config.update('autoUpdateOnCommit', settings.autoUpdateOnCommit, vscode.ConfigurationTarget.Global)
            ]);

            console.log('✅ DeepSeek API settings saved with persistent storage');
        } catch (error) {
            throw new Error(`Failed to save API settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

