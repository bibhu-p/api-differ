# API Diff Logger - Usage Examples

## Quick Start Workflow

### 1. Installation

```bash
npm install --save-dev api-diff-logger
```

### 2. Initialize Configuration

Run the interactive setup wizard:

```bash
npx api-diff-logger init
```

**Interactive prompts:**
```
🚀 Welcome to API Diff Logger Setup!

🔍 Detecting framework...
✅ Detected: express (confidence: 90%)
   - Found express in dependencies

? Select your framework: Express.js
? Do you want to customize these patterns? No
? Changelog output file: API_CHANGELOG.md
? Git hook commit prefix: [api]
? Append changelog summary to commit messages? Yes

✅ Configuration saved to api-diff.config.json
```

This creates `api-diff.config.json`:

```json
{
  "framework": "express",
  "includePatterns": [
    "**/*.routes.js",
    "**/*.routes.ts",
    "**/routes/**/*.js",
    "**/api/**/*.js"
  ],
  "excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/*.spec.js"
  ],
  "outputPath": "API_CHANGELOG.md",
  "hookPrefix": "[api]",
  "appendToCommitMessage": true
}
```

### 3. Manual Changelog Generation

Generate changelog between two commits:

```bash
# Compare with HEAD
npx api-diff-logger generate --from abc123

# Compare two specific commits
npx api-diff-logger generate --from abc123 --to def456

# Custom output path
npx api-diff-logger generate --from abc123 --output ./docs/CHANGELOG.md
```

**Example output:**
```
🔍 Loading configuration...
🔍 Validating commits...
✅ Commits validated: abc123 → HEAD
🔍 Getting changed files...
✅ Found 3 controller file(s)
📖 Reading file contents...
✅ Read 3 old file(s) and 3 new file(s)
🔍 Parsing controllers...
✅ Parsed 2 old controller(s) and 3 new controller(s)
🔍 Comparing APIs...
✅ Found 2 controller change(s)
   - Added: 1 controllers, 3 endpoints
   - Removed: 0 controllers, 0 endpoints
   - Modified: 1 controllers, 2 endpoints
📝 Generating changelog...
✅ Changelog written to API_CHANGELOG.md
```

### 4. Git Hook Integration (Automatic)

Install the Git hook:

```bash
npx api-diff-logger install-hook
```

**Output:**
```
✅ Git hook installed successfully!

ℹ️  Commit with prefix "[api]" to trigger automatic changelog generation.
   Example: git commit -m "[api] Add new user endpoint"
```

Now commit with the `[api]` prefix:

```bash
# Make API changes
git add src/routes/users.js

# Commit with [api] prefix
git commit -m "[api] Add user search endpoint"

# Hook automatically:
# - Detects [api] prefix
# - Generates/updates changelog
# - Stages changelog file
# - Appends summary to commit message
```

## Framework-Specific Examples

### NestJS Project

**api-diff.config.json:**
```json
{
  "framework": "nestjs",
  "includePatterns": ["**/*.controller.ts"],
  "excludePatterns": ["**/node_modules/**", "**/dist/**", "**/*.spec.ts"]
}
```

**Usage:**
```bash
npx api-diff-logger generate --from v1.0.0 --to v1.1.0
```

### Express.js Project

**api-diff.config.json:**
```json
{
  "framework": "express",
  "includePatterns": [
    "src/routes/**/*.js",
    "api/**/*.js"
  ],
  "excludePatterns": ["**/node_modules/**", "**/*.test.js"]
}
```

**Usage:**
```bash
npx api-diff-logger generate --from HEAD~5
```

### Fastify Project

**api-diff.config.json:**
```json
{
  "framework": "fastify",
  "includePatterns": ["routes/**/*.js"],
  "excludePatterns": ["**/node_modules/**"]
}
```

**Usage:**
```bash
npx api-diff-logger generate --from main --to feature-branch
```

### Custom Project Structure

**api-diff.config.json:**
```json
{
  "framework": "custom",
  "includePatterns": [
    "backend/endpoints/**/*.js",
    "server/api/**/*.ts"
  ],
  "excludePatterns": ["**/node_modules/**", "**/build/**"]
}
```

## Advanced Workflows

### CI/CD Integration

**GitHub Actions Example:**

```yaml
name: Generate API Changelog

on:
  pull_request:
    branches: [main]

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate changelog
        run: npx api-diff-logger generate --from origin/main --to HEAD
      
      - name: Upload changelog
        uses: actions/upload-artifact@v3
        with:
          name: api-changelog
          path: API_CHANGELOG.md
```

### Release Workflow

```bash
# 1. Create release branch
git checkout -b release/v2.0.0

# 2. Generate changelog for release
npx api-diff-logger generate --from v1.0.0 --to HEAD --output RELEASE_NOTES.md

# 3. Review and commit
git add RELEASE_NOTES.md
git commit -m "docs: Add API changelog for v2.0.0"

# 4. Merge to main
git checkout main
git merge release/v2.0.0
```

### Monorepo Setup

**Package A - api-diff.config.json:**
```json
{
  "framework": "nestjs",
  "includePatterns": ["packages/api-a/**/*.controller.ts"],
  "outputPath": "packages/api-a/CHANGELOG.md"
}
```

**Package B - api-diff.config.json:**
```json
{
  "framework": "express",
  "includePatterns": ["packages/api-b/routes/**/*.js"],
  "outputPath": "packages/api-b/CHANGELOG.md"
}
```

## Hook Management

### Check Hook Status

```bash
npx api-diff-logger hook-status
```

**Output:**
```
✅ Git hook is installed
   Prefix: "[api]"
```

### Uninstall Hook

```bash
npx api-diff-logger uninstall-hook
```

**Output:**
```
✅ Git hook uninstalled successfully!
```

## Troubleshooting

### No Files Detected

If the package doesn't detect your API files:

1. Check your `api-diff.config.json` patterns
2. Run with verbose output to see what files are being scanned
3. Adjust `includePatterns` to match your project structure

### Framework Not Detected

If auto-detection fails:

1. Run `npx api-diff-logger init`
2. Manually select your framework
3. Customize file patterns as needed

### Hook Not Triggering

If the Git hook doesn't run:

1. Check hook status: `npx api-diff-logger hook-status`
2. Verify commit message has the correct prefix (default: `[api]`)
3. Reinstall hook: `npx api-diff-logger install-hook`

## Best Practices

1. **Commit the config file** - Add `api-diff.config.json` to version control
2. **Use consistent prefixes** - Standardize on `[api]` or your chosen prefix
3. **Review changelogs** - Check generated changelogs before releases
4. **Customize patterns** - Adjust file patterns to match your project structure
5. **Document conventions** - Add usage instructions to your project README
