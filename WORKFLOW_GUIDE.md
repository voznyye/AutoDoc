# 🔄 Workflow Guide - Использование плагина в команде

## 📋 Ежедневный workflow разработчика

### 1. **Первичная настройка проекта**
```bash
# 1. Открыть проект в VSCode
code my-project/

# 2. Установить расширение Auto Documentation Generator

# 3. Выполнить первичную генерацию
# Ctrl+Shift+P -> "Doc Generator: Generate Documentation"
```

### 2. **Работа с кодом**
```typescript
// При написании нового кода добавляем JSDoc
/**
 * Calculates user engagement score
 * @param user - User object with activity data
 * @param timeframe - Analysis timeframe in days
 * @returns Engagement score from 0 to 100
 * @example
 * ```ts
 * const score = calculateEngagement(user, 30);
 * console.log(`Engagement: ${score}%`);
 * ```
 */
export function calculateEngagement(user: User, timeframe: number): number {
  // implementation
}
```

### 3. **Автоматическое обновление при коммите**
```bash
git add .
git commit -m "feat: add user engagement calculation"
# Плагин автоматически:
# 1. Анализирует изменения
# 2. Обновляет документацию
# 3. Добавляет docs в коммит
```

## 👥 Командный workflow

### 1. **Настройка для команды**
```json
// .vscode/settings.json (добавить в репозиторий)
{
  "docGenerator.enabled": true,
  "docGenerator.autoUpdate": true,
  "docGenerator.includePrivate": false,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.supportedLanguages": ["typescript", "javascript"],
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

### 2. **Стандарты документирования**
```typescript
// Стандарт для функций
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

// Стандарт для классов
/**
 * Brief description of the class purpose
 * 
 * @example
 * ```ts
 * const instance = new ClassName(config);
 * instance.method();
 * ```
 */

// Стандарт для интерфейсов
/**
 * Interface description
 * 
 * @example
 * ```ts
 * const obj: InterfaceName = {
 *   property: 'value'
 * };
 * ```
 */
```

### 3. **Code Review процесс**
```markdown
## PR Checklist для ревьюера

- [ ] Код имеет соответствующую JSDoc документацию
- [ ] Примеры использования актуальны
- [ ] Документация обновлена автоматически
- [ ] CHANGELOG.md содержит описание изменений
- [ ] Breaking changes отмечены в документации
```

## 🚀 CI/CD Integration

### 1. **GitHub Actions**
```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Check documentation is up to date
        run: |
          # Генерируем документацию
          npm run docs:generate
          # Проверяем, что нет изменений
          if [[ -n $(git status --porcelain) ]]; then
            echo "Documentation is not up to date!"
            git diff
            exit 1
          fi
          
      - name: Deploy docs to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

### 2. **GitLab CI**
```yaml
# .gitlab-ci.yml
stages:
  - test
  - docs

check_docs:
  stage: test
  script:
    - npm ci
    - npm run docs:generate
    - git diff --exit-code || (echo "Docs not updated!" && exit 1)

deploy_docs:
  stage: docs
  script:
    - npm run docs:generate
    - cp -r docs/ public/
  artifacts:
    paths:
      - public
  only:
    - main
```

## 📊 Мониторинг качества документации

### 1. **Метрики документации**
```json
// package.json scripts
{
  "scripts": {
    "docs:generate": "vscode --command docGenerator.generateDocs",
    "docs:check": "npm run docs:generate && git diff --exit-code",
    "docs:coverage": "node scripts/check-docs-coverage.js"
  }
}
```

### 2. **Скрипт проверки покрытия**
```javascript
// scripts/check-docs-coverage.js
const fs = require('fs');
const path = require('path');

function checkDocsCoverage() {
  const docsDir = './docs';
  const srcDir = './src';
  
  // Подсчет файлов с документацией
  const srcFiles = getAllFiles(srcDir, ['.ts', '.js']);
  const docsFiles = getAllFiles(docsDir, ['.md']);
  
  const coverage = (docsFiles.length / srcFiles.length) * 100;
  
  console.log(`Documentation coverage: ${coverage.toFixed(2)}%`);
  
  if (coverage < 80) {
    console.error('Documentation coverage is below 80%!');
    process.exit(1);
  }
}
```

## 🔧 Troubleshooting

### Частые проблемы и решения

1. **Документация не обновляется автоматически**
```bash
# Проверить настройки
code .vscode/settings.json

# Проверить Git hooks
ls -la .git/hooks/

# Переустановить hooks
# Ctrl+Shift+P -> "Doc Generator: Configure Settings"
```

2. **Неправильное форматирование JSDoc**
```typescript
// ❌ Неправильно
/*
 * This is wrong format
 */

// ✅ Правильно
/**
 * This is correct JSDoc format
 * @param param - Parameter description
 */
```

3. **Исключение файлов из документации**
```json
{
  "docGenerator.excludePatterns": [
    "**/*.test.*",
    "**/*.spec.*",
    "**/migrations/**",
    "**/__tests__/**"
  ]
}
```

4. **Кастомизация шаблонов**
```json
{
  "docGenerator.templatePath": "./templates/custom-readme.template.md"
}
```

## 📈 Best Practices

### 1. **Структура документации**
```
docs/
├── README.md              # Обзор проекта
├── API.md                 # Детальная API документация
├── CHANGELOG.md           # История изменений
├── modules/               # Документация по модулям
│   ├── auth.md
│   ├── users.md
│   └── payments.md
└── examples/              # Примеры использования
    ├── basic-usage.md
    └── advanced-usage.md
```

### 2. **Соглашения о коммитах**
```bash
# Используйте conventional commits
feat: add user authentication
fix: resolve login issue
docs: update API documentation
refactor: improve code structure

# Плагин автоматически создаст коммиты для документации:
docs: update documentation [skip ci]
```

### 3. **Версионирование документации**
```json
// package.json
{
  "version": "1.2.0",
  "scripts": {
    "version": "npm run docs:generate && git add docs/"
  }
}
```
