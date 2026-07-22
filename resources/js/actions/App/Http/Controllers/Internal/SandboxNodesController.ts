import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
const SandboxNodesController = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: SandboxNodesController.url(options),
    method: 'get',
});

SandboxNodesController.definition = {
    methods: ['get', 'head'],
    url: '/internal/oxidized/sandbox-nodes',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
SandboxNodesController.url = (options?: RouteQueryOptions) => {
    return SandboxNodesController.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
SandboxNodesController.get = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: SandboxNodesController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
SandboxNodesController.head = (
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: SandboxNodesController.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
const SandboxNodesControllerForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: SandboxNodesController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
SandboxNodesControllerForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: SandboxNodesController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\SandboxNodesController::__invoke
 * @see Http/Controllers/Internal/SandboxNodesController.php:18
 * @route '/internal/oxidized/sandbox-nodes'
 */
SandboxNodesControllerForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: SandboxNodesController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

SandboxNodesController.form = SandboxNodesControllerForm;

export default SandboxNodesController;
