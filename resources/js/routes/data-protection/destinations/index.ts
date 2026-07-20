import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
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
 * @see \App\Http\Controllers\DataProtectionController::backup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
export const backup = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: backup.url(args, options),
    method: 'post',
});

backup.definition = {
    methods: ['post'],
    url: '/data-protection/destinations/{destination}/backup',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::backup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
backup.url = (
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
        backup.definition.url
            .replace('{destination}', parsedArgs.destination.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DataProtectionController::backup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
backup.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: backup.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::backup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
const backupForm = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: backup.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::backup
 * @see Http/Controllers/DataProtectionController.php:119
 * @route '/data-protection/destinations/{destination}/backup'
 */
backupForm.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: backup.url(args, options),
    method: 'post',
});

backup.form = backupForm;

/**
 * @see \App\Http\Controllers\DataProtectionController::mirror
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
export const mirror = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: mirror.url(args, options),
    method: 'post',
});

mirror.definition = {
    methods: ['post'],
    url: '/data-protection/destinations/{destination}/mirror',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DataProtectionController::mirror
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
mirror.url = (
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
        mirror.definition.url
            .replace('{destination}', parsedArgs.destination.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DataProtectionController::mirror
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
mirror.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: mirror.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::mirror
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
const mirrorForm = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: mirror.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DataProtectionController::mirror
 * @see Http/Controllers/DataProtectionController.php:129
 * @route '/data-protection/destinations/{destination}/mirror'
 */
mirrorForm.post = (
    args:
        | { destination: number | { id: number } }
        | [destination: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: mirror.url(args, options),
    method: 'post',
});

mirror.form = mirrorForm;

const destinations = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    backup: Object.assign(backup, backup),
    mirror: Object.assign(mirror, mirror),
};

export default destinations;
