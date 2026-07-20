import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
export const ask = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ask.url(options),
    method: 'get',
});

ask.definition = {
    methods: ['get', 'head'],
    url: '/internal/caddy/ask',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
ask.url = (options?: RouteQueryOptions) => {
    return ask.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
ask.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ask.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
ask.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ask.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
const askForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ask.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
askForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ask.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\Internal\CaddyDomainController::__invoke
 * @see Http/Controllers/Internal/CaddyDomainController.php:12
 * @route '/internal/caddy/ask'
 */
askForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ask.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

ask.form = askForm;

const caddy = {
    ask: Object.assign(ask, ask),
};

export default caddy;
