import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/system',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\SystemSettingsController::index
 * @see Http/Controllers/SystemSettingsController.php:26
 * @route '/system'
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
 * @see \App\Http\Controllers\SystemSettingsController::update
 * @see Http/Controllers/SystemSettingsController.php:51
 * @route '/system'
 */
export const update = (
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
});

update.definition = {
    methods: ['put'],
    url: '/system',
} satisfies RouteDefinition<['put']>;

/**
 * @see \App\Http\Controllers\SystemSettingsController::update
 * @see Http/Controllers/SystemSettingsController.php:51
 * @route '/system'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\SystemSettingsController::update
 * @see Http/Controllers/SystemSettingsController.php:51
 * @route '/system'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\SystemSettingsController::update
 * @see Http/Controllers/SystemSettingsController.php:51
 * @route '/system'
 */
const updateForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\SystemSettingsController::update
 * @see Http/Controllers/SystemSettingsController.php:51
 * @route '/system'
 */
updateForm.put = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

update.form = updateForm;

const SystemSettingsController = { index, update };

export default SystemSettingsController;
