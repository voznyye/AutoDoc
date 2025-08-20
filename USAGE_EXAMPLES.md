# Примеры использования Auto Documentation Generator

## 🎯 TypeScript/JavaScript проекты

### Настройка для React проекта
```json
// .vscode/settings.json
{
  "docGenerator.enabled": true,
  "docGenerator.autoUpdate": true,
  "docGenerator.includePrivate": false,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.supportedLanguages": ["typescript", "javascript"],
  "docGenerator.excludePatterns": [
    "node_modules/**",
    "build/**",
    "dist/**",
    "*.test.ts",
    "*.spec.ts",
    "**/__tests__/**"
  ],
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "autoStage": true,
    "commitMessage": "docs: update documentation [skip ci]"
  }
}
```

### Пример TypeScript кода с JSDoc
```typescript
/**
 * Компонент для отображения пользовательского профиля
 * @example
 * ```tsx
 * <UserProfile 
 *   user={{ name: "John", email: "john@example.com" }}
 *   onEdit={(user) => console.log('Editing:', user)}
 * />
 * ```
 */
export interface UserProfileProps {
  /** Данные пользователя */
  user: User;
  /** Callback для редактирования профиля */
  onEdit?: (user: User) => void;
  /** Показывать ли аватар */
  showAvatar?: boolean;
}

/**
 * Хук для управления состоянием пользователя
 * @param initialUser - Начальные данные пользователя
 * @returns Объект с состоянием и методами управления
 */
export function useUser(initialUser: User) {
  const [user, setUser] = useState(initialUser);
  
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  return { user, updateUser };
}
```

**Результат генерации:**
- `README.md` с описанием React компонентов
- `docs/API.md` с детальной документацией интерфейсов и хуков
- `CHANGELOG.md` с историей изменений компонентов

## 🐍 Python проекты

### Настройка для Django проекта
```json
// .vscode/settings.json
{
  "docGenerator.enabled": true,
  "docGenerator.supportedLanguages": ["python"],
  "docGenerator.excludePatterns": [
    "__pycache__/**",
    "*.pyc",
    "migrations/**",
    "venv/**",
    ".pytest_cache/**"
  ],
  "docGenerator.outputDirectory": "./docs"
}
```

### Пример Python кода с docstrings
```python
class UserService:
    """
    Сервис для работы с пользователями
    
    Provides methods for user management including
    authentication, profile updates, and data retrieval.
    
    Example:
        >>> service = UserService()
        >>> user = service.get_user_by_id(123)
        >>> service.update_profile(user, {'name': 'New Name'})
    """
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Аутентификация пользователя по email и паролю
        
        Args:
            email: Email адрес пользователя
            password: Пароль пользователя
            
        Returns:
            User object if authentication successful, None otherwise
            
        Raises:
            ValidationError: If email format is invalid
            AuthenticationError: If credentials are wrong
        """
        pass
```

## ☕ Java проекты

### Настройка для Spring Boot проекта
```json
{
  "docGenerator.enabled": true,
  "docGenerator.supportedLanguages": ["java"],
  "docGenerator.excludePatterns": [
    "target/**",
    "*.class",
    ".mvn/**"
  ]
}
```

### Пример Java кода с JavaDoc
```java
/**
 * REST контроллер для управления пользователями
 * 
 * @author AutoDoc Generator
 * @version 1.0
 * @since 2024-01-01
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    /**
     * Получение пользователя по ID
     * 
     * @param id уникальный идентификатор пользователя
     * @return ResponseEntity с данными пользователя
     * @throws UserNotFoundException если пользователь не найден
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        // implementation
    }
}
```

## 🎨 Настройка для разных типов проектов

### Монорепозиторий
```json
{
  "docGenerator.enabled": true,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.supportedLanguages": [
    "typescript", 
    "javascript", 
    "python"
  ],
  "docGenerator.excludePatterns": [
    "packages/*/node_modules/**",
    "apps/*/dist/**",
    "*.test.*",
    "coverage/**"
  ]
}
```

### Библиотека/SDK
```json
{
  "docGenerator.enabled": true,
  "docGenerator.includePrivate": false,
  "docGenerator.outputDirectory": "./api-docs",
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "autoStage": true,
    "commitMessage": "docs: update API documentation"
  }
}
```

### Микросервис
```json
{
  "docGenerator.enabled": true,
  "docGenerator.outputDirectory": "./service-docs",
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "commitMessage": "docs: update service documentation"
  }
}
```

## 🔧 Кастомные шаблоны

### Создание собственного шаблона README
```handlebars
<!-- custom-readme.template.md -->
# {{projectName}} Microservice

{{description}}

## 🏗️ Architecture

This microservice is built using:
{{#each dependencies}}
- {{this}}
{{/each}}

## 📡 API Endpoints

{{#each functions}}
{{#if (contains name "Controller")}}
### {{name}}
{{description}}

{{#if parameters}}
**Parameters:**
{{#each parameters}}
- `{{name}}` ({{type}}) - {{description}}
{{/each}}
{{/if}}
{{/if}}
{{/each}}

## 🚀 Deployment

Built and deployed automatically via CI/CD pipeline.

## 📊 Monitoring

- Health check: `/health`
- Metrics: `/metrics`
- Documentation: `/swagger-ui`
```

### Использование кастомного шаблона
```json
{
  "docGenerator.templatePath": "./templates/custom-readme.template.md"
}
```
