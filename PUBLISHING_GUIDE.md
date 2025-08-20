# 📦 Публикация расширения в VSCode Marketplace

## 🚀 Подготовка к публикации

### 1. **Установка инструментов публикации**
```bash
cd doc-generator-extension

# Установить vsce (Visual Studio Code Extension manager)
npm install -g @vscode/vsce

# Проверить установку
vsce --version
```

### 2. **Финальная проверка проекта**
```bash
# Компиляция проекта
npm run compile

# Проверка линтинга
npm run lint

# Проверка пакета
vsce ls
```

### 3. **Обновление package.json для публикации**
```json
{
  "name": "auto-documentation-generator",
  "displayName": "Auto Documentation Generator",
  "description": "Automatically generates and maintains project documentation on every Git commit",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/auto-doc-generator.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/auto-doc-generator/issues"
  },
  "homepage": "https://github.com/your-username/auto-doc-generator#readme",
  "galleryBanner": {
    "color": "#007ACC",
    "theme": "dark"
  },
  "icon": "media/icon.svg"
}
```

## 🔑 Создание Publisher аккаунта

### 1. **Регистрация в Azure DevOps**
1. Перейти на https://dev.azure.com
2. Создать аккаунт или войти с Microsoft аккаунтом
3. Создать организацию

### 2. **Создание Personal Access Token**
```bash
# В Azure DevOps:
# 1. User Settings -> Personal Access Tokens
# 2. New Token
# 3. Name: "VSCode Extensions"
# 4. Scopes: "Marketplace (manage)"
# 5. Срок действия: 1 год
# 6. Сохранить токен!
```

### 3. **Создание Publisher**
```bash
# Создать publisher
vsce create-publisher your-publisher-name

# Или войти с существующим
vsce login your-publisher-name
# Ввести Personal Access Token
```

## 📋 Предварительная проверка

### 1. **Локальное тестирование**
```bash
# Создать .vsix пакет локально
vsce package

# Это создаст файл: auto-documentation-generator-1.0.0.vsix
```

### 2. **Установка для тестирования**
```bash
# Установить в VSCode для тестирования
code --install-extension auto-documentation-generator-1.0.0.vsix

# Или через VSCode UI:
# Extensions -> ... -> Install from VSIX
```

### 3. **Тестирование функциональности**
1. Открыть тестовый проект
2. Выполнить команды плагина
3. Проверить генерацию документации
4. Проверить Git интеграцию

## 🚀 Публикация

### 1. **Первая публикация**
```bash
# Опубликовать в Marketplace
vsce publish

# Или указать конкретную версию
vsce publish 1.0.0

# С автоматическим увеличением версии
vsce publish patch  # 1.0.0 -> 1.0.1
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0
```

### 2. **Проверка публикации**
1. Перейти на https://marketplace.visualstudio.com
2. Найти ваше расширение
3. Проверить описание, скриншоты, рейтинг

## 📊 Мониторинг и обновления

### 1. **Статистика использования**
```bash
# Просмотр статистики
vsce show your-publisher-name.auto-documentation-generator
```

### 2. **Обновление расширения**
```bash
# Обновить версию в package.json
npm version patch

# Опубликовать обновление
vsce publish

# Проверить обновление
vsce show your-publisher-name.auto-documentation-generator
```

### 3. **Автоматическая публикация через CI/CD**
```yaml
# .github/workflows/publish.yml
name: Publish Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd doc-generator-extension
          npm ci
          
      - name: Compile
        run: |
          cd doc-generator-extension
          npm run compile
          
      - name: Install vsce
        run: npm install -g @vscode/vsce
        
      - name: Publish to Marketplace
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: |
          cd doc-generator-extension
          vsce publish --pat $VSCE_PAT
```

## 📥 Установка пользователями

### 1. **Через VSCode Marketplace**
1. Открыть VSCode
2. Extensions (Ctrl+Shift+X)
3. Поиск: "Auto Documentation Generator"
4. Install

### 2. **Через командную строку**
```bash
# Установка по имени
code --install-extension your-publisher-name.auto-documentation-generator

# Установка конкретной версии
code --install-extension your-publisher-name.auto-documentation-generator@1.0.0
```

### 3. **Через .vsix файл**
```bash
# Скачать .vsix файл с GitHub Releases
wget https://github.com/your-repo/releases/download/v1.0.0/extension.vsix

# Установить
code --install-extension extension.vsix
```

## 🔄 Жизненный цикл расширения

### 1. **Версионирование**
```bash
# Semantic Versioning
# MAJOR.MINOR.PATCH

# Patch: bug fixes (1.0.0 -> 1.0.1)
vsce publish patch

# Minor: new features (1.0.0 -> 1.1.0)  
vsce publish minor

# Major: breaking changes (1.0.0 -> 2.0.0)
vsce publish major
```

### 2. **Changelog для пользователей**
```markdown
# CHANGELOG.md

## [1.1.0] - 2024-01-15
### Added
- Support for Python docstrings
- New configuration wizard
- Preview functionality

### Fixed
- Git hooks installation on Windows
- Performance issues with large projects

### Changed
- Improved error messages
- Updated dependencies
```

### 3. **Deprecation и удаление**
```bash
# Отметить версию как deprecated
vsce unpublish your-publisher-name.auto-documentation-generator@1.0.0

# Удалить расширение полностью (осторожно!)
vsce unpublish your-publisher-name.auto-documentation-generator --force
```

## 📈 Продвижение расширения

### 1. **Оптимизация для поиска**
- Хорошее название и описание
- Релевантные keywords в package.json
- Качественные скриншоты
- Подробное README

### 2. **Социальные сети**
- Пост в Twitter/LinkedIn
- Статья на Medium/Dev.to
- Презентация на митапах
- GitHub репозиторий с примерами

### 3. **Сбор обратной связи**
- GitHub Issues для багов
- Marketplace reviews
- Опросы пользователей
- Analytics использования

## 🛡️ Безопасность и качество

### 1. **Код review**
- Проверка всех изменений
- Автоматические тесты
- Security scanning

### 2. **Лицензирование**
```text
MIT License - позволяет свободное использование
Apache 2.0 - более строгие требования к attribution
GPL - copyleft лицензия
```

### 3. **Поддержка пользователей**
- Быстрые ответы на Issues
- Документация и FAQ
- Примеры использования
- Video tutorials

## 📊 Метрики успеха

### Ключевые показатели:
- **Downloads** - количество скачиваний
- **Active users** - активные пользователи
- **Ratings** - оценки пользователей
- **Issues resolution time** - время решения проблем
- **Community engagement** - вовлеченность сообщества

Цели для первого года:
- 1000+ скачиваний
- 4+ звезды рейтинг
- <24 часа время ответа на Issues
- 90%+ положительные отзывы