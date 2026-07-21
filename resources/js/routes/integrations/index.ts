import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
import inventory from './inventory';
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

const integrations = {
    index: Object.assign(index, index),
    inventory: Object.assign(inventory, inventory),
};

export default integrations;
