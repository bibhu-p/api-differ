import { ApiDiff, ChangeType, ControllerChange, EndpointChange } from './comparator';

/**
 * Format an endpoint as a readable string
 */
const formatEndpoint = (endpoint: any, basePath: string): string => {
    const fullPath = `${basePath}/${endpoint.path}`.replace(/\/+/g, '/');
    const params = endpoint.parameters.length > 0
        ? ` (${endpoint.parameters.map((p: any) => `${p.name}: ${p.type}`).join(', ')})`
        : '';
    return `\`${endpoint.method} ${fullPath}\`${params}`;
};

/**
 * Generate changelog section for endpoint changes
 */
const generateEndpointChanges = (
    endpointChanges: EndpointChange[],
    basePath: string
): string => {
    let output = '';

    const added = endpointChanges.filter(e => e.type === ChangeType.ADDED);
    const removed = endpointChanges.filter(e => e.type === ChangeType.REMOVED);
    const modified = endpointChanges.filter(e => e.type === ChangeType.MODIFIED);

    if (added.length > 0) {
        output += '\n**Added Endpoints:**\n';
        added.forEach(change => {
            output += `- ✅ ${formatEndpoint(change.endpoint, basePath)}\n`;
        });
    }

    if (removed.length > 0) {
        output += '\n**Removed Endpoints:**\n';
        removed.forEach(change => {
            output += `- ❌ ${formatEndpoint(change.endpoint, basePath)}\n`;
        });
    }

    if (modified.length > 0) {
        output += '\n**Modified Endpoints:**\n';
        modified.forEach(change => {
            output += `- 🔄 ${formatEndpoint(change.endpoint, basePath)}\n`;
            if (change.changes && change.changes.length > 0) {
                change.changes.forEach(c => {
                    output += `  - ${c}\n`;
                });
            }
        });
    }

    return output;
};

/**
 * Generate changelog section for a controller
 */
const generateControllerSection = (controllerChange: ControllerChange): string => {
    let output = '';
    const { controller, type, endpointChanges } = controllerChange;

    if (type === ChangeType.ADDED) {
        output += `### ✅ New Controller: \`${controller.name}\`\n`;
        output += `**Base Path:** \`${controller.basePath}\`\n`;
        output += generateEndpointChanges(endpointChanges, controller.basePath);
    } else if (type === ChangeType.REMOVED) {
        output += `### ❌ Removed Controller: \`${controller.name}\`\n`;
        output += `**Base Path:** \`${controller.basePath}\`\n`;
        output += generateEndpointChanges(endpointChanges, controller.basePath);
    } else if (type === ChangeType.MODIFIED) {
        output += `### 🔄 Modified Controller: \`${controller.name}\`\n`;
        output += `**Base Path:** \`${controller.basePath}\`\n`;
        output += generateEndpointChanges(endpointChanges, controller.basePath);
    }

    return output + '\n';
};

/**
 * Generate a complete changelog from API diff
 */
export const generateChangelog = (diff: ApiDiff, fromCommit: string, toCommit: string): string => {
    const { controllerChanges, summary } = diff;

    let changelog = `# API Changelog\n\n`;
    changelog += `**Generated:** ${new Date().toISOString()}\n`;
    changelog += `**Commits:** \`${fromCommit}\` → \`${toCommit}\`\n\n`;

    // Summary section
    changelog += `## Summary\n\n`;
    changelog += `| Change Type | Count |\n`;
    changelog += `|-------------|-------|\n`;
    changelog += `| Controllers Added | ${summary.controllersAdded} |\n`;
    changelog += `| Controllers Removed | ${summary.controllersRemoved} |\n`;
    changelog += `| Controllers Modified | ${summary.controllersModified} |\n`;
    changelog += `| Endpoints Added | ${summary.endpointsAdded} |\n`;
    changelog += `| Endpoints Removed | ${summary.endpointsRemoved} |\n`;
    changelog += `| Endpoints Modified | ${summary.endpointsModified} |\n\n`;

    // No changes
    if (controllerChanges.length === 0) {
        changelog += `## No Changes\n\nNo API changes detected between the specified commits.\n`;
        return changelog;
    }

    // Detailed changes
    changelog += `## Detailed Changes\n\n`;

    // Group by change type
    const added = controllerChanges.filter(c => c.type === ChangeType.ADDED);
    const removed = controllerChanges.filter(c => c.type === ChangeType.REMOVED);
    const modified = controllerChanges.filter(c => c.type === ChangeType.MODIFIED);

    if (added.length > 0) {
        added.forEach(change => {
            changelog += generateControllerSection(change);
        });
    }

    if (modified.length > 0) {
        modified.forEach(change => {
            changelog += generateControllerSection(change);
        });
    }

    if (removed.length > 0) {
        removed.forEach(change => {
            changelog += generateControllerSection(change);
        });
    }

    return changelog;
};
