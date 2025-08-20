import * as vscode from 'vscode';
import { GitHookProvider } from './providers/gitHookProvider';
import { AICommands } from './commands/aiCommands';
import { FirstTimeSetup } from './utils/firstTimeSetup';

let gitHookProvider: GitHookProvider;
let aiCommands: AICommands;

export function activate(context: vscode.ExtensionContext) {
    console.log('🤖 AI Documentation Generator extension is now active!');

    // Initialize providers
    gitHookProvider = new GitHookProvider(context);
    aiCommands = new AICommands(context);

    // Register main AI documentation commands
    const generateProjectDocsDisposable = vscode.commands.registerCommand(
        'docGenerator.generateProjectDocs',
        () => aiCommands.generateProjectDocumentation()
    );

    const updateDocsDisposable = vscode.commands.registerCommand(
        'docGenerator.updateDocs',
        () => aiCommands.updateDocumentation()
    );

    const configureAIDisposable = vscode.commands.registerCommand(
        'docGenerator.configureAI',
        () => aiCommands.configureAI()
    );

    // Hidden command for development/testing
    const resetSetupDisposable = vscode.commands.registerCommand(
        'docGenerator.resetSetup',
        () => FirstTimeSetup.resetSetupState(context)
    );

    // Add to subscriptions for proper cleanup
    context.subscriptions.push(
        generateProjectDocsDisposable,
        updateDocsDisposable,
        configureAIDisposable,
        resetSetupDisposable
    );

    // Initialize Git hooks for auto-update on commits
    const config = vscode.workspace.getConfiguration('docGenerator');
    if (config.get('enabled') && config.get('autoUpdate')) {
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

    vscode.window.showInformationMessage('🤖 AI Documentation Generator is ready! Start with "Generate Project Documentation"');
}

export function deactivate() {
    console.log('🤖 AI Documentation Generator extension is now deactivated');
    
    // Cleanup providers
    if (gitHookProvider) {
        gitHookProvider.cleanup();
    }
}



function setupFileWatchers(context: vscode.ExtensionContext) {
    // Watch for changes in common source code file types
    const patterns = [
        '**/*.{ts,tsx,js,jsx}', // TypeScript and JavaScript
        '**/*.{py,pyi}',        // Python
        '**/*.{java,kt}',       // Java and Kotlin
        '**/*.{cs,fs}',         // C# and F#
        '**/*.{go,rs}',         // Go and Rust
        '**/*.{php,rb}',        // PHP and Ruby
        '**/*.{swift,m,mm}',    // Swift and Objective-C
        '**/*.{cpp,hpp,c,h}',   // C and C++
    ];

    patterns.forEach(pattern => {
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        watcher.onDidChange(uri => {
            // Debounce updates to avoid excessive processing
            setTimeout(() => {
                // Trigger AI documentation update for changed files
                aiCommands.handleFileChange(uri.fsPath);
            }, 2000); // 2 second debounce
        });

        context.subscriptions.push(watcher);
    });
}

function setupStatusBar(context: vscode.ExtensionContext) {
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    
    statusBarItem.text = "$(robot) AI Docs: Ready";
    statusBarItem.tooltip = "AI Documentation Generator - Click to generate project documentation";
    statusBarItem.command = 'docGenerator.generateProjectDocs';
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);

    // Update status based on AI documentation operations
    aiCommands.onStatusChange((status: string) => {
        statusBarItem.text = `$(robot) AI Docs: ${status}`;
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


