# Скрипты для выпуска и публикации плагина

## 🚀 Автоматические скрипты релиза

### Основные команды релиза

#### `npm run release:patch`
- Увеличивает версию на **patch** (например: 2.1.0 → 2.1.1)
- Компилирует код
- Создает .vsix пакет
- Коммитит изменения в git
- Создает git tag

#### `npm run release:minor`
- Увеличивает версию на **minor** (например: 2.1.0 → 2.2.0)
- Компилирует код
- Создает .vsix пакет
- Коммитит изменения в git
- Создает git tag

#### `npm run release:major`
- Увеличивает версию на **major** (например: 2.1.0 → 3.0.0)
- Компилирует код
- Создает .vsix пакет
- Коммитит изменения в git
- Создает git tag

### Дополнительные команды

#### `npm run release:custom`
- Компилирует код без изменения версии
- Создает .vsix пакет
- Полезно для тестирования или создания пакета с текущей версией

#### `npm run clean`
- Удаляет все сгенерированные файлы (out/, dist/, *.vsix)

#### `npm run build:clean`
- Очищает и пересобирает проект

#### `npm run package:clean`
- Очищает, пересобирает и создает пакет

## 🌐 Скрипты публикации в VS Code Marketplace

### Основные команды публикации

#### `npm run publish:patch`
- Выпускает patch версию И публикует в Marketplace
- Полный цикл: версия → компиляция → пакет → git → публикация

#### `npm run publish:minor`
- Выпускает minor версию И публикует в Marketplace
- Полный цикл: версия → компиляция → пакет → git → публикация

#### `npm run publish:major`
- Выпускает major версию И публикует в Marketplace
- Полный цикл: версия → компиляция → пакет → git → публикация

#### `npm run publish:custom`
- Создает пакет с текущей версией И публикует в Marketplace

### Управление аккаунтом

#### `npm run login`
- Авторизация в VS Code Marketplace под publisher `voznyye`
- Требует Personal Access Token (PAT)

#### `npm run logout`
- Выход из аккаунта VS Code Marketplace

#### `npm run verify`
- Проверка прав доступа для публикации

## 📋 Примеры использования

### Выпуск исправления (patch)
```bash
npm run release:patch
```
Результат: версия 2.1.0 → 2.1.1

### Выпуск новой функциональности (minor)
```bash
npm run release:minor
```
Результат: версия 2.1.0 → 2.2.0

### Выпуск мажорной версии (major)
```bash
npm run release:major
```
Результат: версия 2.1.0 → 3.0.0

### Создание пакета без изменения версии
```bash
npm run release:custom
```
Результат: создается .vsix файл с текущей версией

### Публикация в VS Code Marketplace

#### Публикация patch версии
```bash
npm run publish:patch
```
Результат: версия 2.2.0 → 2.2.1 + публикация в Marketplace

#### Публикация minor версии
```bash
npm run publish:minor
```
Результат: версия 2.2.0 → 2.3.0 + публикация в Marketplace

#### Публикация major версии
```bash
npm run publish:major
```
Результат: версия 2.2.0 → 3.0.0 + публикация в Marketplace

#### Публикация текущей версии
```bash
npm run publish:custom
```
Результат: публикация версии 2.2.0 в Marketplace

## 🔧 Что происходит при выполнении

### Релиз без публикации:
1. **Изменение версии**: `npm version` обновляет package.json
2. **Компиляция**: `npm run compile` собирает TypeScript код
3. **Упаковка**: `npm run package` создает .vsix файл
4. **Git операции**: автоматический коммит и тег
5. **Результат**: готовый к публикации пакет

### Релиз с публикацией:
1. **Все шаги релиза** (версия, компиляция, пакет, git)
2. **Публикация**: `vsce publish` загружает в VS Code Marketplace
3. **Результат**: плагин доступен для установки из Marketplace

## 📁 Создаваемые файлы

- **extension.js** - скомпилированный код
- **extension.vsix** - пакет для установки
- **Git commit** - автоматический коммит изменений
- **Git tag** - тег версии для отслеживания

## ⚠️ Важные замечания

- Убедитесь, что все изменения закоммичены перед релизом
- Скрипты автоматически создают git коммиты и теги
- Версия в package.json обновляется автоматически
- .vsix файл создается в корне проекта

## 🎯 Рекомендуемый workflow

### Для локального релиза:
1. **Разработка**: работа над новыми функциями
2. **Тестирование**: `npm run compile` и `npm run test`
3. **Коммит**: `git add . && git commit -m "Feature description"`
4. **Релиз**: `npm run release:minor` (или patch/major)
5. **Ручная публикация**: загрузить .vsix файл в VS Code Marketplace

### Для автоматической публикации:
1. **Разработка**: работа над новыми функциями
2. **Тестирование**: `npm run compile` и `npm run test`
3. **Коммит**: `git add . && git commit -m "Feature description"`
4. **Релиз + Публикация**: `npm run publish:minor` (или patch/major)
5. **Результат**: плагин автоматически опубликован в Marketplace

## 🔐 Настройка для публикации

### 1. Получение Personal Access Token (PAT)
1. Перейдите на [Azure DevOps](https://dev.azure.com)
2. Войдите в аккаунт Microsoft, связанный с VS Code Marketplace
3. Создайте Personal Access Token с правами на публикацию
4. Скопируйте токен (он понадобится только один раз)

### 2. Авторизация в VS Code Marketplace
```bash
npm run login
```
- Введите publisher: `voznyye`
- Введите Personal Access Token
- Токен сохранится локально

### 3. Проверка прав доступа
```bash
npm run verify
```
- Убедитесь, что у вас есть права на публикацию

## 🚨 Troubleshooting

### Ошибка "git not found"
Убедитесь, что git установлен и настроен в проекте

### Ошибка "vsce not found"
Установите vsce: `npm install -g @vscode/vsce`

### Ошибка "not logged in"
Выполните вход: `npm run login` и введите Personal Access Token

### Ошибка "publisher not found"
Проверьте publisher в package.json (должен быть "voznyye")

### Ошибка "insufficient permissions"
Проверьте права доступа к publisher аккаунту

### Проблемы с правами доступа
Проверьте права на запись в директорию проекта
