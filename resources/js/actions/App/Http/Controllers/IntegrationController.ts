import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/integrations',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\IntegrationController::index
 * @see Http/Controllers/IntegrationController.php:17
 * @route '/integrations'
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
 * @see \App\Http\Controllers\IntegrationController::storeInventory
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
export const storeInventory = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: storeInventory.url(options),
    method: 'post',
});

storeInventory.definition = {
    methods: ['post'],
    url: '/integrations/inventory',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\IntegrationController::storeInventory
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
storeInventory.url = (options?: RouteQueryOptions) => {
    return storeInventory.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\IntegrationController::storeInventory
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
storeInventory.post = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: storeInventory.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::storeInventory
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
const storeInventoryForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: storeInventory.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::storeInventory
 * @see Http/Controllers/IntegrationController.php:34
 * @route '/integrations/inventory'
 */
storeInventoryForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: storeInventory.url(options),
    method: 'post',
});

storeInventory.form = storeInventoryForm;

/**
 * @see \App\Http\Controllers\IntegrationController::syncInventory
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
export const syncInventory = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: syncInventory.url(args, options),
    method: 'post',
});

syncInventory.definition = {
    methods: ['post'],
    url: '/integrations/inventory/{source}/sync',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\IntegrationController::syncInventory
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
syncInventory.url = (
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
        syncInventory.definition.url
            .replace('{source}', parsedArgs.source.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\IntegrationController::syncInventory
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
syncInventory.post = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: syncInventory.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::syncInventory
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
const syncInventoryForm = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: syncInventory.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\IntegrationController::syncInventory
 * @see Http/Controllers/IntegrationController.php:58
 * @route '/integrations/inventory/{source}/sync'
 */
syncInventoryForm.post = (
    args:
        | { source: number | { id: number } }
        | [source: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: syncInventory.url(args, options),
    method: 'post',
});

syncInventory.form = syncInventoryForm;

const IntegrationController = { index, storeInventory, syncInventory };

export default IntegrationController;
