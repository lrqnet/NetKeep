import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\IntegrationController::store
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/integrations/inventory',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\IntegrationController::store
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\IntegrationController::store
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::store
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::store
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\IntegrationController::sync
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
export const sync = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: sync.url(args, options),
    method: 'post',
});

sync.definition = {
    methods: ['post'],
    url: '/integrations/inventory/{source}/sync',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\IntegrationController::sync
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
sync.url = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { source: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { source: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            source: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        source: typeof args.source === 'object' ? args.source.id : args.source,
    };

    return (
        sync.definition.url
            .replace('{source}', parsedArgs.source.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\IntegrationController::sync
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
sync.post = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: sync.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::sync
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
const syncForm = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: sync.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::sync
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
syncForm.post = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: sync.url(args, options),
    method: 'post',
});

sync.form = syncForm;

const inventory = {
    store: Object.assign(store, store),
    sync: Object.assign(sync, sync),
};

export default inventory;
