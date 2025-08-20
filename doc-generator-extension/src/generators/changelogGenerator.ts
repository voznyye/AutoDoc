import * as fs from 'fs';
// import * as path from 'path';
import { AnalysisResult, CodeElement } from '../analyzers/codeAnalyzer';
import { ChangesSinceLastUpdate } from '../providers/documentationProvider';

interface ChangelogEntry {
    version: string;
    date: string;
    changes: {
        added: string[];
        changed: string[];
        deprecated: string[];
        removed: string[];
        fixed: string[];
        security: string[];
    };
}

export class ChangelogGenerator {
    // private readonly changelogPath: string;

    constructor(_changelogPath?: string) {
        // this.changelogPath = changelogPath || 'CHANGELOG.md';
    }

    public async generate(analysisResult: AnalysisResult): Promise<string> {
        const version = analysisResult.metadata?.version || '1.0.0';
        const date = new Date().toISOString().split('T')[0];

        let changelog = this.generateHeader();
        
        // Add current version entry
        changelog += this.generateVersionEntry({
            version,
            date,
            changes: {
                added: this.generateAddedItems(analysisResult),
                changed: [],
                deprecated: this.generateDeprecatedItems(analysisResult),
                removed: [],
                fixed: [],
                security: []
            }
        });

        // Add template for future versions
        changelog += this.generateUnreleasedSection();
        
        return changelog;
    }

    public async update(analysisResult: AnalysisResult, changes: ChangesSinceLastUpdate): Promise<string> {
        const existingChangelog = await this.readExistingChangelog();
        const version = analysisResult.metadata?.version || this.getNextVersion(existingChangelog);
        const date = new Date().toISOString().split('T')[0];

        // Analyze changes and categorize them
        const changeCategories = await this.categorizeChanges(changes, analysisResult);

        const newEntry: ChangelogEntry = {
            version,
            date,
            changes: changeCategories
        };

        // Insert new entry at the top (after unreleased section)
        return this.insertNewEntry(existingChangelog, newEntry);
    }

    private generateHeader(): string {
        return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
    }

    private generateUnreleasedSection(): string {
        return `## [Unreleased]

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

`;
    }

    private generateVersionEntry(entry: ChangelogEntry): string {
        let section = `## [${entry.version}] - ${entry.date}\n\n`;

        if (entry.changes.added.length > 0) {
            section += '### Added\n';
            for (const item of entry.changes.added) {
                section += `- ${item}\n`;
            }
            section += '\n';
        }

        if (entry.changes.changed.length > 0) {
            section += '### Changed\n';
            for (const item of entry.changes.changed) {
                section += `- ${item}\n`;
            }
            section += '\n';
        }

        if (entry.changes.deprecated.length > 0) {
            section += '### Deprecated\n';
            for (const item of entry.changes.deprecated) {
                section += `- ${item}\n`;
            }
            section += '\n';
        }

        if (entry.changes.removed.length > 0) {
            section += '### Removed\n';
            for (const item of entry.changes.removed) {
                section += `- ${item}\n`;
            }
            section += '\n';
        }

        if (entry.changes.fixed.length > 0) {
            section += '### Fixed\n';
            for (const item of entry.changes.fixed) {
                section += `- ${item}\n`;
            }
            section += '\n';
        }

        if (entry.changes.security.length > 0) {
            section += '### Security\n';
            for (const item of entry.changes.security) {
                section += `- ${item}\n`;
            }
            section += '\n';
        }

        return section;
    }

    private generateAddedItems(analysisResult: AnalysisResult): string[] {
        const items: string[] = [];

        // Count elements by type
        const elementCounts = this.countElementsByType(analysisResult.elements);

        if (elementCounts.classes > 0) {
            items.push(`${elementCounts.classes} new class${elementCounts.classes > 1 ? 'es' : ''}`);
        }

        if (elementCounts.functions > 0) {
            items.push(`${elementCounts.functions} new function${elementCounts.functions > 1 ? 's' : ''}`);
        }

        if (elementCounts.interfaces > 0) {
            items.push(`${elementCounts.interfaces} new interface${elementCounts.interfaces > 1 ? 's' : ''}`);
        }

        if (elementCounts.types > 0) {
            items.push(`${elementCounts.types} new type definition${elementCounts.types > 1 ? 's' : ''}`);
        }

        // Add specific notable additions
        const notableElements = this.findNotableElements(analysisResult.elements);
        for (const element of notableElements) {
            items.push(`\`${element.name}\` ${element.type} - ${element.description || 'New addition'}`);
        }

        if (items.length === 0) {
            items.push('Initial release');
        }

        return items;
    }

