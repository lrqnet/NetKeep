import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\DangerousFeatureController::update
 * @see Http/Controllers/DangerousFeatureController.php:14
 * @route '/system/dangerous-features/{feature}'
 */
export const update = (
    args:
        | { feature: string | number }
        | [feature: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

update.definition = {
    methods: ['patch'],
    url: '/system/dangerous-features/{feature}',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\DangerousFeatureController::update
 * @see Http/Controllers/DangerousFeatureController.php:14
 * @route '/system/dangerous-features/{feature}'
 */
update.url = (
    args:
        | { feature: string | number }
        | [feature: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { feature: args };
    }

    if (Array.isArray(args)) {
        args = {
            feature: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        feature: args.feature,
    };

    return (
        update.definition.url
            .replace('{feature}', parsedArgs.feature.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DangerousFeatureController::update
 * @see Http/Controllers/DangerousFeatureController.php:14
 * @route '/system/dangerous-features/{feature}'
 */
update.patch = (
    args:
        | { feature: string | number }
        | [feature: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\DangerousFeatureController::update
 * @see Http/Controllers/DangerousFeatureController.php:14
 * @route '/system/dangerous-features/{feature}'
 */
const updateForm = (
    args:
        | { feature: string | number }
        | [feature: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DangerousFeatureController::update
 * @see Http/Controllers/DangerousFeatureController.php:14
 * @route '/system/dangerous-features/{feature}'
 */
updateForm.patch = (
    args:
        | { feature: string | number }
        | [feature: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

update.form = updateForm;

const DangerousFeatureController = { update };

export default DangerousFeatureController;
