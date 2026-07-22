import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/users',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\UserController::index
 * @see Http/Controllers/UserController.php:24
 * @route '/users'
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
 * @see \App\Http\Controllers\UserController::store
 * @see Http/Controllers/UserController.php:37
 * @route '/users'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/users',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\UserController::store
 * @see Http/Controllers/UserController.php:37
 * @route '/users'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\UserController::store
 * @see Http/Controllers/UserController.php:37
 * @route '/users'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UserController::store
 * @see Http/Controllers/UserController.php:37
 * @route '/users'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UserController::store
 * @see Http/Controllers/UserController.php:37
 * @route '/users'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
export const update = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

update.definition = {
    methods: ['put', 'patch'],
    url: '/users/{user}',
} satisfies RouteDefinition<['put', 'patch']>;

/**
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
update.url = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { user: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            user: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        user: typeof args.user === 'object' ? args.user.id : args.user,
    };

    return (
        update.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
update.put = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
update.patch = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
const updateForm = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
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
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
updateForm.put = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
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
 * @see \App\Http\Controllers\UserController::update
 * @see Http/Controllers/UserController.php:61
 * @route '/users/{user}'
 */
updateForm.patch = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
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
 * @see \App\Http\Controllers\UserController::transferOwnership
 * @see Http/Controllers/UserController.php:108
 * @route '/users/{user}/transfer-ownership'
 */
export const transferOwnership = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: transferOwnership.url(args, options),
    method: 'post',
});

transferOwnership.definition = {
    methods: ['post'],
    url: '/users/{user}/transfer-ownership',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\UserController::transferOwnership
 * @see Http/Controllers/UserController.php:108
 * @route '/users/{user}/transfer-ownership'
 */
transferOwnership.url = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { user: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            user: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        user: typeof args.user === 'object' ? args.user.id : args.user,
    };

    return (
        transferOwnership.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\UserController::transferOwnership
 * @see Http/Controllers/UserController.php:108
 * @route '/users/{user}/transfer-ownership'
 */
transferOwnership.post = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: transferOwnership.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UserController::transferOwnership
 * @see Http/Controllers/UserController.php:108
 * @route '/users/{user}/transfer-ownership'
 */
const transferOwnershipForm = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: transferOwnership.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\UserController::transferOwnership
 * @see Http/Controllers/UserController.php:108
 * @route '/users/{user}/transfer-ownership'
 */
transferOwnershipForm.post = (
    args:
        | { user: number | { id: number } }
        | [user: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: transferOwnership.url(args, options),
    method: 'post',
});

transferOwnership.form = transferOwnershipForm;

const users = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    transferOwnership: Object.assign(transferOwnership, transferOwnership),
};

export default users;
