import * as vscode from 'vscode';
import { DocumentationProvider } from './providers/documentationProvider';
import { GitHookProvider } from './providers/gitHookProvider';
import { ConfigurationProvider } from './providers/configurationProvider';
import { generateDocsCommand } from './commands/generateDocs';
import { updateDocsCommand } from './commands/updateDocs';
import { configureDocsCommand } from './commands/configureDocs';
import { AICommands } from './commands/aiCommands';
import { FirstTimeSetup } from './utils/firstTimeSetup';

let documentationProvider: DocumentationProvider;
let gitHookProvider: GitHookProvider;
let configurationProvider: ConfigurationProvider;
let aiCommands: AICommands;

export function activate(context: vscode.ExtensionContext) {
    console.log('Documentation Generator extension is now active!');

    // Initialize providers
    documentationProvider = new DocumentationProvider(context);
    gitHookProvider = new GitHookProvider(context);
    configurationProvider = new ConfigurationProvider();
    aiCommands = new AICommands(context);

    // Register commands
    const generateDocsDisposable = vscode.commands.registerCommand(
        'docGenerator.generateDocs',
        () => generateDocsCommand(documentationProvider)
    );

    const updateDocsDisposable = vscode.commands.registerCommand(
        'docGenerator.updateDocs',
        () => updateDocsCommand(documentationProvider)
    );

    const configureDocsDisposable = vscode.commands.registerCommand(
        'docGenerator.configureDocs',
        () => configureDocsCommand(configurationProvider)
    );

    const previewChangesDisposable = vscode.commands.registerCommand(
        'docGenerator.previewChanges',
        () => previewChanges()
    );

    // Register AI commands
    const generateWithAIDisposable = vscode.commands.registerCommand(
        'docGenerator.generateWithAI',
        () => aiCommands.generateWithAI()
    );

    const configureAIDisposable = vscode.commands.registerCommand(
        'docGenerator.configureAI',
        () => aiCommands.configureAI()
    );

    const testAIDisposable = vscode.commands.registerCommand(
        'docGenerator.testAI',
        () => aiCommands.testAI()
    );

    const generateSmartCommentsDisposable = vscode.commands.registerCommand(
        'docGenerator.generateSmartComments',
        () => aiCommands.generateSmartComments()
    );

    const generateSmartDescriptionDisposable = vscode.commands.registerCommand(
        'docGenerator.generateSmartDescription',
        () => aiCommands.generateSmartDescription()
    );

    // Hidden command for development/testing
    const resetSetupDisposable = vscode.commands.registerCommand(
        'docGenerator.resetSetup',
        () => FirstTimeSetup.resetSetupState(context)
    );

    // Add to subscriptions for proper cleanup
    context.subscriptions.push(
        generateDocsDisposable,
        updateDocsDisposable,
        configureDocsDisposable,
        previewChangesDisposable,
        generateWithAIDisposable,
        configureAIDisposable,
        testAIDisposable,
        generateSmartCommentsDisposable,
        generateSmartDescriptionDisposable,
        resetSetupDisposable
    );

    // Initialize Git hooks if enabled
    const config = vscode.workspace.getConfiguration('docGenerator');
    if (config.get('enabled') && config.get('gitIntegration.preCommitHook')) {
        gitHookProvider.setupHooks();
    }

    // Set up file watchers for auto-update
    if (config.get('autoUpdate')) {
        setupFileWatchers(context);
    }

    // Initialize status bar
    setupStatusBar(context);

    // Check for first-time setup (don't block activation)
    checkFirstTimeSetup(context);

    vscode.window.showInformationMessage('Documentation Generator is ready!');
}

export function deactivate() {
    console.log('Documentation Generator extension is now deactivated');
    
    // Cleanup providers
    if (gitHookProvider) {
        gitHookProvider.cleanup();
    }
}

function previewChanges() {
    // Create webview panel for previewing documentation changes
    const panel = vscode.window.createWebviewPanel(
        'docPreview',
        'Documentation Preview',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getPreviewWebviewContent();
}

function setupFileWatchers(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('docGenerator');
    const supportedLanguages = config.get<string[]>('supportedLanguages') || [];
    
    // Watch for changes in supported file types
    const patterns = supportedLanguages.map(lang => {
        switch (lang) {
            case 'typescript':
                return '**/*.{ts,tsx}';
            case 'javascript':
                return '**/*.{js,jsx}';
            case 'python':
                return '**/*.py';
            case 'java':
                return '**/*.java';
            case 'csharp':
                return '**/*.cs';
            case 'go':
                return '**/*.go';
            case 'rust':
                return '**/*.rs';
            case 'php':
                return '**/*.php';
            default:
                return `**/*.${lang}`;
        }
    });

    patterns.forEach(pattern => {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        watcher.onDidChange(uri => {
            // Debounce updates to avoid excessive processing
            setTimeout(() => {
                documentationProvider.analyzeChanges(uri.fsPath);
            }, 1000);
        });

        context.subscriptions.push(watcher);
    });
}

function setupStatusBar(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    
    statusBarItem.text = "$(book) Docs: Ready";
    statusBarItem.tooltip = "Documentation Generator Status";
    statusBarItem.command = 'docGenerator.generateDocs';
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);

    // Update status based on documentation state
    documentationProvider.onStatusChange((status: string) => {
        statusBarItem.text = `$(book) Docs: ${status}`;
    });
}

async function checkFirstTimeSetup(context: vscode.ExtensionContext): Promise<void> {
    // Delay slightly to avoid interfering with activation
    setTimeout(async () => {
        try {
            const isFirstTime = await FirstTimeSetup.isFirstTime(context);
            if (isFirstTime) {
                // Show a welcome message with option to set up AI
                const choice = await vscode.window.showInformationMessage(
                    '🎉 Welcome to Auto Documentation Generator!\n\n✨ This extension can automatically generate professional documentation for your projects.\n\n🤖 Want to enable AI-powered features?',
                    'Setup AI Features',
                    'Skip for Now',
                    'Learn More'
                );

                switch (choice) {
                    case 'Setup AI Features':
                        await FirstTimeSetup.runSetup(context);
                        break;
                    case 'Learn More':
                        await vscode.env.openExternal(vscode.Uri.parse('https://github.com/voznyye/AutoDoc#ai-features'));
                        break;
                    case 'Skip for Now':
                        await context.globalState.update('docGenerator.setupSkipped', true);
                        vscode.window.showInformationMessage(
                            '📝 You can still use basic documentation features. Enable AI anytime with "Doc Generator: Configure AI Settings"'
                        );
                        break;
                }
            }
        } catch (error) {
            console.error('First-time setup check failed:', error);
        }
    }, 1000); // 1 second delay
}

function getPreviewWebviewContent(): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documentation Preview</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                margin: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .preview-header {
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .preview-content {
                background-color: var(--vscode-textBlockQuote-background);
                padding: 20px;
                border-radius: 4px;
                border-left: 4px solid var(--vscode-textLink-foreground);
            }
            .loading {
                text-align: center;
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="preview-header">
                <h1>Documentation Preview</h1>
                <p>Preview of generated documentation changes</p>
            </div>
            <div class="preview-content">
                <div class="loading">
                    <p>Loading documentation preview...</p>
                    <p><em>This feature will show a preview of generated documentation before applying changes.</em></p>
                </div>
            </div>
        </div>
        <script>
            // Future: Add JavaScript for dynamic content loading
            console.log('Documentation preview loaded');
        </script>
    </body>
    </html>`;
}
