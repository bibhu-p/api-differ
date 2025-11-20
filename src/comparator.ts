import { ApiController, ApiEndpoint } from './parser';

/**
 * Represents a change type
 */
export enum ChangeType {
    ADDED = 'ADDED',
    REMOVED = 'REMOVED',
    MODIFIED = 'MODIFIED',
}

/**
 * Represents a change in an endpoint
 */
export interface EndpointChange {
    type: ChangeType;
    endpoint: ApiEndpoint;
    oldEndpoint?: ApiEndpoint;
    changes?: string[];
}

/**
 * Represents a change in a controller
 */
export interface ControllerChange {
    type: ChangeType;
    controller: ApiController;
    oldController?: ApiController;
    endpointChanges: EndpointChange[];
}

/**
 * Represents the complete API diff
 */
export interface ApiDiff {
    controllerChanges: ControllerChange[];
    summary: {
        controllersAdded: number;
        controllersRemoved: number;
        controllersModified: number;
        endpointsAdded: number;
        endpointsRemoved: number;
        endpointsModified: number;
    };
}

/**
 * Create a unique key for an endpoint
 */
const getEndpointKey = (endpoint: ApiEndpoint, basePath: string): string => {
    const fullPath = `${basePath}/${endpoint.path}`.replace(/\/+/g, '/');
    return `${endpoint.method}:${fullPath}`;
};

/**
 * Compare two endpoints and detect changes
 */
const compareEndpoints = (oldEndpoint: ApiEndpoint, newEndpoint: ApiEndpoint): string[] => {
    const changes: string[] = [];

    // Check method name change
    if (oldEndpoint.methodName !== newEndpoint.methodName) {
        changes.push(`Method name changed from '${oldEndpoint.methodName}' to '${newEndpoint.methodName}'`);
    }

    // Check parameters
    const oldParams = oldEndpoint.parameters.map(p => `${p.name}:${p.type}`).join(', ');
    const newParams = newEndpoint.parameters.map(p => `${p.name}:${p.type}`).join(', ');

    if (oldParams !== newParams) {
        changes.push(`Parameters changed from (${oldParams}) to (${newParams})`);
    }

    return changes;
};

/**
 * Compare endpoints within a controller
 */
const compareControllerEndpoints = (
    oldController: ApiController,
    newController: ApiController
): EndpointChange[] => {
    const changes: EndpointChange[] = [];

    // Create maps for easy lookup
    const oldEndpointMap = new Map<string, ApiEndpoint>();
    const newEndpointMap = new Map<string, ApiEndpoint>();

    oldController.endpoints.forEach(ep => {
        oldEndpointMap.set(getEndpointKey(ep, oldController.basePath), ep);
    });

    newController.endpoints.forEach(ep => {
        newEndpointMap.set(getEndpointKey(ep, newController.basePath), ep);
    });

    // Find added endpoints
    for (const [key, endpoint] of newEndpointMap) {
        if (!oldEndpointMap.has(key)) {
            changes.push({
                type: ChangeType.ADDED,
                endpoint,
            });
        }
    }

    // Find removed endpoints
    for (const [key, endpoint] of oldEndpointMap) {
        if (!newEndpointMap.has(key)) {
            changes.push({
                type: ChangeType.REMOVED,
                endpoint,
            });
        }
    }

    // Find modified endpoints
    for (const [key, newEndpoint] of newEndpointMap) {
        const oldEndpoint = oldEndpointMap.get(key);
        if (oldEndpoint) {
            const endpointChanges = compareEndpoints(oldEndpoint, newEndpoint);
            if (endpointChanges.length > 0) {
                changes.push({
                    type: ChangeType.MODIFIED,
                    endpoint: newEndpoint,
                    oldEndpoint,
                    changes: endpointChanges,
                });
            }
        }
    }

    return changes;
};

/**
 * Compare two sets of API controllers
 */
export const compareApis = (
    oldControllers: ApiController[],
    newControllers: ApiController[]
): ApiDiff => {
    const controllerChanges: ControllerChange[] = [];

    // Create maps for easy lookup
    const oldControllerMap = new Map<string, ApiController>();
    const newControllerMap = new Map<string, ApiController>();

    oldControllers.forEach(ctrl => {
        oldControllerMap.set(ctrl.name, ctrl);
    });

    newControllers.forEach(ctrl => {
        newControllerMap.set(ctrl.name, ctrl);
    });

    // Find added controllers
    for (const [name, controller] of newControllerMap) {
        if (!oldControllerMap.has(name)) {
            controllerChanges.push({
                type: ChangeType.ADDED,
                controller,
                endpointChanges: controller.endpoints.map(ep => ({
                    type: ChangeType.ADDED,
                    endpoint: ep,
                })),
            });
        }
    }

    // Find removed controllers
    for (const [name, controller] of oldControllerMap) {
        if (!newControllerMap.has(name)) {
            controllerChanges.push({
                type: ChangeType.REMOVED,
                controller,
                endpointChanges: controller.endpoints.map(ep => ({
                    type: ChangeType.REMOVED,
                    endpoint: ep,
                })),
            });
        }
    }

    // Find modified controllers
    for (const [name, newController] of newControllerMap) {
        const oldController = oldControllerMap.get(name);
        if (oldController) {
            const endpointChanges = compareControllerEndpoints(oldController, newController);

            if (endpointChanges.length > 0) {
                controllerChanges.push({
                    type: ChangeType.MODIFIED,
                    controller: newController,
                    oldController,
                    endpointChanges,
                });
            }
        }
    }

    // Calculate summary
    const summary = {
        controllersAdded: controllerChanges.filter(c => c.type === ChangeType.ADDED).length,
        controllersRemoved: controllerChanges.filter(c => c.type === ChangeType.REMOVED).length,
        controllersModified: controllerChanges.filter(c => c.type === ChangeType.MODIFIED).length,
        endpointsAdded: controllerChanges.reduce((sum, c) =>
            sum + c.endpointChanges.filter(e => e.type === ChangeType.ADDED).length, 0),
        endpointsRemoved: controllerChanges.reduce((sum, c) =>
            sum + c.endpointChanges.filter(e => e.type === ChangeType.REMOVED).length, 0),
        endpointsModified: controllerChanges.reduce((sum, c) =>
            sum + c.endpointChanges.filter(e => e.type === ChangeType.MODIFIED).length, 0),
    };

    return {
        controllerChanges,
        summary,
    };
};
