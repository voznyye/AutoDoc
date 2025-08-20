# ⚡ Quick Start Guide

## 🚀 Для разработчиков (использование готового плагина)

### 1. **Установка из локального файла**
```bash
# Перейти в папку с плагином
cd /Users/yehorvo/Programming/AutoDoc/doc-generator-extension

# Создать .vsix пакет
npm install -g @vscode/vsce
vsce package

# Установить в VSCode
code --install-extension auto-documentation-generator-0.1.0.vsix
```

### 2. **Быстрая настройка проекта**
```bash
# Открыть ваш проект в VSCode
code my-project/

# Создать конфигурацию
mkdir -p .vscode
cat > .vscode/settings.json << 'EOF'
{
  "docGenerator.enabled": true,
  "docGenerator.autoUpdate": true,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.supportedLanguages": ["typescript", "javascript"],
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "autoStage": true
  }
}
EOF
```

### 3. **Генерация документации**
```bash
# В VSCode:
# Ctrl+Shift+P -> "Doc Generator: Generate Documentation"

# Или через команду (если плагин поддерживает CLI)
code --command docGenerator.generateDocs
```

## 🏭 Для публикации в Marketplace

### 1. **Подготовка к публикации**
```bash
cd doc-generator-extension

# Обновить package.json
npm version 1.0.0

# Добавить publisher (замените на ваш)
sed -i '' 's/"publisher": "autodoc"/"publisher": "your-name"/' package.json

# Добавить repository
cat >> package.json << 'EOF'
,
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/auto-doc-generator.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/auto-doc-generator/issues"
  },
  "homepage": "https://github.com/your-username/auto-doc-generator#readme"
EOF
```

### 2. **Создание аккаунта и публикация**
```bash
# Установить vsce
npm install -g @vscode/vsce

# Создать publisher (один раз)
vsce create-publisher your-publisher-name

# Войти
vsce login your-publisher-name

# Опубликовать
vsce publish
```

## 🧪 Тестирование в разработке

### 1. **Запуск в режиме разработки**
```bash
# Открыть папку плагина в VSCode
code /Users/yehorvo/Programming/AutoDoc/doc-generator-extension

# Нажать F5 для запуска Extension Development Host
# Или через меню: Run -> Start Debugging
```

### 2. **Тестирование на реальном проекте**
```bash
# В новом окне VSCode (Extension Development Host)
# Открыть тестовый проект
code /path/to/test-project

# Создать тестовый TypeScript файл
cat > src/test.ts << 'EOF'
/**
 * Calculates the sum of two numbers
 * @param a First number
 * @param b Second number
 * @returns Sum of a and b
 * @example
 * ```ts
 * const result = add(2, 3);
 * console.log(result); // 5
 * ```
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * User interface for authentication
 */
export interface User {
  /** User's unique identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name?: string;
}
EOF

# Протестировать команды плагина
# Ctrl+Shift+P -> "Doc Generator: Generate Documentation"
```

## 📦 Создание дистрибутива

### 1. **Локальный .vsix файл**
```bash
cd doc-generator-extension

# Создать пакет
vsce package

# Результат: auto-documentation-generator-0.1.0.vsix
# Можно установить командой:
# code --install-extension auto-documentation-generator-0.1.0.vsix
```

### 2. **GitHub Release**
```bash
# Создать тег
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Создать release на GitHub с .vsix файлом
# Пользователи смогут скачать и установить:
# code --install-extension downloaded-file.vsix
```

## 🔧 Кастомизация для вашего проекта

### 1. **Изменение названия и описания**
```json
// package.json
{
  "name": "my-custom-doc-generator",
  "displayName": "My Documentation Tool",
  "description": "Custom documentation generator for my team",
  "publisher": "my-company"
}
```

### 2. **Добавление собственных шаблонов**
```bash
# Создать кастомный шаблон
mkdir -p src/templates/custom
cat > src/templates/custom/readme.template.md << 'EOF'
# {{projectName}} - Custom Template

{{description}}

## 🚀 Quick Start

Install dependencies:
```bash
npm install
```

## 📚 API Documentation

{{#each classes}}
### {{name}}
{{description}}
{{/each}}

---
*Generated by Custom Doc Tool*
EOF
```

### 3. **Настройка для конкретного языка**
```typescript
// Расширить CodeAnalyzer для Go
private analyzeGoFile(filePath: string, content: string) {
  // Парсинг Go комментариев
  const goCommentRegex = /\/\/ (.+)/g;
  const functionRegex = /func (\w+)\(/g;
  
  // Ваша логика анализа Go кода
}
```

## 📊 Мониторинг использования

### 1. **Логирование активности**
```typescript
// В extension.ts добавить телеметрию
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Логирование активации
    console.log('Extension activated');
    
    // Отправка анонимной телеметрии (опционально)
    vscode.env.telemetryLevel !== vscode.TelemetryLevel.Off && 
    console.log('Telemetry enabled');
}
```

### 2. **Сбор метрик**
```bash
# Проверка использования (после публикации)
vsce show your-publisher.extension-name

# Просмотр отзывов
# https://marketplace.visualstudio.com/items?itemName=your-publisher.extension-name
```

## 🎯 Roadmap развития

### Phase 1: MVP (Completed ✅)
- [x] TypeScript/JavaScript анализ
- [x] Markdown генерация
- [x] Git интеграция
- [x] VSCode команды

### Phase 2: Enhanced Features
- [ ] Python docstrings поддержка
- [ ] Java JavaDoc поддержка
- [ ] Кастомные шаблоны UI
- [ ] Live preview

### Phase 3: Advanced
- [ ] AI-powered descriptions
- [ ] Multiple output formats
- [ ] Team collaboration features
- [ ] Analytics dashboard

## 💡 Tips & Tricks

### 1. **Отладка плагина**
```typescript
// Использовать Output Channel для отладки
const outputChannel = vscode.window.createOutputChannel('Doc Generator');
outputChannel.appendLine('Debug message');
outputChannel.show();
```

### 2. **Оптимизация производительности**
```typescript
// Кэширование результатов анализа
private analysisCache = new Map<string, AnalysisResult>();

public async analyzeFile(filePath: string) {
  const fileHash = await this.getFileHash(filePath);
  
  if (this.analysisCache.has(fileHash)) {
    return this.analysisCache.get(fileHash);
  }
  
  const result = await this.performAnalysis(filePath);
  this.analysisCache.set(fileHash, result);
  return result;
}
```

### 3. **Обработка ошибок**
```typescript
try {
  await this.generateDocumentation();
} catch (error) {
  vscode.window.showErrorMessage(
    `Documentation generation failed: ${error.message}`
  );
  
  // Логирование для отладки
  console.error('Full error:', error);
}
```
