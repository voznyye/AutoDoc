# 🚀 Installation and Usage Guide

## 📦 Quick Installation

### Option 1: Install from .vsix Package (Ready to Use)

```bash
# Navigate to the extension directory
cd /Users/yehorvo/Programming/AutoDoc/doc-generator-extension

# Install the pre-built package in VSCode
code --install-extension doc-generator-extension-0.1.0.vsix
```

### Option 2: Development Mode Testing

```bash
# Open the extension folder in VSCode
code /Users/yehorvo/Programming/AutoDoc/doc-generator-extension

# Press F5 to launch Extension Development Host
# This opens a new VSCode window with the extension loaded for testing
```

## 🎯 First Time Setup

### 1. **Configure Your Project**

Create or update `.vscode/settings.json` in your project:

```json
{
  "docGenerator.enabled": true,
  "docGenerator.autoUpdate": true,
  "docGenerator.includePrivate": false,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.supportedLanguages": [
    "typescript",
    "javascript",
    "python"
  ],
  "docGenerator.excludePatterns": [
    "node_modules/**",
    "dist/**",
    "*.test.*",
    "coverage/**"
  ],
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "autoStage": true,
    "commitMessage": "docs: update documentation [skip ci]"
  }
}
```

### 2. **Generate Initial Documentation**

1. Open Command Palette: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type: `Doc Generator: Generate Documentation`
3. Press Enter

The extension will:
- Analyze your codebase
- Generate README.md
- Create docs/API.md
- Generate CHANGELOG.md
- Set up Git hooks (if enabled)

## 🔧 Available Commands

| Command | Description | Keyboard Shortcut |
|---------|-------------|-------------------|
| `Doc Generator: Generate Documentation` | Generate complete documentation | - |
| `Doc Generator: Update Documentation` | Update existing documentation | - |
| `Doc Generator: Configure Settings` | Open configuration wizard | - |
| `Doc Generator: Preview Changes` | Preview documentation before applying | - |

## 🎨 Project Examples

### TypeScript/React Project

```typescript
/**
 * User profile component for displaying user information
 * @example
 * ```tsx
 * <UserProfile 
 *   user={{ name: "John", email: "john@example.com" }}
 *   onEdit={(user) => console.log('Editing:', user)}
 * />
 * ```
 */
export interface UserProfileProps {
  /** User data object */
  user: User;
  /** Callback function for profile editing */
  onEdit?: (user: User) => void;
  /** Whether to show user avatar */
  showAvatar?: boolean;
}

/**
 * Custom hook for managing user state
 * @param initialUser - Initial user data
 * @returns Object with user state and update methods
 */
export function useUser(initialUser: User) {
  const [user, setUser] = useState(initialUser);
  
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return { user, updateUser };
}
```

**Generated Documentation:**
- README.md with component overview
- docs/API.md with detailed interface documentation
- CHANGELOG.md with component change history

### Python/Django Project

```python
class UserService:
    """
    Service for user management operations
    
    Provides methods for user authentication, profile updates,
    and data retrieval with proper error handling.
    
    Example:
        >>> service = UserService()
        >>> user = service.get_user_by_id(123)
        >>> service.update_profile(user, {'name': 'New Name'})
    """
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            User object if authentication successful, None otherwise
            
        Raises:
            ValidationError: If email format is invalid
            AuthenticationError: If credentials are incorrect
        """
        pass
```

### Java/Spring Boot Project

```java
/**
 * REST controller for user management operations
 * 
 * @author AutoDoc Generator
 * @version 1.0
 * @since 2024-01-01
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    /**
     * Retrieve user by ID
     * 
     * @param id unique user identifier
     * @return ResponseEntity with user data
     * @throws UserNotFoundException if user not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        // implementation
    }
}
```

## ⚙️ Configuration Options

### Basic Settings

```json
{
  "docGenerator.enabled": true,           // Enable/disable the extension
  "docGenerator.autoUpdate": true,        // Auto-update on file changes
  "docGenerator.includePrivate": false,   // Include private methods/classes
  "docGenerator.outputDirectory": "./docs" // Documentation output directory
}
```

### Language Support

```json
{
  "docGenerator.supportedLanguages": [
    "typescript",  // TypeScript files (.ts, .tsx)
    "javascript",  // JavaScript files (.js, .jsx)
    "python",      // Python files (.py)
    "java",        // Java files (.java)
    "csharp",      // C# files (.cs)
    "go",          // Go files (.go)
    "rust",        // Rust files (.rs)
    "php"          // PHP files (.php)
  ]
}
```

### File Exclusion

