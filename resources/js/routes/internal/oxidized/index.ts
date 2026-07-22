import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
export const nodes = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: nodes.url(options),
    method: 'get',
});

nodes.definition = {
    methods: ['get', 'head'],
    url: '/internal/oxidized/nodes',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
nodes.url = (options?: RouteQueryOptions) => {
    return nodes.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
nodes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: nodes.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
nodes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: nodes.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
const nodesForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: nodes.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
nodesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: nodes.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:15
 * @route '/internal/oxidized/nodes'
 */
nodesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: nodes.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

nodes.form = nodesForm;

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
export const sandboxNodes = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: sandboxNodes.url(options),
    method: 'get',
});

sandboxNodes.definition = {
    methods: ['get', 'head'],
    url: '/internal/oxidized/sandbox-nodes',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
sandboxNodes.url = (options?: RouteQueryOptions) => {
    return sandboxNodes.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
sandboxNodes.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sandboxNodes.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
sandboxNodes.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: sandboxNodes.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
const sandboxNodesForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: sandboxNodes.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
sandboxNodesForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: sandboxNodes.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
sandboxNodesForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: sandboxNodes.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

sandboxNodes.form = sandboxNodesForm;

const oxidized = {
    nodes: Object.assign(nodes, nodes),
    sandboxNodes: Object.assign(sandboxNodes, sandboxNodes),
};

export default oxidized;
