# Промпт для Claude Sonnet 4: Создание плагина автодокументации для VSCode/Cursor

## ГЛАВНАЯ ЦЕЛЬ
Создай полноценный плагин для VSCode и Cursor Pro, который автоматически генерирует, поддерживает и обновляет документацию проекта при каждом коммите в Git.

## АРХИТЕКТУРА ПРОЕКТА

### Структура файлов
```
doc-generator-extension/
├── package.json
├── tsconfig.json
├── webpack.config.js
├── README.md
├── CHANGELOG.md
├── src/
│   ├── extension.ts (главный файл активации)
│   ├── commands/
│   │   ├── generateDocs.ts
│   │   ├── updateDocs.ts
│   │   └── configureDocs.ts
│   ├── providers/
│   │   ├── documentationProvider.ts
│   │   ├── gitHookProvider.ts
│   │   └── configurationProvider.ts
│   ├── analyzers/
│   │   ├── codeAnalyzer.ts
│   │   ├── fileStructureAnalyzer.ts
│   │   ├── dependencyAnalyzer.ts
│   │   └── changeAnalyzer.ts
│   ├── generators/
│   │   ├── markdownGenerator.ts
│   │   ├── apiDocGenerator.ts
│   │   ├── readmeGenerator.ts
│   │   └── changelogGenerator.ts
│   ├── utils/
│   │   ├── fileUtils.ts
│   │   ├── gitUtils.ts
│   │   ├── parserUtils.ts
│   │   └── templateUtils.ts
│   └── templates/
│       ├── readme.template.md
│       ├── api.template.md
│       └── changelog.template.md
├── media/
│   └── icon.png
└── out/ (компилированные файлы)
```

## ФУНКЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ

### 1. АНАЛИЗ КОДОВОЙ БАЗЫ
- **Поддерживаемые языки**: TypeScript, JavaScript, Python, Java, C#, Go, Rust, PHP
- **Анализируемые элементы**:
  - Функции, методы, классы, интерфейсы
  - Комментарии JSDoc/docstrings
  - Импорты и зависимости
  - Конфигурационные файлы
  - README.md, package.json, требования
- **Выявление изменений**: сравнение с предыдущим коммитом

### 2. ГЕНЕРАЦИЯ ДОКУМЕНТАЦИИ
- **README.md**: автогенерация с описанием проекта, установкой, использованием
- **API документация**: автоматическое создание справочника API
- **CHANGELOG.md**: отслеживание изменений между версиями
- **Архитектурные диаграммы**: генерация схем зависимостей (опционально)

### 3. ИНТЕГРАЦИЯ С GIT
- **Pre-commit hook**: проверка и обновление документации перед коммитом
- **Post-commit hook**: финализация документации после коммита
- **Автоматическое стейджинг**: добавление обновленной документации в коммит

### 4. ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС
- **Команды палитры**:
  - `Doc Generator: Generate Documentation`
  - `Doc Generator: Update Documentation`
  - `Doc Generator: Configure Settings`
  - `Doc Generator: Preview Changes`
- **Статус-бар**: индикатор состояния документации
- **Панель активности**: кастомная панель с деревом документации
- **Веб-панель**: предварительный просмотр сгенерированной документации

## ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

### 1. ТЕХНОЛОГИЧЕСКИЙ СТЕК
```json
{
  "основные_технологии": {
    "язык": "TypeScript",
    "фреймворк": "VSCode Extension API",
    "сборщик": "webpack",
    "линтер": "ESLint + Prettier"
  },
  "зависимости": {
    "vscode": "^1.80.0",
    "@types/node": "latest",
    "simple-git": "для работы с Git",
    "markdown-it": "генерация Markdown",
    "typescript": "парсинг TS/JS",
    "cheerio": "парсинг HTML (если нужно)"
  }
}
```

### 2. КОНФИГУРАЦИЯ (settings.json)
```json
{
  "docGenerator.enabled": true,
  "docGenerator.autoUpdate": true,
  "docGenerator.includePrivate": false,
  "docGenerator.outputDirectory": "./docs",
  "docGenerator.templatePath": "",
  "docGenerator.excludePatterns": [
    "node_modules/**",
    "dist/**", 
    "*.test.*"
  ],
  "docGenerator.supportedLanguages": [
    "typescript",
    "javascript", 
    "python"
  ],
  "docGenerator.gitIntegration": {
    "preCommitHook": true,
    "autoStage": true,
    "commitMessage": "docs: update documentation"
  }
}
```

### 3. АЛГОРИТМ РАБОТЫ
```typescript
interface WorkflowStep {
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

const workflow: WorkflowStep[] = [
  {
    name: "Инициализация",
    description: "Загрузка конфигурации и проверка окружения",
    inputs: ["workspace", "settings"],
    outputs: ["config", "context"]
  },
  {
    name: "Анализ изменений",
    description: "Сравнение с последним коммитом",
    inputs: ["gitHistory", "fileSystem"],
    outputs: ["changedFiles", "diffReport"]
  },
  {
    name: "Парсинг кода",
    description: "Извлечение AST и метаданных",
    inputs: ["sourceFiles", "excludePatterns"],
    outputs: ["codeStructure", "apiDefinitions"]
  },
  {
    name: "Генерация контента",
    description: "Создание документации на основе шаблонов",
    inputs: ["codeStructure", "templates"],
    outputs: ["documentationFiles"]
  },
  {
    name: "Валидация",
    description: "Проверка корректности сгенерированных файлов",
    inputs: ["documentationFiles"],
    outputs: ["validationReport"]
  },
  {
    name: "Сохранение",
    description: "Запись файлов и интеграция с Git",
    inputs: ["documentationFiles", "gitConfig"],
    outputs: ["updatedFiles", "gitOperations"]
  }
];
```

