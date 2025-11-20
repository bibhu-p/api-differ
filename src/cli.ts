#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './config';
import { getChangedFiles, getFileContentAtCommit, getCurrentFileContent, validateCommit } from './git-utils';
import { parseControllers } from './parser';
import { compareApis } from './comparator';
import { generateChangelog } from './generator';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
    .name('api-diff-logger')
    .description('Detect REST API changes and generate a changelog')
    .version('0.1.0');

program
    .command('generate')
    .description('Generate changelog between commits')
    .option('-f, --from <commit>', 'Start commit SHA')
    .option('-t, --to <commit>', 'End commit SHA (defaults to HEAD)', 'HEAD')
    .option('-o, --output <path>', 'Output file path (overrides config)')
    .option('--cwd <path>', 'Working directory (defaults to current directory)', process.cwd())
    .action(async (options) => {
        try {
            console.log(chalk.blue('🔍 Loading configuration...'));
            const config = await loadConfig();

            const { from, to, cwd } = options;
            const outputPath = options.output || config.outputPath;

            if (!from) {
                console.error(chalk.red('❌ Error: --from commit is required'));
                process.exit(1);
            }

            // Validate commits
            console.log(chalk.blue('🔍 Validating commits...'));
            const fromValid = await validateCommit(from, cwd);
            const toValid = await validateCommit(to, cwd);

            if (!fromValid) {
                console.error(chalk.red(`❌ Error: Invalid commit '${from}'`));
                process.exit(1);
            }

            if (!toValid) {
                console.error(chalk.red(`❌ Error: Invalid commit '${to}'`));
                process.exit(1);
            }

            console.log(chalk.green(`✅ Commits validated: ${from} → ${to}`));

            // Get changed files
            console.log(chalk.blue('🔍 Getting changed files...'));
            const changedFiles = await getChangedFiles(from, to, cwd);

            // Filter for controller files based on config patterns
            const controllerFiles = changedFiles.filter(file => {
                const relativePath = path.relative(cwd, file);

                // Check if file matches include patterns
                const included = config.includePatterns.some(pattern => {
                    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                    return regex.test(relativePath);
                });

                // Check if file matches exclude patterns
                const excluded = config.excludePatterns.some(pattern => {
                    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
                    return regex.test(relativePath);
                });

                return included && !excluded;
            });

            console.log(chalk.green(`✅ Found ${controllerFiles.length} controller file(s)`));

            if (controllerFiles.length === 0) {
                console.log(chalk.yellow('⚠️  No controller files changed'));
                const changelog = generateChangelog({
                    controllerChanges: [], summary: {
                        controllersAdded: 0,
                        controllersRemoved: 0,
                        controllersModified: 0,
                        endpointsAdded: 0,
                        endpointsRemoved: 0,
                        endpointsModified: 0,
                    }
                }, from, to);

                await fs.writeFile(outputPath, changelog);
                console.log(chalk.green(`✅ Changelog written to ${outputPath}`));
                return;
            }

            // Get file contents at both commits
            console.log(chalk.blue('📖 Reading file contents...'));
            const oldContents = new Map<string, string>();
            const newContents = new Map<string, string>();

            for (const file of controllerFiles) {
                const oldContent = await getFileContentAtCommit(file, from, cwd);
                const newContent = await getFileContentAtCommit(file, to, cwd);

                if (oldContent) {
                    oldContents.set(file, oldContent);
                }

                if (newContent) {
                    newContents.set(file, newContent);
                }
            }

            console.log(chalk.green(`✅ Read ${oldContents.size} old file(s) and ${newContents.size} new file(s)`));

            // Parse controllers
            console.log(chalk.blue('🔍 Parsing controllers...'));
            const oldControllers = await parseControllers(oldContents, config.decorators);
            const newControllers = await parseControllers(newContents, config.decorators);

            console.log(chalk.green(`✅ Parsed ${oldControllers.length} old controller(s) and ${newControllers.length} new controller(s)`));

            // Compare APIs
            console.log(chalk.blue('🔍 Comparing APIs...'));
            const diff = compareApis(oldControllers, newControllers);

            console.log(chalk.green(`✅ Found ${diff.controllerChanges.length} controller change(s)`));
            console.log(chalk.cyan(`   - Added: ${diff.summary.controllersAdded} controllers, ${diff.summary.endpointsAdded} endpoints`));
            console.log(chalk.cyan(`   - Removed: ${diff.summary.controllersRemoved} controllers, ${diff.summary.endpointsRemoved} endpoints`));
            console.log(chalk.cyan(`   - Modified: ${diff.summary.controllersModified} controllers, ${diff.summary.endpointsModified} endpoints`));

            // Generate changelog
            console.log(chalk.blue('📝 Generating changelog...'));
            const changelog = generateChangelog(diff, from, to);

            // Write to file
            await fs.writeFile(outputPath, changelog);
            console.log(chalk.green(`✅ Changelog written to ${outputPath}`));

        } catch (error) {
            console.error(chalk.red('❌ Error:'), error);
            process.exit(1);
        }
    });

program.parse();
