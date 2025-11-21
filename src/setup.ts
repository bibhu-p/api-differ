import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import { detectFramework } from './framework-detector';
import { getPreset } from './config';

export interface SetupResult {
    framework: 'nestjs' | 'express' | 'fastify' | 'custom';
    includePatterns: string[];
    excludePatterns: string[];
    outputPath: string;
    hookPrefix: string;
    appendToCommitMessage: boolean;
}

/**
 * Interactive setup wizard
 */
export const runSetup = async (cwd: string = process.cwd()): Promise<SetupResult> => {
    console.log(chalk.cyan('\n🚀 Welcome to API Diff Logger Setup!\n'));

    // Auto-detect framework
    console.log(chalk.blue('🔍 Detecting framework...'));
    const detection = await detectFramework(cwd);

    if (detection.framework !== 'unknown') {
        console.log(chalk.green(`✅ Detected: ${detection.framework} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`));
        detection.detectedPatterns.forEach(pattern => {
            console.log(chalk.gray(`   - ${pattern}`));
        });
    } else {
        console.log(chalk.yellow('⚠️  Could not auto-detect framework'));
    }

    console.log('');

    // Framework selection
    const { framework } = await inquirer.prompt<{ framework: 'nestjs' | 'express' | 'fastify' | 'custom' }>([
        {
            type: 'list',
            name: 'framework',
            message: 'Select your framework:',
            default: detection.framework !== 'unknown' ? detection.framework : 'express',
            choices: [
                { name: 'NestJS', value: 'nestjs' },
                { name: 'Express.js', value: 'express' },
                { name: 'Fastify', value: 'fastify' },
                { name: 'Custom (I\'ll configure manually)', value: 'custom' },
            ],
        },
    ]);

    let includePatterns: string[];
    let excludePatterns: string[];

    if (framework === 'custom') {
        // Custom configuration
        const { customInclude, customExclude } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customInclude',
                message: 'Enter file patterns to include (comma-separated):',
                default: detection.suggestedConfig?.includePatterns.join(', ') || '**/*.routes.js, **/*.routes.ts',
                validate: (input) => input.trim().length > 0 || 'Please enter at least one pattern',
            },
            {
                type: 'input',
                name: 'customExclude',
                message: 'Enter file patterns to exclude (comma-separated):',
                default: '**/node_modules/**, **/dist/**, **/*.spec.js, **/*.test.js',
            },
        ]);

        includePatterns = customInclude.split(',').map((p: string) => p.trim());
        excludePatterns = customExclude.split(',').map((p: string) => p.trim());
    } else {
        // Use preset
        const preset = getPreset(framework);
        if (!preset) {
            throw new Error(`Unknown framework: ${framework}`);
        }

        includePatterns = preset.includePatterns;
        excludePatterns = preset.excludePatterns;

        console.log(chalk.gray(`\nUsing ${framework} preset:`));
        console.log(chalk.gray(`  Include: ${includePatterns.join(', ')}`));
        console.log(chalk.gray(`  Exclude: ${excludePatterns.join(', ')}\n`));

        const { customizePatterns } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'customizePatterns',
                message: 'Do you want to customize these patterns?',
                default: false,
            },
        ]);

        if (customizePatterns) {
            const { customInclude, customExclude } = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'customInclude',
                    message: 'Enter file patterns to include (comma-separated):',
                    default: includePatterns.join(', '),
                },
                {
                    type: 'input',
                    name: 'customExclude',
                    message: 'Enter file patterns to exclude (comma-separated):',
                    default: excludePatterns.join(', '),
                },
            ]);

            includePatterns = customInclude.split(',').map((p: string) => p.trim());
            excludePatterns = customExclude.split(',').map((p: string) => p.trim());
        }
    }

    // Additional configuration
    const { outputPath, hookPrefix, appendToCommitMessage } = await inquirer.prompt([
        {
            type: 'input',
            name: 'outputPath',
            message: 'Changelog output file:',
            default: 'API_CHANGELOG.md',
        },
        {
            type: 'input',
            name: 'hookPrefix',
            message: 'Git hook commit prefix:',
            default: '[api]',
        },
        {
            type: 'confirm',
            name: 'appendToCommitMessage',
            message: 'Append changelog summary to commit messages?',
            default: true,
        },
    ]);

    return {
        framework,
        includePatterns,
        excludePatterns,
        outputPath,
        hookPrefix,
        appendToCommitMessage,
    };
};

/**
 * Save configuration to file
 */
export const saveConfig = async (config: SetupResult, cwd: string = process.cwd()): Promise<void> => {
    const configPath = path.join(cwd, 'api-diff.config.json');

    const configContent = {
        framework: config.framework,
        includePatterns: config.includePatterns,
        excludePatterns: config.excludePatterns,
        outputPath: config.outputPath,
        hookPrefix: config.hookPrefix,
        appendToCommitMessage: config.appendToCommitMessage,
    };

    await fs.writeFile(configPath, JSON.stringify(configContent, null, 2), 'utf-8');
    console.log(chalk.green(`\n✅ Configuration saved to ${configPath}`));
};

/**
 * Run complete setup wizard
 */
export const setupWizard = async (cwd: string = process.cwd()): Promise<void> => {
    try {
        const config = await runSetup(cwd);
        await saveConfig(config, cwd);

        console.log(chalk.cyan('\n📝 Next steps:'));
        console.log(chalk.gray('  1. Review your configuration in api-diff.config.json'));
        console.log(chalk.gray('  2. Run: npx api-diff-logger install-hook'));
        console.log(chalk.gray('  3. Commit with prefix: git commit -m "[api] Your message"\n'));
    } catch (error: any) {
        if (error.isTtyError) {
            console.error(chalk.red('❌ Prompt couldn\'t be rendered in the current environment'));
        } else {
            console.error(chalk.red('❌ Setup failed:'), error.message);
        }
        throw error;
    }
};
