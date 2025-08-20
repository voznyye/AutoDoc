import * as vscode from 'vscode';
import { ConfigurationProvider } from '../providers/configurationProvider';

export async function configureDocsCommand(_configurationProvider: ConfigurationProvider): Promise<void> {
    try {
        const currentConfig = vscode.workspace.getConfiguration('docGenerator');
        
        // Create configuration wizard
        const configOptions = await showConfigurationWizard(currentConfig);
        
        if (configOptions) {
            await applyConfiguration(configOptions);
            vscode.window.showInformationMessage('Documentation generator configuration updated successfully!');
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to configure documentation generator: ${errorMessage}`);
        console.error('Configuration error:', error);
    }
}

interface ConfigurationOptions {
    enabled: boolean;
    autoUpdate: boolean;
    includePrivate: boolean;
    outputDirectory: string;
    supportedLanguages: string[];
    excludePatterns: string[];
    gitIntegration: {
        preCommitHook: boolean;
        autoStage: boolean;
        commitMessage: string;
    };
}

async function showConfigurationWizard(currentConfig: vscode.WorkspaceConfiguration): Promise<ConfigurationOptions | undefined> {
    // Step 1: Basic settings
    const enabled = await vscode.window.showQuickPick(
        [
            { label: 'Enable', description: 'Enable documentation generation', value: true },
            { label: 'Disable', description: 'Disable documentation generation', value: false }
        ],
        {
            placeHolder: 'Enable documentation generator?',
            title: 'Configuration Wizard - Step 1/6'
        }
    );
    
    if (!enabled) return undefined;
    
    // Step 2: Auto-update settings
    const autoUpdate = await vscode.window.showQuickPick(
        [
            { label: 'Yes', description: 'Automatically update documentation on file changes', value: true },
            { label: 'No', description: 'Only update documentation manually', value: false }
        ],
        {
            placeHolder: 'Auto-update documentation?',
            title: 'Configuration Wizard - Step 2/6'
        }
    );
    
    if (!autoUpdate) return undefined;
    
    // Step 3: Privacy settings
    const includePrivate = await vscode.window.showQuickPick(
        [
            { label: 'No', description: 'Only document public methods and classes', value: false },
            { label: 'Yes', description: 'Include private methods and classes in documentation', value: true }
        ],
        {
            placeHolder: 'Include private members in documentation?',
            title: 'Configuration Wizard - Step 3/6'
        }
    );
    
    if (!includePrivate) return undefined;
    
    // Step 4: Output directory
    const outputDirectory = await vscode.window.showInputBox({
        prompt: 'Enter output directory for documentation',
        value: currentConfig.get<string>('outputDirectory') || './docs',
        title: 'Configuration Wizard - Step 4/6'
    });
    
    if (!outputDirectory) return undefined;
    
    // Step 5: Supported languages
    const allLanguages = [
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C#', value: 'csharp' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rust' },
        { label: 'PHP', value: 'php' }
    ];
    
    const selectedLanguages = await vscode.window.showQuickPick(
        allLanguages,
        {
            placeHolder: 'Select programming languages to analyze',
            canPickMany: true,
            title: 'Configuration Wizard - Step 5/6'
        }
    );
    
    if (!selectedLanguages || selectedLanguages.length === 0) return undefined;
    
    // Step 6: Git integration
    const gitIntegration = await showGitIntegrationWizard(currentConfig);
    if (!gitIntegration) return undefined;
    
    return {
        enabled: enabled.value,
        autoUpdate: autoUpdate.value,
        includePrivate: includePrivate.value,
        outputDirectory,
        supportedLanguages: selectedLanguages.map(lang => lang.value),
        excludePatterns: currentConfig.get<string[]>('excludePatterns') || [
            'node_modules/**',
            'dist/**',
            '*.test.*'
        ],
        gitIntegration
    };
}

async function showGitIntegrationWizard(currentConfig: vscode.WorkspaceConfiguration) {
    const preCommitHook = await vscode.window.showQuickPick(
        [
            { label: 'Yes', description: 'Update documentation before each commit', value: true },
            { label: 'No', description: 'No automatic Git integration', value: false }
        ],
        {
            placeHolder: 'Enable pre-commit hook?',
            title: 'Git Integration - Step 6a/6'
        }
    );
    
    if (!preCommitHook) return undefined;
    
    let autoStage = false;
    let commitMessage = 'docs: update documentation';
    
    if (preCommitHook.value) {
        const autoStageOption = await vscode.window.showQuickPick(
            [
                { label: 'Yes', description: 'Automatically stage updated documentation files', value: true },
                { label: 'No', description: 'Manually stage documentation changes', value: false }
            ],
            {
                placeHolder: 'Auto-stage documentation files?',
                title: 'Git Integration - Step 6b/6'
            }
        );
        
        if (!autoStageOption) return undefined;
        autoStage = autoStageOption.value;
        
        const customCommitMessage = await vscode.window.showInputBox({
            prompt: 'Enter commit message for documentation updates',
            value: currentConfig.get<any>('gitIntegration')?.commitMessage || 'docs: update documentation',
            title: 'Git Integration - Step 6c/6'
        });
        
        if (!customCommitMessage) return undefined;
        commitMessage = customCommitMessage;
    }
    
    return {
        preCommitHook: preCommitHook.value,
        autoStage,
        commitMessage
    };
}

async function applyConfiguration(options: ConfigurationOptions): Promise<void> {
    const config = vscode.workspace.getConfiguration('docGenerator');
    
    await Promise.all([
        config.update('enabled', options.enabled, vscode.ConfigurationTarget.Workspace),
        config.update('autoUpdate', options.autoUpdate, vscode.ConfigurationTarget.Workspace),
        config.update('includePrivate', options.includePrivate, vscode.ConfigurationTarget.Workspace),
        config.update('outputDirectory', options.outputDirectory, vscode.ConfigurationTarget.Workspace),
        config.update('supportedLanguages', options.supportedLanguages, vscode.ConfigurationTarget.Workspace),
        config.update('excludePatterns', options.excludePatterns, vscode.ConfigurationTarget.Workspace),
        config.update('gitIntegration', options.gitIntegration, vscode.ConfigurationTarget.Workspace)
    ]);
}

export async function showAdvancedConfiguration(): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'docGeneratorConfig',
        'Documentation Generator Settings',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getConfigurationWebviewContent();
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'saveConfig':
                    await applyConfiguration(message.config);
                    vscode.window.showInformationMessage('Configuration saved successfully!');
                    break;
                case 'resetConfig':
                    await resetToDefaults();
                    vscode.window.showInformationMessage('Configuration reset to defaults!');
                    break;
            }
        }
    );
}

async function resetToDefaults(): Promise<void> {
    // const config = vscode.workspace.getConfiguration('docGenerator');
    const defaultConfig: ConfigurationOptions = {
        enabled: true,
        autoUpdate: true,
        includePrivate: false,
        outputDirectory: './docs',
        supportedLanguages: ['typescript', 'javascript', 'python'],
        excludePatterns: ['node_modules/**', 'dist/**', '*.test.*'],
        gitIntegration: {
            preCommitHook: true,
            autoStage: true,
            commitMessage: 'docs: update documentation'
        }
    };
    
    await applyConfiguration(defaultConfig);
}

function getConfigurationWebviewContent(): string {
    const currentConfig = vscode.workspace.getConfiguration('docGenerator');
    
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentation Generator Configuration</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                background-color: var(--vscode-textBlockQuote-background);
                border-radius: 4px;
                border-left: 4px solid var(--vscode-textLink-foreground);
            }
            .form-group {
                margin-bottom: 15px;
            }
            label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
            }
            input, select, textarea {
                width: 100%;
                padding: 8px;
                border: 1px solid var(--vscode-input-border);
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 2px;
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
            .button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 10px 20px;
                border-radius: 2px;
                cursor: pointer;
                margin-right: 10px;
            }
            .button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .button.secondary {
                background-color: var(--vscode-button-secondaryBackground);
                color: var(--vscode-button-secondaryForeground);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Documentation Generator Configuration</h1>
            
            <div class="section">
                <h2>Basic Settings</h2>
                <div class="checkbox-group">
                    <input type="checkbox" id="enabled" ${currentConfig.get('enabled') ? 'checked' : ''}>
                    <label for="enabled">Enable documentation generator</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="autoUpdate" ${currentConfig.get('autoUpdate') ? 'checked' : ''}>
                    <label for="autoUpdate">Auto-update documentation on file changes</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="includePrivate" ${currentConfig.get('includePrivate') ? 'checked' : ''}>
                    <label for="includePrivate">Include private members in documentation</label>
                </div>
            </div>
            
            <div class="section">
                <h2>Output Settings</h2>
                <div class="form-group">
                    <label for="outputDirectory">Output Directory:</label>
                    <input type="text" id="outputDirectory" value="${currentConfig.get('outputDirectory') || './docs'}">
                </div>
            </div>
            
            <div class="section">
                <h2>Language Support</h2>
                <div class="checkbox-group">
                    <input type="checkbox" id="lang-typescript" ${((currentConfig.get('supportedLanguages') as string[]) || []).includes('typescript') ? 'checked' : ''}>
                    <label for="lang-typescript">TypeScript</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="lang-javascript" ${((currentConfig.get('supportedLanguages') as string[]) || []).includes('javascript') ? 'checked' : ''}>
                    <label for="lang-javascript">JavaScript</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="lang-python" ${((currentConfig.get('supportedLanguages') as string[]) || []).includes('python') ? 'checked' : ''}>
                    <label for="lang-python">Python</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="lang-java" ${((currentConfig.get('supportedLanguages') as string[]) || []).includes('java') ? 'checked' : ''}>
                    <label for="lang-java">Java</label>
                </div>
            </div>
            
            <div class="section">
                <h2>Git Integration</h2>
                <div class="checkbox-group">
                    <input type="checkbox" id="preCommitHook" ${(currentConfig.get('gitIntegration') as any)?.preCommitHook ? 'checked' : ''}>
                    <label for="preCommitHook">Enable pre-commit hook</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="autoStage" ${(currentConfig.get('gitIntegration') as any)?.autoStage ? 'checked' : ''}>
                    <label for="autoStage">Auto-stage documentation files</label>
                </div>
                <div class="form-group">
                    <label for="commitMessage">Commit Message:</label>
                    <input type="text" id="commitMessage" value="${(currentConfig.get('gitIntegration') as any)?.commitMessage || 'docs: update documentation'}">
                </div>
            </div>
            
            <div>
                <button class="button" onclick="saveConfiguration()">Save Configuration</button>
                <button class="button secondary" onclick="resetConfiguration()">Reset to Defaults</button>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            function saveConfiguration() {
                const config = {
                    enabled: document.getElementById('enabled').checked,
                    autoUpdate: document.getElementById('autoUpdate').checked,
                    includePrivate: document.getElementById('includePrivate').checked,
                    outputDirectory: document.getElementById('outputDirectory').value,
                    supportedLanguages: [
                        'typescript', 'javascript', 'python', 'java'
                    ].filter(lang => document.getElementById('lang-' + lang).checked),
                    excludePatterns: ['node_modules/**', 'dist/**', '*.test.*'],
                    gitIntegration: {
                        preCommitHook: document.getElementById('preCommitHook').checked,
                        autoStage: document.getElementById('autoStage').checked,
                        commitMessage: document.getElementById('commitMessage').value
                    }
                };
                
                vscode.postMessage({
                    command: 'saveConfig',
                    config: config
                });
            }
            
            function resetConfiguration() {
                vscode.postMessage({
                    command: 'resetConfig'
                });
            }
        </script>
    </body>
    </html>`;
}
