import * as fs from 'fs/promises';
import * as path from 'path';

export interface FrameworkDetectionResult {
  framework: 'nestjs' | 'express' | 'fastify' | 'custom' | 'unknown';
  confidence: number; // 0-1
  detectedPatterns: string[];
  suggestedConfig?: {
    includePatterns: string[];
    excludePatterns: string[];
  };
}

/**
 * Detect framework from package.json dependencies
 */
export const detectFrameworkFromPackageJson = async (cwd: string = process.cwd()): Promise<FrameworkDetectionResult> => {
  try {
    const packageJsonPath = path.join(cwd, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    
    const detectedPatterns: string[] = [];
    
    // Check for NestJS
    if (allDeps['@nestjs/core'] || allDeps['@nestjs/common']) {
      detectedPatterns.push('Found @nestjs/core or @nestjs/common in dependencies');
      return {
        framework: 'nestjs',
        confidence: 0.95,
        detectedPatterns,
        suggestedConfig: {
          includePatterns: ['**/*.controller.ts', '**/*.controller.js'],
          excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts', '**/*.test.ts'],
        },
      };
    }
    
    // Check for Express
    if (allDeps['express']) {
      detectedPatterns.push('Found express in dependencies');
      return {
        framework: 'express',
        confidence: 0.9,
        detectedPatterns,
        suggestedConfig: {
          includePatterns: ['**/*.routes.js', '**/*.routes.ts', '**/routes/**/*.js', '**/routes/**/*.ts', '**/api/**/*.js', '**/api/**/*.ts'],
          excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.spec.js', '**/*.test.js'],
        },
      };
    }
    
    // Check for Fastify
    if (allDeps['fastify']) {
      detectedPatterns.push('Found fastify in dependencies');
      return {
        framework: 'fastify',
        confidence: 0.9,
        detectedPatterns,
        suggestedConfig: {
          includePatterns: ['**/*.routes.js', '**/*.routes.ts', '**/routes/**/*.js', '**/routes/**/*.ts'],
          excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.spec.js', '**/*.test.js'],
        },
      };
    }
    
    return {
      framework: 'unknown',
      confidence: 0,
      detectedPatterns: ['No known framework detected in package.json'],
    };
    
  } catch (error) {
    return {
      framework: 'unknown',
      confidence: 0,
      detectedPatterns: ['Could not read package.json'],
    };
  }
};

/**
 * Detect framework from project file structure
 */
export const detectFrameworkFromStructure = async (cwd: string = process.cwd()): Promise<FrameworkDetectionResult> => {
  const detectedPatterns: string[] = [];
  
  try {
    // Check for common NestJS patterns
    const nestjsPatterns = [
      'src/**/*.controller.ts',
      'src/**/*.module.ts',
    ];
    
    // Check for common Express patterns
    const expressPatterns = [
      'routes/**/*.js',
      'routes/**/*.ts',
      'api/**/*.js',
      'api/**/*.ts',
      'src/routes/**/*.js',
      'src/routes/**/*.ts',
    ];
    
    // Simple file existence check
    const checkPattern = async (pattern: string): Promise<boolean> => {
      const parts = pattern.split('/');
      let currentPath = cwd;
      
      for (const part of parts) {
        if (part === '**' || part.includes('*')) continue;
        currentPath = path.join(currentPath, part);
        try {
          await fs.access(currentPath);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    };
    
    // Check NestJS patterns
    for (const pattern of nestjsPatterns) {
      if (await checkPattern(pattern)) {
        detectedPatterns.push(`Found NestJS pattern: ${pattern}`);
      }
    }
    
    if (detectedPatterns.length > 0) {
      return {
        framework: 'nestjs',
        confidence: 0.7,
        detectedPatterns,
        suggestedConfig: {
          includePatterns: ['**/*.controller.ts', '**/*.controller.js'],
          excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts', '**/*.test.ts'],
        },
      };
    }
    
    // Check Express patterns
    detectedPatterns.length = 0;
    for (const pattern of expressPatterns) {
      if (await checkPattern(pattern)) {
        detectedPatterns.push(`Found Express pattern: ${pattern}`);
      }
    }
    
    if (detectedPatterns.length > 0) {
      return {
        framework: 'express',
        confidence: 0.6,
        detectedPatterns,
        suggestedConfig: {
          includePatterns: ['**/*.routes.js', '**/*.routes.ts', '**/routes/**/*.js', '**/routes/**/*.ts'],
          excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.spec.js', '**/*.test.js'],
        },
      };
    }
    
    return {
      framework: 'unknown',
      confidence: 0,
      detectedPatterns: ['No known framework patterns detected in project structure'],
    };
    
  } catch (error) {
    return {
      framework: 'unknown',
      confidence: 0,
      detectedPatterns: ['Error scanning project structure'],
    };
  }
};

/**
 * Comprehensive framework detection combining multiple strategies
 */
export const detectFramework = async (cwd: string = process.cwd()): Promise<FrameworkDetectionResult> => {
  // Try package.json first (most reliable)
  const packageResult = await detectFrameworkFromPackageJson(cwd);
  if (packageResult.confidence > 0.8) {
    return packageResult;
  }
  
  // Try structure detection
  const structureResult = await detectFrameworkFromStructure(cwd);
  if (structureResult.confidence > 0.5) {
    return structureResult;
  }
  
  // Return the best result
  if (packageResult.confidence >= structureResult.confidence) {
    return packageResult;
  }
  
  return structureResult;
};

/**
 * Validate if current configuration matches detected framework
 */
export const validateFrameworkConfig = async (
  currentFramework: string,
  cwd: string = process.cwd()
): Promise<{ valid: boolean; warnings: string[]; suggestions: string[] }> => {
  const detected = await detectFramework(cwd);
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  if (detected.framework === 'unknown') {
    warnings.push('Could not auto-detect framework');
    suggestions.push('Run `npx api-diff-logger init` to configure manually');
    return { valid: false, warnings, suggestions };
  }
  
  if (currentFramework !== detected.framework && detected.confidence > 0.7) {
    warnings.push(`Configuration is set to "${currentFramework}" but detected "${detected.framework}" (confidence: ${(detected.confidence * 100).toFixed(0)}%)`);
    suggestions.push(`Consider running \`npx api-diff-logger init\` to reconfigure for ${detected.framework}`);
    suggestions.push(`Or update your .api-diff-loggerrc.json to framework: "${detected.framework}"`);
    return { valid: false, warnings, suggestions };
  }
  
  return { valid: true, warnings: [], suggestions: [] };
};
