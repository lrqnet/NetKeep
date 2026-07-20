import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../../wayfinder';
/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
const CaddyDomainController = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: CaddyDomainController.url(options),
    method: 'get',
});

CaddyDomainController.definition = {
    methods: ['get', 'head'],
    url: '/internal/caddy/ask',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
CaddyDomainController.url = (options?: RouteQueryOptions) => {
    return CaddyDomainController.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
CaddyDomainController.get = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: CaddyDomainController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
CaddyDomainController.head = (
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: CaddyDomainController.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
const CaddyDomainControllerForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: CaddyDomainController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
CaddyDomainControllerForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: CaddyDomainController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
CaddyDomainControllerForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: CaddyDomainController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

CaddyDomainController.form = CaddyDomainControllerForm;

export default CaddyDomainController;
