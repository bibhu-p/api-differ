# API Diff Logger

An npm package that detects REST API controller changes between Git commits and generates a concise changelog.

## Features

- 🔍 **Automatic Detection**: Scans changed files between commits
- 🎯 **Framework Support**: Primary support for NestJS with configurable presets
- 📝 **Markdown Changelog**: Generates clean, readable changelogs
- ⚙️ **Configurable**: Customize decorators and file patterns
- 🚀 **CLI Tool**: Easy to use command-line interface

## Installation

```bash
npm install --save-dev api-diff-logger
```

## Usage

### Basic Usage

Generate a changelog between two commits:

```bash
npx api-diff-logger generate --from <commit-sha> --to <commit-sha>
```

### Options

- `--from <commit>` - Start commit SHA (required)
- `--to <commit>` - End commit SHA (defaults to HEAD)
- `--output <path>` - Output file path (defaults to `API_CHANGELOG.md`)
- `--cwd <path>` - Working directory (defaults to current directory)

### Examples

```bash
# Compare with HEAD
npx api-diff-logger generate --from abc123

# Compare two specific commits
npx api-diff-logger generate --from abc123 --to def456

# Custom output path
npx api-diff-logger generate --from abc123 --output ./docs/CHANGELOG.md
```

## Git Hook Integration

Automatically generate changelogs when committing with a specific prefix.

### Installation

```bash
npx api-diff-logger install-hook
```

### Usage

Once installed, commit with the `[api]` prefix to trigger automatic changelog generation:

```bash
git commit -m "[api] Add new user endpoint"
```

The hook will:
1. Detect the `[api]` prefix in your commit message
2. Generate/update the changelog automatically
3. Stage the changelog file
4. Append a summary to your commit message (optional)

### Hook Commands

```bash
# Install the Git hook
npx api-diff-logger install-hook

# Check hook status
npx api-diff-logger hook-status

# Uninstall the hook
npx api-diff-logger uninstall-hook
```

### Customizing the Prefix

Change the commit prefix in your configuration file:

```json
{
  "hookPrefix": "api:",
  "appendToCommitMessage": true
}
```

## Configuration

Create a configuration file in your project root:

### `.api-diff-loggerrc.json`

```json
{
  "framework": "nestjs",
  "outputPath": "API_CHANGELOG.md",
  "includePatterns": ["**/*.controller.ts"],
  "excludePatterns": ["**/node_modules/**", "**/dist/**", "**/*.spec.ts"]
}
```

### Custom Framework Configuration

For frameworks other than NestJS, you can define custom decorators:

```json
{
  "framework": "custom",
  "decorators": {
    "controllerDecorator": "Controller",
    "methodDecorators": ["Get", "Post", "Put", "Delete", "Patch"],
    "paramDecorators": ["Param", "Query", "Body"]
  },
  "includePatterns": ["**/*.controller.ts"],
  "excludePatterns": ["**/node_modules/**", "**/dist/**"]
}
```

## Configuration Files Supported

The package uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) and supports:

- `.api-diff-loggerrc`
- `.api-diff-loggerrc.json`
- `.api-diff-loggerrc.yaml`
- `.api-diff-loggerrc.yml`
- `.api-diff-loggerrc.js`
- `api-diff-logger.config.js`
- `package.json` (under `"api-diff-logger"` key)

## Changelog Format

The generated changelog includes:

- **Summary Table**: Overview of all changes
- **Detailed Changes**: Organized by controller
  - ✅ Added endpoints
  - ❌ Removed endpoints
  - 🔄 Modified endpoints

### Example Output

```markdown
# API Changelog

**Generated:** 2025-11-20T09:00:00.000Z
**Commits:** `abc123` → `def456`

## Summary

| Change Type | Count |
|-------------|-------|
| Controllers Added | 1 |
| Controllers Removed | 0 |
| Controllers Modified | 1 |
| Endpoints Added | 2 |
| Endpoints Removed | 1 |
| Endpoints Modified | 1 |

## Detailed Changes

### ✅ New Controller: `UsersController`
**Base Path:** `/users`

**Added Endpoints:**
- ✅ `GET /users` (id: string)
- ✅ `POST /users` (createUserDto: CreateUserDto)
```

## How It Works

1. **Git Integration**: Fetches changed files between commits
2. **AST Parsing**: Uses `ts-morph` to parse TypeScript files
3. **Decorator Detection**: Identifies controllers and endpoints by decorators
4. **Comparison**: Detects additions, deletions, and modifications
5. **Generation**: Creates a formatted Markdown changelog

## Requirements

- Node.js >= 14
- Git repository
- TypeScript project (for decorator-based frameworks)

## License

ISC
