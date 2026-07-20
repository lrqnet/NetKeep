import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
const AuditController = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: AuditController.url(options),
    method: 'get',
});

AuditController.definition = {
    methods: ['get', 'head'],
    url: '/audit',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
AuditController.url = (options?: RouteQueryOptions) => {
    return AuditController.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
AuditController.get = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: AuditController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
AuditController.head = (
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: AuditController.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
const AuditControllerForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: AuditController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
AuditControllerForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: AuditController.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\AuditController::__invoke
 * @see Http/Controllers/AuditController.php:12
 * @route '/audit'
 */
AuditControllerForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: AuditController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

AuditController.form = AuditControllerForm;

export default AuditController;
