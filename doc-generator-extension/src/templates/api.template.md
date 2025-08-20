# API Documentation

{{#if description}}
{{description}}
{{/if}}

{{#if tableOfContents}}
## Table of Contents

{{#each sections}}
- [{{title}}](#{{anchor title}})
{{#if subsections}}
{{#each subsections}}
  - [{{title}}](#{{anchor title}})
{{/each}}
{{/if}}
{{/each}}

{{/if}}

{{#each sections}}
## {{title}}

{{content}}

{{#if subsections}}
{{#each subsections}}
### {{title}}

{{#if deprecated}}
> **⚠️ Deprecated**: This {{type}} is deprecated and may be removed in future versions.

{{/if}}

{{#if description}}
{{description}}

{{/if}}

{{#if signature}}
**Signature:**

```typescript
{{signature}}
```

{{/if}}

{{#if parameters}}
**Parameters:**

| Name | Type | Optional | Description |
|------|------|----------|-------------|
{{#each parameters}}
| `{{name}}` | `{{type}}` | {{#if optional}}Yes{{else}}No{{/if}} | {{description}} |
{{/each}}

{{/if}}

{{#if returnType}}
**Returns:** `{{returnType}}`

{{/if}}

{{#if extends}}
**Extends:** `{{extends}}`

{{/if}}

{{#if implements}}
**Implements:** {{#each implements}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}}

{{/if}}

**Location:** `{{location.file}}:{{location.line}}`

{{#if examples}}
**Examples:**

{{#each examples}}
```typescript
{{this}}
```

{{/each}}
{{/if}}

{{/each}}
{{/if}}

{{/each}}

---

*This documentation was automatically generated{{#if version}} for version {{version}}{{/if}} on {{generationDate}}.*

*Generated from {{totalElements}} code elements across {{totalFiles}} files.*
