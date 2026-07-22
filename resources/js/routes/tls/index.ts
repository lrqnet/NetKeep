import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
export const activation = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: activation.url(options),
    method: 'get',
});

activation.definition = {
    methods: ['get', 'head'],
    url: '/tls-activation',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
activation.url = (options?: RouteQueryOptions) => {
    return activation.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
activation.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: activation.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
activation.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: activation.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
const activationForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: activation.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
activationForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: activation.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\TlsActivationController::activation
 * @see Http/Controllers/TlsActivationController.php:14
 * @route '/tls-activation'
 */
activationForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: activation.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

activation.form = activationForm;

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

const tls = {
    activation: Object.assign(activation, activation),
    status: Object.assign(status, status),
};

export default tls;
