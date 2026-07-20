import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/data-protection',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::index
 * @see Http/Controllers/DataProtectionController.php:20
 * @route '/data-protection'
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
 * @see \App\Http\Controllers\DataProtectionController::store
 * @see Http/Controllers/DataProtectionController.php:60
 * @route '/data-protection/destinations'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/data-protection/destinations',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::store
 * @see Http/Controllers/DataProtectionController.php:60
 * @route '/data-protection/destinations'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DataProtectionController::store
 * @see Http/Controllers/DataProtectionController.php:60
 * @route '/data-protection/destinations'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::store
 * @see Http/Controllers/DataProtectionController.php:60
 * @route '/data-protection/destinations'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::store
 * @see Http/Controllers/DataProtectionController.php:60
 * @route '/data-protection/destinations'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\DataProtectionController::update
 * @see Http/Controllers/DataProtectionController.php:103
 * @route '/data-protection/destinations/{destination}'
 */
export const update = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

update.definition = {
    methods: ['patch'],
    url: '/data-protection/destinations/{destination}',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::update
 * @see Http/Controllers/DataProtectionController.php:103
 * @route '/data-protection/destinations/{destination}'
 */
update.url = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { destination: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { destination: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            destination: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        destination:
            typeof args.destination === 'object'
                ? args.destination.id
                : args.destination,
    };

    return (
        update.definition.url
            .replace('{destination}', parsedArgs.destination.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DataProtectionController::update
 * @see Http/Controllers/DataProtectionController.php:103
 * @route '/data-protection/destinations/{destination}'
 */
update.patch = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::update
 * @see Http/Controllers/DataProtectionController.php:103
 * @route '/data-protection/destinations/{destination}'
 */
const updateForm = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
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

/**
 * @see \App\Http\Controllers\DataProtectionController::update
 * @see Http/Controllers/DataProtectionController.php:103
 * @route '/data-protection/destinations/{destination}'
 */
updateForm.patch = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
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
 * @see \App\Http\Controllers\DataProtectionController::runBackup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
export const runBackup = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: runBackup.url(args, options),
    method: 'post',
});

runBackup.definition = {
    methods: ['post'],
    url: '/data-protection/destinations/{destination}/backup',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::runBackup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
runBackup.url = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { destination: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { destination: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            destination: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        destination:
            typeof args.destination === 'object'
                ? args.destination.id
                : args.destination,
    };

    return (
        runBackup.definition.url
            .replace('{destination}', parsedArgs.destination.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DataProtectionController::runBackup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
runBackup.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: runBackup.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::runBackup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
const runBackupForm = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: runBackup.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::runBackup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
runBackupForm.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: runBackup.url(args, options),
    method: 'post',
});

runBackup.form = runBackupForm;

/**
 * @see \App\Http\Controllers\DataProtectionController::mirrorGit
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
export const mirrorGit = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: mirrorGit.url(args, options),
    method: 'post',
});

mirrorGit.definition = {
    methods: ['post'],
    url: '/data-protection/destinations/{destination}/mirror',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::mirrorGit
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
mirrorGit.url = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { destination: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { destination: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            destination: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        destination:
            typeof args.destination === 'object'
                ? args.destination.id
                : args.destination,
    };

    return (
        mirrorGit.definition.url
            .replace('{destination}', parsedArgs.destination.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DataProtectionController::mirrorGit
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
mirrorGit.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: mirrorGit.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::mirrorGit
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
const mirrorGitForm = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: mirrorGit.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::mirrorGit
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
mirrorGitForm.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: mirrorGit.url(args, options),
    method: 'post',
});

mirrorGit.form = mirrorGitForm;

const DataProtectionController = { index, store, update, runBackup, mirrorGit };

export default DataProtectionController;
