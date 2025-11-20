import { cosmiconfig } from 'cosmiconfig';

/**
 * Decorator configuration for identifying API endpoints
 */
export interface DecoratorConfig {
    /** Decorator name for controllers (e.g., '@Controller') */
    controllerDecorator: string;
    /** Decorator names for HTTP methods (e.g., ['@Get', '@Post', '@Put', '@Delete']) */
    methodDecorators: string[];
    /** Optional: Decorator for route parameters */
    paramDecorators?: string[];
}

/**
 * Framework preset configuration
 */
export interface FrameworkPreset {
    name: string;
    decorators: DecoratorConfig;
    /** File patterns to include (glob) */
    includePatterns: string[];
    /** File patterns to exclude (glob) */
    excludePatterns: string[];
}

/**
 * Main configuration interface
 */
export interface Config {
    /** Framework preset or custom configuration */
    framework?: 'nestjs' | 'custom';
    /** Custom decorator configuration (overrides preset) */
    decorators?: DecoratorConfig;
    /** File patterns to include */
    includePatterns?: string[];
    /** File patterns to exclude */
    excludePatterns?: string[];
    /** Output file path for changelog */
    outputPath?: string;
    /** Git hook commit prefix (e.g., '[api]') */
    hookPrefix?: string;
    /** Append changelog summary to commit message */
    appendToCommitMessage?: boolean;
}

/**
 * NestJS preset configuration
 */
export const NESTJS_PRESET: FrameworkPreset = {
    name: 'nestjs',
    decorators: {
        controllerDecorator: 'Controller',
        methodDecorators: ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head'],
        paramDecorators: ['Param', 'Query', 'Body', 'Headers'],
    },
    includePatterns: ['**/*.controller.ts'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts', '**/*.test.ts'],
};

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<Config> = {
    framework: 'nestjs',
    decorators: NESTJS_PRESET.decorators,
    includePatterns: NESTJS_PRESET.includePatterns,
    excludePatterns: NESTJS_PRESET.excludePatterns,
    outputPath: 'API_CHANGELOG.md',
    hookPrefix: '[api]',
    appendToCommitMessage: true,
};

/**
 * Load configuration from file or use defaults
 */
export const loadConfig = async (): Promise<Required<Config>> => {
    const explorer = cosmiconfig('api-diff-logger');

    try {
        const result = await explorer.search();

        if (result && result.config) {
            const userConfig = result.config as Config;

            // Merge with defaults
            return {
                framework: userConfig.framework || DEFAULT_CONFIG.framework,
                decorators: userConfig.decorators || DEFAULT_CONFIG.decorators,
                includePatterns: userConfig.includePatterns || DEFAULT_CONFIG.includePatterns,
                excludePatterns: userConfig.excludePatterns || DEFAULT_CONFIG.excludePatterns,
                outputPath: userConfig.outputPath || DEFAULT_CONFIG.outputPath,
                hookPrefix: userConfig.hookPrefix || DEFAULT_CONFIG.hookPrefix,
                appendToCommitMessage: userConfig.appendToCommitMessage ?? DEFAULT_CONFIG.appendToCommitMessage,
            };
        }
    } catch (error) {
        console.warn('Failed to load config, using defaults:', error);
    }

    return DEFAULT_CONFIG;
};
