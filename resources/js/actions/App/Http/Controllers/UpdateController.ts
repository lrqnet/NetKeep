import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/updates',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:19
 * @route '/updates'
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
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:37
 * @route '/updates/settings'
 */
export const settings = (
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: settings.url(options),
    method: 'put',
});

settings.definition = {
    methods: ['put'],
    url: '/updates/settings',
} satisfies RouteDefinition<['put']>;

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:37
 * @route '/updates/settings'
 */
settings.url = (options?: RouteQueryOptions) => {
    return settings.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:37
 * @route '/updates/settings'
 */
settings.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: settings.url(options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:37
 * @route '/updates/settings'
 */
const settingsForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: settings.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:37
 * @route '/updates/settings'
 */
settingsForm.put = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: settings.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

settings.form = settingsForm;

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:56
 * @route '/updates/run'
 */
export const run = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
});

run.definition = {
    methods: ['post'],
    url: '/updates/run',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:56
 * @route '/updates/run'
 */
run.url = (options?: RouteQueryOptions) => {
    return run.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:56
 * @route '/updates/run'
 */
run.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:56
 * @route '/updates/run'
 */
const runForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: run.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:56
 * @route '/updates/run'
 */
runForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: run.url(options),
    method: 'post',
});

run.form = runForm;

const UpdateController = { index, settings, run };

export default UpdateController;
