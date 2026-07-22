import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/restore',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\RestoreRequestController::index
 * @see Http/Controllers/RestoreRequestController.php:19
 * @route '/restore'
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

/**
 * @see \App\Http\Controllers\RestoreRequestController::store
 * @see Http/Controllers/RestoreRequestController.php:31
 * @route '/restore'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/restore',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\RestoreRequestController::store
 * @see Http/Controllers/RestoreRequestController.php:31
 * @route '/restore'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\RestoreRequestController::store
 * @see Http/Controllers/RestoreRequestController.php:31
 * @route '/restore'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\RestoreRequestController::store
 * @see Http/Controllers/RestoreRequestController.php:31
 * @route '/restore'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\RestoreRequestController::store
 * @see Http/Controllers/RestoreRequestController.php:31
 * @route '/restore'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

const RestoreRequestController = { index, store };

export default RestoreRequestController;
