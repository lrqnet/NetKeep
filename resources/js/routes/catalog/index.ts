import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/catalog',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CatalogController::index
 * @see Http/Controllers/CatalogController.php:20
 * @route '/catalog'
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
 * @see \App\Http\Controllers\CatalogController::store
 * @see Http/Controllers/CatalogController.php:34
 * @route '/catalog'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/catalog',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\CatalogController::store
 * @see Http/Controllers/CatalogController.php:34
 * @route '/catalog'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CatalogController::store
 * @see Http/Controllers/CatalogController.php:34
 * @route '/catalog'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CatalogController::store
 * @see Http/Controllers/CatalogController.php:34
 * @route '/catalog'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CatalogController::store
 * @see Http/Controllers/CatalogController.php:34
 * @route '/catalog'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\CatalogController::destroy
 * @see Http/Controllers/CatalogController.php:76
 * @route '/catalog/{kind}/{id}'
 */
export const destroy = (
    args:
        | { kind: string | number; id: string | number }
        | [kind: string | number, id: string | number],
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/catalog/{kind}/{id}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\CatalogController::destroy
 * @see Http/Controllers/CatalogController.php:76
 * @route '/catalog/{kind}/{id}'
 */
destroy.url = (
    args:
        | { kind: string | number; id: string | number }
        | [kind: string | number, id: string | number],
    options?: RouteQueryOptions,
) => {
    if (Array.isArray(args)) {
        args = {
            kind: args[0],
            id: args[1],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        kind: args.kind,
        id: args.id,
    };

    return (
        destroy.definition.url
            .replace('{kind}', parsedArgs.kind.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CatalogController::destroy
 * @see Http/Controllers/CatalogController.php:76
 * @route '/catalog/{kind}/{id}'
 */
destroy.delete = (
    args:
        | { kind: string | number; id: string | number }
        | [kind: string | number, id: string | number],
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\CatalogController::destroy
 * @see Http/Controllers/CatalogController.php:76
 * @route '/catalog/{kind}/{id}'
 */
const destroyForm = (
    args:
        | { kind: string | number; id: string | number }
        | [kind: string | number, id: string | number],
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
 * @see \App\Http\Controllers\CatalogController::destroy
 * @see Http/Controllers/CatalogController.php:76
 * @route '/catalog/{kind}/{id}'
 */
destroyForm.delete = (
    args:
        | { kind: string | number; id: string | number }
        | [kind: string | number, id: string | number],
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

const catalog = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
};

export default catalog;