```json
{
  "docGenerator.excludePatterns": [
    "node_modules/**",     // Node.js dependencies
    "dist/**",             // Build output
    "build/**",            // Build directory
    "*.test.*",            // Test files
    "*.spec.*",            // Spec files
    "**/__tests__/**",     // Test directories
    "coverage/**",         // Coverage reports
    ".next/**",            // Next.js build
    "target/**"            // Maven/Gradle output
  ]
}
```

### Git Integration

```json
{
  "docGenerator.gitIntegration": {
    "preCommitHook": true,                        // Install pre-commit hook
    "autoStage": true,                            // Auto-stage documentation files
    "commitMessage": "docs: update documentation [skip ci]"  // Commit message template
  }
}
```

## 🔄 Workflow Integration

### Daily Development Workflow

1. **Write Code with Documentation**
```typescript
/**
 * Calculate user engagement score based on activity
 * @param user - User object with activity data
 * @param timeframe - Analysis timeframe in days
 * @returns Engagement score from 0 to 100
 */
export function calculateEngagement(user: User, timeframe: number): number {
  // implementation
}
```

2. **Automatic Updates**
- Save files → Extension analyzes changes
- Commit code → Pre-commit hook updates documentation
- Documentation files are automatically staged

3. **Manual Generation**
- Use `Doc Generator: Generate Documentation` for full regeneration
- Use `Doc Generator: Update Documentation` for incremental updates

### Team Setup

1. **Add to Repository**
```bash
# Add settings to version control
git add .vscode/settings.json
git commit -m "feat: add documentation generator settings"
```

2. **Team Installation**
```bash
# Each team member installs the extension
code --install-extension doc-generator-extension-0.1.0.vsix
```

3. **Documentation Standards**
```typescript
// Standard JSDoc format for the team
/**
 * Brief description of what the function does
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * ```ts
 * const result = functionName(param);
 * ```
 * @since 1.2.0
 */
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **Extension Not Working**
```bash
# Check if extension is installed
code --list-extensions | grep doc-generator

# Reinstall if needed
code --uninstall-extension doc-generator-extension
code --install-extension doc-generator-extension-0.1.0.vsix
```

#### 2. **Documentation Not Generated**
- Check `.vscode/settings.json` configuration
- Ensure `docGenerator.enabled: true`
- Verify supported languages are configured
- Check exclude patterns aren't too broad

#### 3. **Git Hooks Not Working**
```bash
# Check Git hooks directory
ls -la .git/hooks/

# Reconfigure Git integration
# Ctrl+Shift+P -> "Doc Generator: Configure Settings"
```

#### 4. **Performance Issues**
```json
{
  "docGenerator.excludePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.min.js",
    "coverage/**"
  ]
}
```

### Debug Mode

Enable debug output:
```json
{
  "docGenerator.debug": true
}
```

Check VSCode Output panel:
1. View → Output
2. Select "Doc Generator" from dropdown

## 📊 Generated Output Structure

```
your-project/
├── README.md                 # Project overview (updated)
├── CHANGELOG.md             # Change history (updated)
├── docs/                    # Documentation directory
│   ├── API.md              # Detailed API documentation
│   ├── modules.md          # Module-specific docs
│   └── examples.md         # Usage examples
└── .vscode/
    └── settings.json       # Extension configuration
```

## 🎯 Best Practices

### 1. **Write Good JSDoc Comments**
```typescript
/**
 * Process payment with validation and error handling
 * 
 * @param amount - Payment amount in cents
 * @param currency - ISO currency code (e.g., 'USD', 'EUR')
 * @param paymentMethod - Payment method details
 * @returns Promise resolving to payment result
 * @throws {ValidationError} When payment data is invalid
 * @throws {PaymentError} When payment processing fails
 * 
 * @example
 * ```ts
 * const result = await processPayment(1000, 'USD', {
 *   type: 'card',
 *   cardNumber: '4111111111111111'
 * });
 * ```
 */
```

### 2. **Use Consistent Naming**
- Use descriptive function and class names
- Follow language conventions (camelCase for JS/TS, snake_case for Python)
- Add meaningful parameter names

### 3. **Regular Updates**
- Run `Doc Generator: Update Documentation` before releases
- Review generated documentation for accuracy
- Update examples when APIs change

### 4. **Version Control**
```bash
# Include generated docs in version control
git add README.md CHANGELOG.md docs/
git commit -m "docs: update documentation for v1.2.0"
```

## 🚀 Next Steps

1. **Install the extension** using one of the methods above
2. **Configure your project** with appropriate settings
3. **Generate initial documentation** to see the results
4. **Customize templates** if needed for your team's style
5. **Set up team workflow** with consistent documentation standards

The Auto Documentation Generator is now ready to streamline your documentation workflow and keep your project docs always up-to-date! 📚✨
