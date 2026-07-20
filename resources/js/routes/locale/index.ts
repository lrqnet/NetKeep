import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
export const update = (
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
});

update.definition = {
    methods: ['put'],
    url: '/locale',
} satisfies RouteDefinition<['put']>;

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
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
 * @see \App\Http\Controllers\LocaleController::__invoke
 * @see Http/Controllers/LocaleController.php:14
 * @route '/locale'
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

const locale = {
    update: Object.assign(update, update),
};

export default locale;