    private generateDeprecatedItems(analysisResult: AnalysisResult): string[] {
        return analysisResult.elements
            .filter(element => element.deprecated)
            .map(element => `\`${element.name}\` ${element.type} is now deprecated`);
    }

    private async readExistingChangelog(): Promise<string> {
        try {
            const changelogPath = 'CHANGELOG.md';
            if (fs.existsSync(changelogPath)) {
                return await fs.promises.readFile(changelogPath, 'utf8');
            }
        } catch (error) {
            console.warn('Could not read existing changelog:', error);
        }
        
        return this.generateHeader() + this.generateUnreleasedSection();
    }

    private getNextVersion(existingChangelog: string): string {
        // Extract the latest version from changelog
        const versionMatch = existingChangelog.match(/## \[(\d+\.\d+\.\d+)\]/);
        if (versionMatch) {
            const currentVersion = versionMatch[1];
            const [major, minor, patch] = currentVersion.split('.').map(Number);
            return `${major}.${minor}.${patch + 1}`; // Increment patch version
        }
        return '1.0.0';
    }

    private async categorizeChanges(changes: ChangesSinceLastUpdate, analysisResult: AnalysisResult): Promise<ChangelogEntry['changes']> {
        const categories = {
            added: [] as string[],
            changed: [] as string[],
            deprecated: [] as string[],
            removed: [] as string[],
            fixed: [] as string[],
            security: [] as string[]
        };

        // Analyze added files
        if (changes.addedFiles.length > 0) {
            const codeFiles = changes.addedFiles.filter(file => this.isCodeFile(file));
            if (codeFiles.length > 0) {
                categories.added.push(`${codeFiles.length} new source file${codeFiles.length > 1 ? 's' : ''}`);
            }
        }

        // Analyze deleted files
        if (changes.deletedFiles.length > 0) {
            const codeFiles = changes.deletedFiles.filter(file => this.isCodeFile(file));
            if (codeFiles.length > 0) {
                categories.removed.push(`${codeFiles.length} source file${codeFiles.length > 1 ? 's' : ''} removed`);
            }
        }

        // Analyze changed files
        if (changes.changedFiles.length > 0) {
            const codeFiles = changes.changedFiles.filter(file => this.isCodeFile(file));
            if (codeFiles.length > 0) {
                categories.changed.push(`${codeFiles.length} source file${codeFiles.length > 1 ? 's' : ''} modified`);
            }
        }

        // Add specific element changes from analysis
        const elementChanges = this.analyzeElementChanges(analysisResult);
        categories.added.push(...elementChanges.added);
        categories.changed.push(...elementChanges.changed);
        categories.deprecated.push(...elementChanges.deprecated);

        // Add git-based insights
        const gitInsights = await this.generateGitBasedInsights(changes);
        categories.changed.push(...gitInsights);

        return categories;
    }

    private insertNewEntry(existingChangelog: string, newEntry: ChangelogEntry): string {
        const unreleasedIndex = existingChangelog.indexOf('## [Unreleased]');
        
        if (unreleasedIndex !== -1) {
            // Find the end of the unreleased section
            const nextVersionIndex = existingChangelog.indexOf('\n## [', unreleasedIndex + 1);
            const insertPoint = nextVersionIndex !== -1 ? nextVersionIndex : existingChangelog.length;
            
            const newEntryText = this.generateVersionEntry(newEntry);
            
            return existingChangelog.slice(0, insertPoint) + 
                   '\n' + newEntryText + 
                   existingChangelog.slice(insertPoint);
        } else {
            // No unreleased section, add at the top after header
            const headerEnd = existingChangelog.indexOf('\n\n') + 2;
            const newEntryText = this.generateVersionEntry(newEntry);
            
            return existingChangelog.slice(0, headerEnd) + 
                   newEntryText + '\n' + 
                   existingChangelog.slice(headerEnd);
        }
    }

    private countElementsByType(elements: CodeElement[]): Record<string, number> {
        const counts = {
            classes: 0,
            functions: 0,
            interfaces: 0,
            types: 0,
            enums: 0
        };

        for (const element of elements) {
            switch (element.type) {
                case 'class':
                    counts.classes++;
                    break;
                case 'function':
                    counts.functions++;
                    break;
                case 'interface':
                    counts.interfaces++;
                    break;
                case 'type':
                    counts.types++;
                    break;
                case 'enum':
                    counts.enums++;
                    break;
            }
        }

        return counts;
    }

    private findNotableElements(elements: CodeElement[]): CodeElement[] {
        // Find elements that might be particularly notable
        return elements.filter(element => {
            // Elements with good documentation
            if (element.description && element.description.length > 50) {
                return true;
            }
            
            // Main classes (likely important)
            if (element.type === 'class' && element.visibility === 'public') {
                return true;
            }
            
            // Functions with many parameters (likely complex/important)
            if (element.type === 'function' && element.parameters && element.parameters.length >= 3) {
                return true;
            }
            
            return false;
        }).slice(0, 5); // Limit to top 5 notable elements
    }

    private analyzeElementChanges(analysisResult: AnalysisResult): {
        added: string[];
        changed: string[];
        deprecated: string[];
    } {
        const changes = {
            added: [] as string[],
            changed: [] as string[],
            deprecated: [] as string[]
        };

        // This is a simplified implementation
        // In a real implementation, you'd compare with previous analysis results
        
        const deprecatedElements = analysisResult.elements.filter(e => e.deprecated);
        if (deprecatedElements.length > 0) {
            changes.deprecated.push(`${deprecatedElements.length} element${deprecatedElements.length > 1 ? 's' : ''} marked as deprecated`);
        }

        return changes;
    }

    private async generateGitBasedInsights(changes: ChangesSinceLastUpdate): Promise<string[]> {
        const insights: string[] = [];

        // Analyze file patterns to understand the nature of changes
        const testFiles = changes.changedFiles.filter(file => 
            file.includes('test') || file.includes('spec') || file.endsWith('.test.ts') || file.endsWith('.spec.ts')
        );

        const configFiles = changes.changedFiles.filter(file =>
            file.includes('config') || file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')
        );

        if (testFiles.length > 0) {
            insights.push('Updated test coverage and test cases');
        }

        if (configFiles.length > 0) {
            insights.push('Configuration updates');
        }

        // Check for documentation updates
        const docFiles = changes.changedFiles.filter(file =>
            file.endsWith('.md') || file.includes('doc') || file.includes('README')
        );

        if (docFiles.length > 0) {
            insights.push('Documentation improvements');
        }

        return insights;
    }

    private isCodeFile(filePath: string): boolean {
        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cs', '.go', '.rs', '.php'];
        return codeExtensions.some(ext => filePath.endsWith(ext));
    }

    public async generateReleaseNotes(version: string, analysisResult: AnalysisResult): Promise<string> {
        const date = new Date().toISOString().split('T')[0];
        
        let releaseNotes = `# Release Notes - ${version}\n\n`;
        releaseNotes += `**Release Date:** ${date}\n\n`;
        
        // Add highlights
        releaseNotes += '## Highlights\n\n';
        const highlights = this.generateReleaseHighlights(analysisResult);
        for (const highlight of highlights) {
            releaseNotes += `- ${highlight}\n`;
        }
        releaseNotes += '\n';

        // Add statistics
        releaseNotes += '## Statistics\n\n';
        releaseNotes += `- **Total Classes:** ${analysisResult.elements.filter(e => e.type === 'class').length}\n`;
        releaseNotes += `- **Total Functions:** ${analysisResult.elements.filter(e => e.type === 'function').length}\n`;
        releaseNotes += `- **Total Interfaces:** ${analysisResult.elements.filter(e => e.type === 'interface').length}\n`;
        releaseNotes += `- **Lines of Code:** ${analysisResult.metrics.linesOfCode.toLocaleString()}\n`;
        releaseNotes += `- **Dependencies:** ${analysisResult.dependencies.length}\n\n`;

        // Add breaking changes warning if any
        const deprecatedElements = analysisResult.elements.filter(e => e.deprecated);
        if (deprecatedElements.length > 0) {
            releaseNotes += '## ⚠️ Deprecation Notice\n\n';
            releaseNotes += `${deprecatedElements.length} element${deprecatedElements.length > 1 ? 's are' : ' is'} marked as deprecated and may be removed in future versions.\n\n`;
        }

        return releaseNotes;
    }

    private generateReleaseHighlights(analysisResult: AnalysisResult): string[] {
        const highlights: string[] = [];

        // Highlight major additions
        const publicClasses = analysisResult.elements.filter(e => e.type === 'class' && e.visibility === 'public');
        if (publicClasses.length > 0) {
            highlights.push(`${publicClasses.length} new public class${publicClasses.length > 1 ? 'es' : ''} added`);
        }

        // Highlight well-documented elements
        const documentedElements = analysisResult.elements.filter(e => e.description && e.description.length > 20);
        if (documentedElements.length > analysisResult.elements.length * 0.7) {
            highlights.push('Comprehensive documentation coverage');
        }

        // Highlight complexity improvements
        if (analysisResult.metrics.complexity < 10) {
            highlights.push('Low complexity codebase for better maintainability');
        }

        if (highlights.length === 0) {
            highlights.push('Various improvements and updates');
        }

        return highlights;
    }
}
