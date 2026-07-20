import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
const OxidizedNodesController = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: OxidizedNodesController.url(options),
    method: 'get',
});

OxidizedNodesController.definition = {
    methods: ['get', 'head'],
    url: '/internal/oxidized/nodes',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
OxidizedNodesController.url = (options?: RouteQueryOptions) => {
    return OxidizedNodesController.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
OxidizedNodesController.get = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: OxidizedNodesController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
OxidizedNodesController.head = (
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: OxidizedNodesController.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
const OxidizedNodesControllerForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: OxidizedNodesController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
OxidizedNodesControllerForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: OxidizedNodesController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\OxidizedNodesController::__invoke
 * @see Http/Controllers/Internal/OxidizedNodesController.php:12
 * @route '/internal/oxidized/nodes'
 */
OxidizedNodesControllerForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: OxidizedNodesController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

OxidizedNodesController.form = OxidizedNodesControllerForm;

export default OxidizedNodesController;