## ДЕТАЛЬНЫЕ СПЕЦИФИКАЦИИ

### 1. АНАЛИЗАТОР КОДА (codeAnalyzer.ts)
```typescript
interface CodeElement {
  type: 'function' | 'class' | 'interface' | 'variable' | 'type';
  name: string;
  description?: string;
  parameters?: Parameter[];
  returnType?: string;
  visibility: 'public' | 'private' | 'protected';
  location: {
    file: string;
    line: number;
    column: number;
  };
  decorators?: string[];
  examples?: string[];
  since?: string;
  deprecated?: boolean;
}

interface AnalysisResult {
  elements: CodeElement[];
  dependencies: string[];
  fileStructure: FileNode[];
  metrics: {
    linesOfCode: number;
    complexity: number;
    testCoverage?: number;
  };
}
```

### 2. ГЕНЕРАТОР MARKDOWN (markdownGenerator.ts)
```typescript
interface DocumentationSection {
  title: string;
  content: string;
  subsections?: DocumentationSection[];
  order: number;
}

interface GenerationOptions {
  includeTableOfContents: boolean;
  includeExamples: boolean;
  includeSourceLinks: boolean;
  templatePath?: string;
  outputFormat: 'markdown' | 'html' | 'pdf';
}
```

### 3. GIT ИНТЕГРАЦИЯ (gitHookProvider.ts)
```typescript
interface GitHookConfig {
  preCommit: {
    enabled: boolean;
    updateDocs: boolean;
    validateDocs: boolean;
    failOnError: boolean;
  };
  postCommit: {
    enabled: boolean;
    publishDocs: boolean;
    notifyTeam: boolean;
  };
}

interface CommitAnalysis {
  changedFiles: string[];
  addedFiles: string[];
  deletedFiles: string[];
  modifiedFunctions: CodeElement[];
  impactedDocuments: string[];
  suggestedUpdates: string[];
}
```

## ПОЛЬЗОВАТЕЛЬСКИЕ СЦЕНАРИИ

### 1. ПЕРВИЧНАЯ НАСТРОЙКА
1. Установка плагина
2. Автоматическое обнаружение проекта
3. Предложение конфигурации
4. Генерация базовой документации
5. Настройка Git hooks

### 2. ЕЖЕДНЕВНАЯ РАБОТА
1. Разработчик изменяет код
2. При сохранении - анализ изменений
3. Предложение обновления документации
4. При коммите - автообновление документации
5. Добавление документации в коммит

### 3. КОМАНДНАЯ РАБОТА
1. Стандартизированная документация
2. Автоматические уведомления об изменениях
3. Валидация документации в CI/CD
4. Синхронизация между участниками

## КРИТЕРИИ КАЧЕСТВА

### 1. ПРОИЗВОДИТЕЛЬНОСТЬ
- Анализ больших проектов (10k+ файлов) за < 30 секунд
- Инкрементальное обновление только измененных частей
- Кэширование результатов анализа
- Асинхронная обработка без блокировки UI

### 2. ТОЧНОСТЬ
- Корректное извлечение комментариев и docstrings
- Точное определение сигнатур функций
- Обработка различных языковых конструкций
- Поддержка TypeScript generic-типов

### 3. УДОБСТВО
- Интуитивный интерфейс настройки
- Предварительный просмотр изменений
- Отмена последних операций
- Подробные сообщения об ошибках

## ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ

### 1. БЕЗОПАСНОСТЬ
- Проверка путей файлов (предотвращение path traversal)
- Валидация пользовательских шаблонов
- Ограничение доступа к системным файлам
- Шифрование чувствительных настроек

### 2. РАСШИРЯЕМОСТЬ
- Система плагинов для поддержки новых языков
- API для кастомных генераторов
- Шаблонизатор для форматов документации
- Хуки для интеграции с внешними системами

### 3. МОНИТОРИНГ
- Логирование операций
- Метрики использования
- Отчеты об ошибках
- Аналитика эффективности

## ИНСТРУКЦИИ ПО РЕАЛИЗАЦИИ

1. **Начни с базовой структуры**: создай package.json, tsconfig.json и основные папки
2. **Реализуй минимальную функциональность**: активация плагина и одну команду
3. **Добавь анализатор кода**: начни с TypeScript/JavaScript
4. **Создай простой генератор**: базовый README.md
5. **Интегрируй с Git**: добавь pre-commit hook
6. **Расширь функциональность**: дополнительные языки и форматы
7. **Добавь UI компоненты**: панели, веб-вью, статус-бар
8. **Оптимизируй производительность**: кэширование, асинхронность
9. **Тестирование**: unit-тесты, интеграционные тесты
10. **Документация**: README, примеры, API reference

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

Полнофункциональный плагин, готовый к публикации в VSCode Marketplace, который:
- Автоматически поддерживает документацию актуальной
- Интегрируется с Git workflow
- Поддерживает множество языков программирования  
- Имеет удобный пользовательский интерфейс
- Настраивается под нужды команды
- Масштабируется для больших проектов

Создавай качественный, production-ready код с полным покрытием тестами и подробной документацией.