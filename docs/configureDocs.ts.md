# API Documentation

## Table of Contents

- [Functions](#functions)
  - [configureDocsCommand](#configuredocscommand)
  - [showConfigurationWizard](#showconfigurationwizard)
  - [showGitIntegrationWizard](#showgitintegrationwizard)
  - [applyConfiguration](#applyconfiguration)
  - [showAdvancedConfiguration](#showadvancedconfiguration)
  - [resetToDefaults](#resettodefaults)
  - [getConfigurationWebviewContent](#getconfigurationwebviewcontent)
- [Interfaces](#interfaces)
  - [ConfigurationOptions](#configurationoptions)

## Functions

This section contains all the functions in the codebase.

| Function | Description | Parameters | Return Type |
|----------|-------------|------------|-------------|
| `configureDocsCommand` | No description available | _configurationProvider | `Promise<void>` |
| `showConfigurationWizard` | No description available | currentConfig | `Promise<ConfigurationOptions | undefined>` |
| `showGitIntegrationWizard` | No description available | currentConfig | `void` |
| `applyConfiguration` | No description available | options | `Promise<void>` |
| `showAdvancedConfiguration` | No description available | None | `Promise<void>` |
| `resetToDefaults` | No description available | None | `Promise<void>` |
| `getConfigurationWebviewContent` | No description available | None | `string` |

### configureDocsCommand

**Signature:**

```typescript
export async function configureDocsCommand(_configurationProvider: ConfigurationProvider): Promise<void>
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `_configurationProvider` | `ConfigurationProvider` | No | No description |

**Returns:** `Promise<void>`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:4`

### showConfigurationWizard

**Signature:**

```typescript
async function showConfigurationWizard(currentConfig: vscode.WorkspaceConfiguration): Promise<ConfigurationOptions | undefined>
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `currentConfig` | `vscode.WorkspaceConfiguration` | No | No description |

**Returns:** `Promise<ConfigurationOptions | undefined>`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:37`

### showGitIntegrationWizard

**Signature:**

```typescript
async function showGitIntegrationWizard(currentConfig: vscode.WorkspaceConfiguration)
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `currentConfig` | `vscode.WorkspaceConfiguration` | No | No description |

**Returns:** `void`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:131`

### applyConfiguration

**Signature:**

```typescript
async function applyConfiguration(options: ConfigurationOptions): Promise<void>
```

**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
| `options` | `ConfigurationOptions` | No | No description |

**Returns:** `Promise<void>`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:180`

### showAdvancedConfiguration

**Signature:**

```typescript
export async function showAdvancedConfiguration(): Promise<void>
```

**Returns:** `Promise<void>`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:194`

### resetToDefaults

**Signature:**

```typescript
async function resetToDefaults(): Promise<void>
```

**Returns:** `Promise<void>`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:224`

### getConfigurationWebviewContent

**Signature:**

```typescript
function getConfigurationWebviewContent(): string
```

**Returns:** `string`

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:243`

## Interfaces

This section contains all the interfaces in the codebase.

| Interface | Description | Location |
|-----------|-------------|----------|
| `ConfigurationOptions` | No description available | /Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:23 |

### ConfigurationOptions

**Location:** `/Users/yehorvo/Programming/AutoDoc/doc-generator-extension/src/commands/configureDocs.ts:23`


---

*This documentation was automatically generated on 2025-08-20.*

*Generated from 8 code elements across 0 files.*
