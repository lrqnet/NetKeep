import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
const LocaleController = (
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: LocaleController.url(options),
    method: 'put',
});

LocaleController.definition = {
    methods: ['put'],
    url: '/locale',
} satisfies RouteDefinition<['put']>;

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
LocaleController.url = (options?: RouteQueryOptions) => {
    return LocaleController.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
LocaleController.put = (
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: LocaleController.url(options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
const LocaleControllerForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: LocaleController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
LocaleControllerForm.put = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: LocaleController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

LocaleController.form = LocaleControllerForm;

export default LocaleController;
