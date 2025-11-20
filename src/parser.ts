import { Project, SourceFile, ClassDeclaration, MethodDeclaration, Decorator } from 'ts-morph';
import { DecoratorConfig } from './config';

/**
 * Represents a single API endpoint
 */
export interface ApiEndpoint {
    /** HTTP method (GET, POST, etc.) */
    method: string;
    /** Route path */
    path: string;
    /** Method name in code */
    methodName: string;
    /** Parameters */
    parameters: ApiParameter[];
    /** Line number in source file */
    lineNumber: number;
}

/**
 * Represents a parameter in an endpoint
 */
export interface ApiParameter {
    name: string;
    type: string;
    decorator?: string;
}

/**
 * Represents a controller with its endpoints
 */
export interface ApiController {
    /** Controller name */
    name: string;
    /** Base path for controller */
    basePath: string;
    /** File path */
    filePath: string;
    /** Endpoints in this controller */
    endpoints: ApiEndpoint[];
}

/**
 * Extract decorator argument value
 */
const getDecoratorArgument = (decorator: Decorator): string => {
    const args = decorator.getArguments();
    if (args.length > 0) {
        const arg = args[0];
        // Remove quotes from string literals
        return arg.getText().replace(/['"]/g, '');
    }
    return '';
};

/**
 * Parse a method to extract endpoint information
 */
const parseMethod = (
    method: MethodDeclaration,
    decoratorConfig: DecoratorConfig
): ApiEndpoint | null => {
    const decorators = method.getDecorators();

    for (const decorator of decorators) {
        const decoratorName = decorator.getName();

        if (decoratorConfig.methodDecorators.includes(decoratorName)) {
            const path = getDecoratorArgument(decorator) || '';
            const parameters: ApiParameter[] = [];

            // Extract parameters
            for (const param of method.getParameters()) {
                const paramDecorators = param.getDecorators();
                const paramType = param.getType().getText();

                let paramDecoratorName: string | undefined;
                if (paramDecorators.length > 0) {
                    paramDecoratorName = paramDecorators[0].getName();
                }

                parameters.push({
                    name: param.getName(),
                    type: paramType,
                    decorator: paramDecoratorName,
                });
            }

            return {
                method: decoratorName.toUpperCase(),
                path,
                methodName: method.getName(),
                parameters,
                lineNumber: method.getStartLineNumber(),
            };
        }
    }

    return null;
};

/**
 * Parse a class to extract controller information
 */
const parseClass = (
    classDecl: ClassDeclaration,
    filePath: string,
    decoratorConfig: DecoratorConfig
): ApiController | null => {
    const decorators = classDecl.getDecorators();

    for (const decorator of decorators) {
        const decoratorName = decorator.getName();

        if (decoratorName === decoratorConfig.controllerDecorator) {
            const basePath = getDecoratorArgument(decorator) || '';
            const endpoints: ApiEndpoint[] = [];

            // Parse all methods
            for (const method of classDecl.getMethods()) {
                const endpoint = parseMethod(method, decoratorConfig);
                if (endpoint) {
                    endpoints.push(endpoint);
                }
            }

            return {
                name: classDecl.getName() || 'UnknownController',
                basePath,
                filePath,
                endpoints,
            };
        }
    }

    return null;
};

/**
 * Parse TypeScript source code to extract API controllers
 */
export const parseSourceCode = (
    sourceCode: string,
    filePath: string,
    decoratorConfig: DecoratorConfig
): ApiController[] => {
    const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
            target: 99, // ESNext
        },
    });

    const sourceFile = project.createSourceFile(filePath, sourceCode);
    const controllers: ApiController[] = [];

    // Find all classes
    for (const classDecl of sourceFile.getClasses()) {
        const controller = parseClass(classDecl, filePath, decoratorConfig);
        if (controller) {
            controllers.push(controller);
        }
    }

    return controllers;
};

/**
 * Parse multiple files to extract all controllers
 */
export const parseControllers = async (
    fileContents: Map<string, string>,
    decoratorConfig: DecoratorConfig
): Promise<ApiController[]> => {
    const allControllers: ApiController[] = [];

    for (const [filePath, content] of fileContents.entries()) {
        const controllers = parseSourceCode(content, filePath, decoratorConfig);
        allControllers.push(...controllers);
    }

    return allControllers;
};
