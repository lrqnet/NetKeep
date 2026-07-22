import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:28
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
 * @see Http/Controllers/UpdateController.php:28
 * @route '/updates'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:28
 * @route '/updates'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:28
 * @route '/updates'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:28
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
 * @see Http/Controllers/UpdateController.php:28
 * @route '/updates'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::index
 * @see Http/Controllers/UpdateController.php:28
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
 * @see \App\Http\Controllers\UpdateController::check
 * @see Http/Controllers/UpdateController.php:60
 * @route '/updates/check'
 */
export const check = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: check.url(options),
    method: 'post',
});

check.definition = {
    methods: ['post'],
    url: '/updates/check',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\UpdateController::check
 * @see Http/Controllers/UpdateController.php:60
 * @route '/updates/check'
 */
check.url = (options?: RouteQueryOptions) => {
    return check.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::check
 * @see Http/Controllers/UpdateController.php:60
 * @route '/updates/check'
 */
check.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: check.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::check
 * @see Http/Controllers/UpdateController.php:60
 * @route '/updates/check'
 */
const checkForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: check.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::check
 * @see Http/Controllers/UpdateController.php:60
 * @route '/updates/check'
 */
checkForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: check.url(options),
    method: 'post',
});

check.form = checkForm;

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:74
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
 * @see Http/Controllers/UpdateController.php:74
 * @route '/updates/settings'
 */
settings.url = (options?: RouteQueryOptions) => {
    return settings.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:74
 * @route '/updates/settings'
 */
settings.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: settings.url(options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\UpdateController::settings
 * @see Http/Controllers/UpdateController.php:74
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
 * @see Http/Controllers/UpdateController.php:74
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
 * @see Http/Controllers/UpdateController.php:116
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
 * @see Http/Controllers/UpdateController.php:116
 * @route '/updates/run'
 */
run.url = (options?: RouteQueryOptions) => {
    return run.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:116
 * @route '/updates/run'
 */
run.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: run.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:116
 * @route '/updates/run'
 */
const runForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: run.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UpdateController::run
 * @see Http/Controllers/UpdateController.php:116
 * @route '/updates/run'
 */
runForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: run.url(options),
    method: 'post',
});

run.form = runForm;

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
export const operation = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: operation.url(args, options),
    method: 'get',
});

operation.definition = {
    methods: ['get', 'head'],
    url: '/updates/operations/{operation}',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
operation.url = (
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
        operation.definition.url
            .replace('{operation}', parsedArgs.operation.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
operation.get = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: operation.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
operation.head = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: operation.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
const operationForm = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: operation.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
operationForm.get = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: operation.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UpdateController::operation
 * @see Http/Controllers/UpdateController.php:151
 * @route '/updates/operations/{operation}'
 */
operationForm.head = (
    args:
        | { operation: string | number }
        | [operation: string | number]
        | string
        | number,
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: operation.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

operation.form = operationForm;

const UpdateController = { index, check, settings, run, operation };

export default UpdateController;
