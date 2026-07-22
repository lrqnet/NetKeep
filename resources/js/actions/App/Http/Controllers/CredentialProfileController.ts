import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/credentials',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::index
 * @see Http/Controllers/CredentialProfileController.php:19
 * @route '/credentials'
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
 * @see \App\Http\Controllers\CredentialProfileController::store
 * @see Http/Controllers/CredentialProfileController.php:40
 * @route '/credentials'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/credentials',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\CredentialProfileController::store
 * @see Http/Controllers/CredentialProfileController.php:40
 * @route '/credentials'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CredentialProfileController::store
 * @see Http/Controllers/CredentialProfileController.php:40
 * @route '/credentials'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::store
 * @see Http/Controllers/CredentialProfileController.php:40
 * @route '/credentials'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::store
 * @see Http/Controllers/CredentialProfileController.php:40
 * @route '/credentials'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
export const update = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

update.definition = {
    methods: ['put', 'patch'],
    url: '/credentials/{credential}',
} satisfies RouteDefinition<['put', 'patch']>;

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
update.url = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { credential: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { credential: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            credential: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        credential:
            typeof args.credential === 'object'
                ? args.credential.id
                : args.credential,
    };

    return (
        update.definition.url
            .replace('{credential}', parsedArgs.credential.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
update.put = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
update.patch = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
const updateForm = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
updateForm.put = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::update
 * @see Http/Controllers/CredentialProfileController.php:55
 * @route '/credentials/{credential}'
 */
updateForm.patch = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
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

/**
 * @see \App\Http\Controllers\CredentialProfileController::destroy
 * @see Http/Controllers/CredentialProfileController.php:115
 * @route '/credentials/{credential}'
 */
export const destroy = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/credentials/{credential}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\CredentialProfileController::destroy
 * @see Http/Controllers/CredentialProfileController.php:115
 * @route '/credentials/{credential}'
 */
destroy.url = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { credential: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { credential: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            credential: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        credential:
            typeof args.credential === 'object'
                ? args.credential.id
                : args.credential,
    };

    return (
        destroy.definition.url
            .replace('{credential}', parsedArgs.credential.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CredentialProfileController::destroy
 * @see Http/Controllers/CredentialProfileController.php:115
 * @route '/credentials/{credential}'
 */
destroy.delete = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::destroy
 * @see Http/Controllers/CredentialProfileController.php:115
 * @route '/credentials/{credential}'
 */
const destroyForm = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CredentialProfileController::destroy
 * @see Http/Controllers/CredentialProfileController.php:115
 * @route '/credentials/{credential}'
 */
destroyForm.delete = (
    args:
        | { credential: number | { id: number } }
        | [credential: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'post',
});

destroy.form = destroyForm;

const CredentialProfileController = { index, store, update, destroy };

export default CredentialProfileController;
