import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
import destinations from './destinations';
/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/data-protection',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

index.form = indexForm;

const dataProtection = {
    index: Object.assign(index, index),
    destinations: Object.assign(destinations, destinations),
};

export default dataProtection;
