import * as simpleGit from 'simple-git';
// import * as path from 'path';

export interface GitChanges {
    added: string[];
    modified: string[];
    deleted: string[];
}

export interface StagedFiles {
    added: string[];
    modified: string[];
    deleted: string[];
}

export class GitUtils {
    // private git: simpleGit.SimpleGit;

    constructor(_workingDir?: string) {
        // this.git = simpleGit.simpleGit(workingDir || process.cwd());
    }

    public async isGitRepository(directory: string): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(directory);
            await git.status();
            return true;
        } catch (error) {
            return false;
        }
    }

    public async getChangesSince(workingDir: string, since: Date): Promise<GitChanges> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            
            // Get commits since the specified date
            const sinceString = since.toISOString().split('T')[0];
            const log = await git.log({
                from: `HEAD`,
                since: sinceString
            });

            const changes: GitChanges = {
                added: [],
                modified: [],
                deleted: []
            };

            // Get diff for each commit since the date
            for (const commit of log.all) {
                try {
                    const diff = await git.diffSummary([`${commit.hash}^`, commit.hash]);
                    
                    for (const file of diff.files) {
                        const textFile = file as any; // Type assertion for file properties
                        if (textFile.insertions > 0 && textFile.deletions === 0) {
                            // New file
                            if (!changes.added.includes(file.file)) {
                                changes.added.push(file.file);
                            }
                        } else if (textFile.insertions === 0 && textFile.deletions > 0) {
                            // Deleted file
                            if (!changes.deleted.includes(file.file)) {
                                changes.deleted.push(file.file);
                            }
                        } else if (textFile.insertions > 0 && textFile.deletions > 0) {
                            // Modified file
                            if (!changes.modified.includes(file.file)) {
                                changes.modified.push(file.file);
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`Could not get diff for commit ${commit.hash}:`, error);
                }
            }

            return changes;

        } catch (error) {
            console.error('Error getting changes since date:', error);
            return {
                added: [],
                modified: [],
                deleted: []
            };
        }
    }

    public async getStagedFiles(workingDir: string): Promise<StagedFiles> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const status = await git.status();

            return {
                added: status.staged.filter(file => !status.modified.includes(file) && !status.deleted.includes(file)),
                modified: status.staged.filter(file => status.modified.includes(file)),
                deleted: status.staged.filter(file => status.deleted.includes(file))
            };

        } catch (error) {
            console.error('Error getting staged files:', error);
            return {
                added: [],
                modified: [],
                deleted: []
            };
        }
    }

    public async getUnstagedChanges(workingDir: string): Promise<GitChanges> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const status = await git.status();

            return {
                added: status.not_added,
                modified: status.modified,
                deleted: status.deleted
            };

        } catch (error) {
            console.error('Error getting unstaged changes:', error);
            return {
                added: [],
                modified: [],
                deleted: []
            };
        }
    }

    public async getCurrentBranch(workingDir: string): Promise<string> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const status = await git.status();
            return status.current || 'main';
        } catch (error) {
            console.error('Error getting current branch:', error);
            return 'main';
        }
    }

    public async getLastCommitHash(workingDir: string): Promise<string | null> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const log = await git.log({ maxCount: 1 });
            return log.latest?.hash || null;
        } catch (error) {
            console.error('Error getting last commit hash:', error);
            return null;
        }
    }

    public async getCommitsSince(workingDir: string, since: Date, maxCount: number = 50): Promise<any[]> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const sinceString = since.toISOString();
            
            const log = await git.log({
                maxCount,
                since: sinceString
            });

            return log.all.map(commit => ({
                hash: commit.hash,
                message: commit.message,
                author: commit.author_name,
                date: commit.date,
                files: []  // Files would be populated by separate diff call if needed
            }));

        } catch (error) {
            console.error('Error getting commits since date:', error);
            return [];
        }
    }

    public async stageFile(workingDir: string, filePath: string): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            await git.add(filePath);
            return true;
        } catch (error) {
            console.error(`Error staging file ${filePath}:`, error);
            return false;
        }
    }

    public async stageFiles(workingDir: string, filePaths: string[]): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            await git.add(filePaths);
            return true;
        } catch (error) {
            console.error('Error staging files:', error);
            return false;
        }
    }

    public async commit(workingDir: string, message: string): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            await git.commit(message);
            return true;
        } catch (error) {
            console.error('Error committing:', error);
            return false;
        }
    }

    public async getFileHistory(workingDir: string, filePath: string, maxCount: number = 10): Promise<any[]> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const log = await git.log({
                file: filePath,
                maxCount
            });

            return log.all.map(commit => ({
                hash: commit.hash,
                message: commit.message,
                author: commit.author_name,
                date: commit.date
            }));

        } catch (error) {
            console.error(`Error getting file history for ${filePath}:`, error);
            return [];
        }
    }

    public async getFileDiff(workingDir: string, filePath: string, fromCommit?: string, toCommit?: string): Promise<string> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            
            let diffOptions: string[] = [];
            if (fromCommit && toCommit) {
                diffOptions = [`${fromCommit}..${toCommit}`, '--', filePath];
            } else if (fromCommit) {
                diffOptions = [fromCommit, '--', filePath];
            } else {
                diffOptions = ['--', filePath];
            }

            const diff = await git.diff(diffOptions);
            return diff;

        } catch (error) {
            console.error(`Error getting diff for ${filePath}:`, error);
            return '';
        }
    }

    public async hasUncommittedChanges(workingDir: string): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const status = await git.status();
            
            return status.files.length > 0;
        } catch (error) {
            console.error('Error checking for uncommitted changes:', error);
            return false;
        }
    }

    public async getRemoteUrl(workingDir: string): Promise<string | null> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const remotes = await git.getRemotes(true);
            
            const origin = remotes.find(remote => remote.name === 'origin');
            return origin?.refs?.fetch || null;
        } catch (error) {
            console.error('Error getting remote URL:', error);
            return null;
        }
    }

    public async getRepositoryInfo(workingDir: string): Promise<{
        branch: string;
        remoteUrl: string | null;
        lastCommit: string | null;
        hasUncommittedChanges: boolean;
    }> {
        const [branch, remoteUrl, lastCommit, hasUncommittedChanges] = await Promise.all([
            this.getCurrentBranch(workingDir),
            this.getRemoteUrl(workingDir),
            this.getLastCommitHash(workingDir),
            this.hasUncommittedChanges(workingDir)
        ]);

        return {
            branch,
            remoteUrl,
            lastCommit,
            hasUncommittedChanges
        };
    }

    public async createTag(workingDir: string, tagName: string, message?: string): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            
            if (message) {
                await git.addAnnotatedTag(tagName, message);
            } else {
                await git.addTag(tagName);
            }
            
            return true;
        } catch (error) {
            console.error(`Error creating tag ${tagName}:`, error);
            return false;
        }
    }

    public async getTags(workingDir: string): Promise<string[]> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const tags = await git.tags();
            return tags.all;
        } catch (error) {
            console.error('Error getting tags:', error);
            return [];
        }
    }

    public async getChangesBetweenTags(workingDir: string, fromTag: string, toTag: string): Promise<GitChanges> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const diff = await git.diffSummary([`${fromTag}..${toTag}`]);

            const changes: GitChanges = {
                added: [],
                modified: [],
                deleted: []
            };

            for (const file of diff.files) {
                const textFile = file as any; // Type assertion for file properties
                if (textFile.insertions > 0 && textFile.deletions === 0) {
                    changes.added.push(file.file);
                } else if (textFile.insertions === 0 && textFile.deletions > 0) {
                    changes.deleted.push(file.file);
                } else if (textFile.insertions > 0 && textFile.deletions > 0) {
                    changes.modified.push(file.file);
                }
            }

            return changes;

        } catch (error) {
            console.error(`Error getting changes between tags ${fromTag} and ${toTag}:`, error);
            return {
                added: [],
                modified: [],
                deleted: []
            };
        }
    }

    public async isCleanWorkingDirectory(workingDir: string): Promise<boolean> {
        try {
            const git = simpleGit.simpleGit(workingDir);
            const status = await git.status();
            return status.isClean();
        } catch (error) {
            console.error('Error checking if working directory is clean:', error);
            return false;
        }
    }

    public async getIgnoredFiles(_workingDir: string): Promise<string[]> {
        try {
            // const git = simpleGit.simpleGit(workingDir);
            // This is a simplified implementation
            // In practice, you'd need to parse .gitignore files
            // const status = await git.status(['--ignored']);
            return []; // Simplified - would need more complex parsing
        } catch (error) {
            console.error('Error getting ignored files:', error);
            return [];
        }
    }
}
