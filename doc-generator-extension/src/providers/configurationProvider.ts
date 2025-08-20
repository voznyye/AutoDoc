import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtensionConfiguration {
    enabled: boolean;
    autoUpdate: boolean;
    includePrivate: boolean;
    outputDirectory: string;
    templatePath: string;
    excludePatterns: string[];
    supportedLanguages: string[];
    gitIntegration: {
        preCommitHook: boolean;
        autoStage: boolean;
        commitMessage: string;
    };
}

export class ConfigurationProvider {
    private static readonly CONFIG_SECTION = 'docGenerator';

    constructor() {
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged, this);
    }

    public getCurrentConfiguration(): ExtensionConfiguration {
        const config = vscode.workspace.getConfiguration(ConfigurationProvider.CONFIG_SECTION);
        
        return {
            enabled: config.get('enabled', true),
            autoUpdate: config.get('autoUpdate', true),
            includePrivate: config.get('includePrivate', false),
            outputDirectory: config.get('outputDirectory', './docs'),
            templatePath: config.get('templatePath', ''),
            excludePatterns: config.get('excludePatterns', [
                'node_modules/**',
                'dist/**',
                '*.test.*'
            ]),
            supportedLanguages: config.get('supportedLanguages', [
                'typescript',
                'javascript',
                'python'
            ]),
            gitIntegration: config.get('gitIntegration', {
                preCommitHook: true,
                autoStage: true,
                commitMessage: 'docs: update documentation'
            })
        };
    }

    public async updateConfiguration(updates: Partial<ExtensionConfiguration>): Promise<void> {
        const config = vscode.workspace.getConfiguration(ConfigurationProvider.CONFIG_SECTION);
        
        for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined) {
                await config.update(key, value, vscode.ConfigurationTarget.Workspace);
            }
        }
    }

    public async resetToDefaults(): Promise<void> {
        const defaultConfig: ExtensionConfiguration = {
            enabled: true,
            autoUpdate: true,
            includePrivate: false,
            outputDirectory: './docs',
            templatePath: '',
            excludePatterns: [
                'node_modules/**',
                'dist/**',
                '*.test.*'
            ],
            supportedLanguages: [
                'typescript',
                'javascript',
                'python'
            ],
            gitIntegration: {
                preCommitHook: true,
                autoStage: true,
                commitMessage: 'docs: update documentation'
            }
        };

        await this.updateConfiguration(defaultConfig);
    }

    public async validateConfiguration(): Promise<{ isValid: boolean; errors: string[] }> {
        const config = this.getCurrentConfiguration();
        const errors: string[] = [];

        // Validate output directory
        if (!config.outputDirectory || config.outputDirectory.trim() === '') {
            errors.push('Output directory cannot be empty');
        }

        // Validate supported languages
        if (!config.supportedLanguages || config.supportedLanguages.length === 0) {
            errors.push('At least one supported language must be specified');
        }

        // Validate template path if specified
        if (config.templatePath && config.templatePath.trim() !== '') {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders && workspaceFolders.length > 0) {
                const templatePath = path.resolve(workspaceFolders[0].uri.fsPath, config.templatePath);
                if (!fs.existsSync(templatePath)) {
                    errors.push(`Template path does not exist: ${config.templatePath}`);
                }
            }
        }

        // Validate exclude patterns
        try {
            config.excludePatterns.forEach(pattern => {
                // Basic validation - check for invalid regex patterns
                new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            });
        } catch (error) {
            errors.push('Invalid exclude pattern detected');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public async exportConfiguration(): Promise<string> {
        const config = this.getCurrentConfiguration();
        return JSON.stringify(config, null, 2);
    }

    public async importConfiguration(configJson: string): Promise<void> {
        try {
            const importedConfig = JSON.parse(configJson) as Partial<ExtensionConfiguration>;
            
            // Validate imported configuration
            const validation = await this.validateImportedConfiguration(importedConfig);
            if (!validation.isValid) {
                throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
            }

            await this.updateConfiguration(importedConfig);
            
        } catch (error) {
            throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async validateImportedConfiguration(config: any): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Check required properties
        if (typeof config.enabled !== 'boolean') {
            errors.push('enabled must be a boolean');
        }

        if (typeof config.autoUpdate !== 'boolean') {
            errors.push('autoUpdate must be a boolean');
        }

        if (typeof config.includePrivate !== 'boolean') {
            errors.push('includePrivate must be a boolean');
        }

        if (typeof config.outputDirectory !== 'string') {
            errors.push('outputDirectory must be a string');
        }

        if (config.supportedLanguages && !Array.isArray(config.supportedLanguages)) {
            errors.push('supportedLanguages must be an array');
        }

        if (config.excludePatterns && !Array.isArray(config.excludePatterns)) {
            errors.push('excludePatterns must be an array');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public async createWorkspaceConfiguration(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const vscodeDir = path.join(workspaceRoot, '.vscode');
        const settingsPath = path.join(vscodeDir, 'settings.json');

        // Ensure .vscode directory exists
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }

        let existingSettings: any = {};
        
        // Read existing settings if they exist
        if (fs.existsSync(settingsPath)) {
            try {
                const settingsContent = fs.readFileSync(settingsPath, 'utf8');
                existingSettings = JSON.parse(settingsContent);
            } catch (error) {
                console.warn('Failed to parse existing settings.json, will create new one');
            }
        }

        // Add or update documentation generator settings
        const defaultConfig = {
            enabled: true,
            autoUpdate: true,
            includePrivate: false,
            outputDirectory: './docs',
            templatePath: '',
            excludePatterns: [
                'node_modules/**',
                'dist/**',
                '*.test.*'
            ],
            supportedLanguages: [
                'typescript',
                'javascript',
                'python'
            ],
            gitIntegration: {
                preCommitHook: true,
                autoStage: true,
                commitMessage: 'docs: update documentation'
            }
        };

        existingSettings[ConfigurationProvider.CONFIG_SECTION] = defaultConfig;

        // Write updated settings
        fs.writeFileSync(settingsPath, JSON.stringify(existingSettings, null, 2));
        
        vscode.window.showInformationMessage(
            'Workspace configuration created successfully!',
            'Open Settings'
        ).then(selection => {
            if (selection === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', ConfigurationProvider.CONFIG_SECTION);
            }
        });
    }

    public getConfigurationForLanguage(language: string): any {
        // const _config = this.getCurrentConfiguration();
        
        // Return language-specific configuration
        switch (language.toLowerCase()) {
            case 'typescript':
            case 'javascript':
                return {
                    parseJSDoc: true,
                    includeTypes: language === 'typescript',
                    followImports: true
                };
            case 'python':
                return {
                    parseDocstrings: true,
                    includeTypeHints: true,
                    followImports: true
                };
            case 'java':
                return {
                    parseJavaDoc: true,
                    includeAnnotations: true,
                    followPackages: true
                };
            default:
                return {
                    parseComments: true,
                    followImports: false
                };
        }
    }

    private onConfigurationChanged(event: vscode.ConfigurationChangeEvent): void {
        if (event.affectsConfiguration(ConfigurationProvider.CONFIG_SECTION)) {
            console.log('Documentation generator configuration changed');
            
            // Validate new configuration
            this.validateConfiguration().then(validation => {
                if (!validation.isValid) {
                    vscode.window.showWarningMessage(
                        `Configuration validation failed: ${validation.errors.join(', ')}`
                    );
                }
            });

            // Emit configuration change event
            this.onConfigurationChange();
        }
    }

    private onConfigurationChange(): void {
        // This method can be overridden or used to emit events
        // For now, we'll just log the change
        console.log('Configuration change detected');
    }

    public async showConfigurationQuickPick(): Promise<void> {
        const actions = [
            {
                label: '$(gear) Open Settings',
                description: 'Open VS Code settings for documentation generator',
                action: 'openSettings'
            },
            {
                label: '$(file-code) Create Workspace Config',
                description: 'Create .vscode/settings.json with default configuration',
                action: 'createWorkspaceConfig'
            },
            {
                label: '$(export) Export Configuration',
                description: 'Export current configuration to JSON',
                action: 'exportConfig'
            },
            {
                label: '$(import) Import Configuration',
                description: 'Import configuration from JSON',
                action: 'importConfig'
            },
            {
                label: '$(refresh) Reset to Defaults',
                description: 'Reset all settings to default values',
                action: 'resetDefaults'
            },
            {
                label: '$(check) Validate Configuration',
                description: 'Check current configuration for errors',
                action: 'validateConfig'
            }
        ];

        const selected = await vscode.window.showQuickPick(actions, {
            placeHolder: 'Select configuration action'
        });

        if (selected) {
            await this.handleConfigurationAction(selected.action);
        }
    }

    private async handleConfigurationAction(action: string): Promise<void> {
        switch (action) {
            case 'openSettings':
                vscode.commands.executeCommand('workbench.action.openSettings', ConfigurationProvider.CONFIG_SECTION);
                break;
                
            case 'createWorkspaceConfig':
                await this.createWorkspaceConfiguration();
                break;
                
            case 'exportConfig':
                const exportedConfig = await this.exportConfiguration();
                const exportDoc = await vscode.workspace.openTextDocument({
                    content: exportedConfig,
                    language: 'json'
                });
                vscode.window.showTextDocument(exportDoc);
                break;
                
            case 'importConfig':
                const importedContent = await vscode.window.showInputBox({
                    prompt: 'Paste JSON configuration to import',
                    placeHolder: '{ "enabled": true, ... }',
                    ignoreFocusOut: true
                });
                
                if (importedContent) {
                    try {
                        await this.importConfiguration(importedContent);
                        vscode.window.showInformationMessage('Configuration imported successfully!');
                    } catch (error) {
                        vscode.window.showErrorMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
                break;
                
            case 'resetDefaults':
                const confirm = await vscode.window.showWarningMessage(
                    'This will reset all documentation generator settings to defaults. Continue?',
                    'Yes',
                    'Cancel'
                );
                
                if (confirm === 'Yes') {
                    await this.resetToDefaults();
                    vscode.window.showInformationMessage('Configuration reset to defaults!');
                }
                break;
                
            case 'validateConfig':
                const validation = await this.validateConfiguration();
                if (validation.isValid) {
                    vscode.window.showInformationMessage('Configuration is valid!');
                } else {
                    vscode.window.showErrorMessage(`Configuration errors: ${validation.errors.join(', ')}`);
                }
                break;
        }
    }
}
