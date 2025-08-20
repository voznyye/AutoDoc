import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileUtils {
    
    public async pathExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async ensureDirectory(dirPath: string): Promise<void> {
        try {
            await fs.promises.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw error;
            }
        }
    }

    public async readFile(filePath: string): Promise<string> {
        try {
            return await fs.promises.readFile(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async writeFile(filePath: string, content: string): Promise<void> {
        try {
            const dirPath = path.dirname(filePath);
            await this.ensureDirectory(dirPath);
            await fs.promises.writeFile(filePath, content, 'utf8');
        } catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async copyFile(sourcePath: string, targetPath: string): Promise<void> {
        try {
            const targetDir = path.dirname(targetPath);
            await this.ensureDirectory(targetDir);
            await fs.promises.copyFile(sourcePath, targetPath);
        } catch (error) {
            throw new Error(`Failed to copy file from ${sourcePath} to ${targetPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async deleteFile(filePath: string): Promise<void> {
        try {
            if (await this.pathExists(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (error) {
            throw new Error(`Failed to delete file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async deleteDirectory(dirPath: string): Promise<void> {
        try {
            if (await this.pathExists(dirPath)) {
                await fs.promises.rmdir(dirPath, { recursive: true });
            }
        } catch (error) {
            throw new Error(`Failed to delete directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async getFileStats(filePath: string): Promise<fs.Stats | null> {
        try {
            return await fs.promises.stat(filePath);
        } catch {
            return null;
        }
    }

    public async getFileSize(filePath: string): Promise<number> {
        const stats = await this.getFileStats(filePath);
        return stats?.size || 0;
    }

    public async getLastModified(filePath: string): Promise<Date | null> {
        const stats = await this.getFileStats(filePath);
        return stats?.mtime || null;
    }

    public async isDirectory(path: string): Promise<boolean> {
        const stats = await this.getFileStats(path);
        return stats?.isDirectory() || false;
    }

    public async isFile(path: string): Promise<boolean> {
        const stats = await this.getFileStats(path);
        return stats?.isFile() || false;
    }

    public async listDirectory(dirPath: string): Promise<string[]> {
        try {
            return await fs.promises.readdir(dirPath);
        } catch (error) {
            throw new Error(`Failed to list directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async listDirectoryWithStats(dirPath: string): Promise<Array<{
        name: string;
        path: string;
        isDirectory: boolean;
        isFile: boolean;
        size: number;
        lastModified: Date;
    }>> {
        try {
            const entries = await this.listDirectory(dirPath);
            const results = [];

            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                const stats = await this.getFileStats(entryPath);
                
                if (stats) {
                    results.push({
                        name: entry,
                        path: entryPath,
                        isDirectory: stats.isDirectory(),
                        isFile: stats.isFile(),
                        size: stats.size,
                        lastModified: stats.mtime
                    });
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Failed to list directory with stats ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async findFiles(
        rootPath: string, 
        pattern: RegExp | string, 
        options: {
            recursive?: boolean;
            includeDirectories?: boolean;
            maxDepth?: number;
        } = {}
    ): Promise<string[]> {
        const { recursive = true, includeDirectories = false, maxDepth = Infinity } = options;
        const results: string[] = [];
        
        const searchPattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

        const traverse = async (currentPath: string, depth: number) => {
            if (depth > maxDepth) return;

            try {
                const entries = await this.listDirectoryWithStats(currentPath);
                
                for (const entry of entries) {
                    if (searchPattern.test(entry.name)) {
                        if (entry.isFile || (entry.isDirectory && includeDirectories)) {
                            results.push(entry.path);
                        }
                    }

                    if (recursive && entry.isDirectory && depth < maxDepth) {
                        await traverse(entry.path, depth + 1);
                    }
                }
            } catch (error) {
                console.warn(`Could not traverse directory ${currentPath}:`, error);
            }
        };

        await traverse(rootPath, 0);
        return results;
    }

    public async getFileHash(filePath: string, algorithm: string = 'md5'): Promise<string> {
        try {
            const content = await fs.promises.readFile(filePath);
            const hash = crypto.createHash(algorithm);
            hash.update(content);
            return hash.digest('hex');
        } catch (error) {
            throw new Error(`Failed to get hash for file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async compareFiles(filePath1: string, filePath2: string): Promise<boolean> {
        try {
            const [hash1, hash2] = await Promise.all([
                this.getFileHash(filePath1),
                this.getFileHash(filePath2)
            ]);
            return hash1 === hash2;
        } catch {
            return false;
        }
    }

    public async backupFile(filePath: string, backupSuffix: string = '.backup'): Promise<string> {
        const backupPath = filePath + backupSuffix;
        await this.copyFile(filePath, backupPath);
        return backupPath;
    }

    public async createTempFile(content: string, extension: string = '.tmp'): Promise<string> {
        const tempDir = await fs.promises.mkdtemp(path.join(require('os').tmpdir(), 'doc-generator-'));
        const tempFile = path.join(tempDir, `temp-${Date.now()}${extension}`);
        await this.writeFile(tempFile, content);
        return tempFile;
    }

    public async cleanupTempFiles(tempDir: string): Promise<void> {
        try {
            if (await this.pathExists(tempDir)) {
                await this.deleteDirectory(tempDir);
            }
        } catch (error) {
            console.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
        }
    }

    public getRelativePath(from: string, to: string): string {
        return path.relative(from, to);
    }

    public getAbsolutePath(filePath: string, basePath?: string): string {
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.resolve(basePath || process.cwd(), filePath);
    }

    public getFileName(filePath: string): string {
        return path.basename(filePath);
    }

    public getFileNameWithoutExtension(filePath: string): string {
        const fileName = this.getFileName(filePath);
        return path.parse(fileName).name;
    }

    public getFileExtension(filePath: string): string {
        return path.extname(filePath);
    }

    public getDirectoryName(filePath: string): string {
        return path.dirname(filePath);
    }

    public joinPaths(...paths: string[]): string {
        return path.join(...paths);
    }

    public async watchFile(
        filePath: string, 
        callback: (eventType: string, filename: string | null) => void
    ): Promise<fs.FSWatcher> {
        return fs.watch(filePath, (eventType, filename) => {
            callback(eventType, filename || '');
        });
    }

    public async watchDirectory(
        dirPath: string,
        callback: (eventType: string, filename: string | null) => void,
        options: { recursive?: boolean } = {}
    ): Promise<fs.FSWatcher> {
        return fs.watch(dirPath, { recursive: options.recursive }, (eventType, filename) => {
            callback(eventType, filename || '');
        });
    }

    public async getDirectorySize(dirPath: string): Promise<number> {
        let totalSize = 0;

        const traverse = async (currentPath: string) => {
            const entries = await this.listDirectoryWithStats(currentPath);
            
            for (const entry of entries) {
                if (entry.isFile) {
                    totalSize += entry.size;
                } else if (entry.isDirectory) {
                    await traverse(entry.path);
                }
            }
        };

        await traverse(dirPath);
        return totalSize;
    }

    public async countFiles(
        dirPath: string, 
        options: {
            recursive?: boolean;
            includeDirectories?: boolean;
            pattern?: RegExp;
        } = {}
    ): Promise<number> {
        const { recursive = true, includeDirectories = false, pattern } = options;
        let count = 0;

        const traverse = async (currentPath: string) => {
            const entries = await this.listDirectoryWithStats(currentPath);
            
            for (const entry of entries) {
                const shouldCount = entry.isFile || (entry.isDirectory && includeDirectories);
                const matchesPattern = !pattern || pattern.test(entry.name);
                
                if (shouldCount && matchesPattern) {
                    count++;
                }

                if (recursive && entry.isDirectory) {
                    await traverse(entry.path);
                }
            }
        };

        await traverse(dirPath);
        return count;
    }

    public async createSymlink(target: string, linkPath: string): Promise<void> {
        try {
            await fs.promises.symlink(target, linkPath);
        } catch (error) {
            throw new Error(`Failed to create symlink from ${target} to ${linkPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async isSymlink(filePath: string): Promise<boolean> {
        try {
            const stats = await fs.promises.lstat(filePath);
            return stats.isSymbolicLink();
        } catch {
            return false;
        }
    }

    public async readSymlink(linkPath: string): Promise<string> {
        try {
            return await fs.promises.readlink(linkPath);
        } catch (error) {
            throw new Error(`Failed to read symlink ${linkPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public async moveFile(sourcePath: string, targetPath: string): Promise<void> {
        try {
            const targetDir = path.dirname(targetPath);
            await this.ensureDirectory(targetDir);
            await fs.promises.rename(sourcePath, targetPath);
        } catch (error) {
            throw new Error(`Failed to move file from ${sourcePath} to ${targetPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    public sanitizeFileName(fileName: string): string {
        // Remove or replace invalid characters for file names
        return fileName
            .replace(/[<>:"/\\|?*]/g, '-')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    public async ensureFileDoesNotExist(filePath: string): Promise<void> {
        if (await this.pathExists(filePath)) {
            await this.deleteFile(filePath);
        }
    }

    public async getUniqueFileName(basePath: string, fileName: string): Promise<string> {
        const dir = path.dirname(basePath);
        const ext = path.extname(fileName);
        const name = path.basename(fileName, ext);
        
        let counter = 1;
        let uniquePath = path.join(dir, fileName);
        
        while (await this.pathExists(uniquePath)) {
            const uniqueName = `${name}_${counter}${ext}`;
            uniquePath = path.join(dir, uniqueName);
            counter++;
        }
        
        return uniquePath;
    }
}
