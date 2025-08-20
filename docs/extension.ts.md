# API Documentation

## Table of Contents

- [Functions](#functions)
  - [activate](#activate)
  - [deactivate](#deactivate)
  - [previewChanges](#previewchanges)
  - [setupFileWatchers](#setupfilewatchers)
  - [setupStatusBar](#setupstatusbar)
  - [checkFirstTimeSetup](#checkfirsttimesetup)
  - [getPreviewWebviewContent](#getpreviewwebviewcontent)

## Functions

This section contains all the functions in the codebase.

| Function | Description | Parameters | Return Type |
|----------|-------------|------------|-------------|
| `activate` | No description available | context | `void` |
| `deactivate` | No description available | None | `void` |
| `previewChanges` | No description available | None | `void` |
| `setupFileWatchers` | No description available | context | `void` |
| `setupStatusBar` | No description available | context | `void` |
| `checkFirstTimeSetup` | No description available | context | `Promise<void>` |
| `getPreviewWebviewContent` | No description available | None | `string` |

### activate

**Signature:**

```typescript
export function activate(context: vscode.ExtensionContext)
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `context` | `vscode.ExtensionContext` | No | No description |

**Returns:** `void`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:16`

### deactivate

**Signature:**

```typescript
export function deactivate()
```

**Returns:** `void`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:112`

### previewChanges

**Signature:**

```typescript
function previewChanges()
```

**Returns:** `void`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:121`

### setupFileWatchers

**Signature:**

```typescript
function setupFileWatchers(context: vscode.ExtensionContext)
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `context` | `vscode.ExtensionContext` | No | No description |

**Returns:** `void`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:136`

### setupStatusBar

**Signature:**

```typescript
function setupStatusBar(context: vscode.ExtensionContext)
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `context` | `vscode.ExtensionContext` | No | No description |

**Returns:** `void`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:178`

### checkFirstTimeSetup

**Signature:**

```typescript
async function checkFirstTimeSetup(context: vscode.ExtensionContext): Promise<void>
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `context` | `vscode.ExtensionContext` | No | No description |

**Returns:** `Promise<void>`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:197`

### getPreviewWebviewContent

**Signature:**

```typescript
function getPreviewWebviewContent(): string
```

**Returns:** `string`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/extension.ts:232`


---

*This documentation was automatically generated on 2025-08-20.*

*Generated from 7 code elements across 0 files.*
