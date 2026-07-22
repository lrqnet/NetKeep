import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/tls-activation',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::show
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
export const status = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
});

status.definition = {
    methods: ['get', 'head'],
    url: '/tls-activation/status',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
const statusForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::status
 * @see Http/Controllers/TlsActivationController.php:26
 * @route '/tls-activation/status'
 */
statusForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: status.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

status.form = statusForm;

const TlsActivationController = { show, status };

export default TlsActivationController;
