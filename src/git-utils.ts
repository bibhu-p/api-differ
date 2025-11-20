import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';

/**
 * Get list of changed files between two commits
 */
export const getChangedFiles = async (
    from: string,
    to: string = 'HEAD',
    cwd: string = process.cwd()
): Promise<string[]> => {
    const git: SimpleGit = simpleGit(cwd);

    try {
        // Get diff between commits
        const diff = await git.diff([from, to, '--name-only']);

        // Split by newline and filter empty strings
        const files = diff
            .split('\n')
            .filter(file => file.trim() !== '')
            .map(file => path.join(cwd, file));

        return files;
    } catch (error) {
        throw new Error(`Failed to get changed files: ${error}`);
    }
};

/**
 * Get file content at a specific commit
 */
export const getFileContentAtCommit = async (
    filePath: string,
    commit: string,
    cwd: string = process.cwd()
): Promise<string | null> => {
    const git: SimpleGit = simpleGit(cwd);

    try {
        // Get relative path from repo root
        const relativePath = path.relative(cwd, filePath);

        // Get file content at commit
        const content = await git.show([`${commit}:${relativePath}`]);
        return content;
    } catch (error) {
        // File might not exist at this commit
        return null;
    }
};

/**
 * Get current file content (working directory)
 */
export const getCurrentFileContent = async (filePath: string): Promise<string | null> => {
    const fs = await import('fs/promises');

    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        return null;
    }
};

/**
 * Validate if a commit exists
 */
export const validateCommit = async (commit: string, cwd: string = process.cwd()): Promise<boolean> => {
    const git: SimpleGit = simpleGit(cwd);

    try {
        await git.revparse([commit]);
        return true;
    } catch (error) {
        return false;
    }
};
