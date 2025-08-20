# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 

### Changed
- 

### Deprecated
- 

### Removed
- 

### Fixed
- 

### Security
- 

{{#each versions}}
## [{{version}}] - {{date}}

{{#if changes.added.length}}
### Added
{{#each changes.added}}
- {{this}}
{{/each}}

{{/if}}
{{#if changes.changed.length}}
### Changed
{{#each changes.changed}}
- {{this}}
{{/each}}

{{/if}}
{{#if changes.deprecated.length}}
### Deprecated
{{#each changes.deprecated}}
- {{this}}
{{/each}}

{{/if}}
{{#if changes.removed.length}}
### Removed
{{#each changes.removed}}
- {{this}}
{{/each}}

{{/if}}
{{#if changes.fixed.length}}
### Fixed
{{#each changes.fixed}}
- {{this}}
{{/each}}

{{/if}}
{{#if changes.security.length}}
### Security
{{#each changes.security}}
- {{this}}
{{/each}}

{{/if}}
{{/each}}
