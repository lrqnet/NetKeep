import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/setup',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
 */
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
 */
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\SetupController::show
 * @see Http/Controllers/SetupController.php:18
 * @route '/setup'
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
 * @see \App\Http\Controllers\SetupController::store
 * @see Http/Controllers/SetupController.php:32
 * @route '/setup'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/setup',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\SetupController::store
 * @see Http/Controllers/SetupController.php:32
 * @route '/setup'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\SetupController::store
 * @see Http/Controllers/SetupController.php:32
 * @route '/setup'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\SetupController::store
 * @see Http/Controllers/SetupController.php:32
 * @route '/setup'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\SetupController::store
 * @see Http/Controllers/SetupController.php:32
 * @route '/setup'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

const setup = {
    show: Object.assign(show, show),
    store: Object.assign(store, store),
};

export default setup;
