import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
export const show = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/updates/operations/{operation}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
show.url = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { operation: args };
    }

    if (Array.isArray(args)) {
        args = {
            operation: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        operation: args.operation,
    };

    return (
        show.definition.url
            .replace('{operation}', parsedArgs.operation.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
show.get = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
show.head = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
const showForm = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
showForm.get = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::show
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
showForm.head = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;

const operations = {
    show: Object.assign(show, show),
};

export default operations;
