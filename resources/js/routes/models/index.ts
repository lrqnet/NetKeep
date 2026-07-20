import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/models',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\CustomModelController::index
 * @see Http/Controllers/CustomModelController.php:21
 * @route '/models'
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
 * @see \App\Http\Controllers\CustomModelController::store
 * @see Http/Controllers/CustomModelController.php:38
 * @route '/models'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/models',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\CustomModelController::store
 * @see Http/Controllers/CustomModelController.php:38
 * @route '/models'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\CustomModelController::store
 * @see Http/Controllers/CustomModelController.php:38
 * @route '/models'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CustomModelController::store
 * @see Http/Controllers/CustomModelController.php:38
 * @route '/models'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CustomModelController::store
 * @see Http/Controllers/CustomModelController.php:38
 * @route '/models'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
export const update = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

update.definition = {
    methods: ['put', 'patch'],
    url: '/models/{model}',
} satisfies RouteDefinition<['put', 'patch']>;

/**
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
update.url = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { model: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { model: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            model: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        model: typeof args.model === 'object' ? args.model.id : args.model,
    };

    return (
        update.definition.url
            .replace('{model}', parsedArgs.model.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
update.put = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
update.patch = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
const updateForm = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
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
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
updateForm.put = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
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
 * @see \App\Http\Controllers\CustomModelController::update
 * @see Http/Controllers/CustomModelController.php:77
 * @route '/models/{model}'
 */
updateForm.patch = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
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
 * @see \App\Http\Controllers\CustomModelController::destroy
 * @see Http/Controllers/CustomModelController.php:170
 * @route '/models/{model}'
 */
export const destroy = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/models/{model}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\CustomModelController::destroy
 * @see Http/Controllers/CustomModelController.php:170
 * @route '/models/{model}'
 */
destroy.url = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { model: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { model: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            model: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        model: typeof args.model === 'object' ? args.model.id : args.model,
    };

    return (
        destroy.definition.url
            .replace('{model}', parsedArgs.model.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CustomModelController::destroy
 * @see Http/Controllers/CustomModelController.php:170
 * @route '/models/{model}'
 */
destroy.delete = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\CustomModelController::destroy
 * @see Http/Controllers/CustomModelController.php:170
 * @route '/models/{model}'
 */
const destroyForm = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
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
 * @see \App\Http\Controllers\CustomModelController::destroy
 * @see Http/Controllers/CustomModelController.php:170
 * @route '/models/{model}'
 */
destroyForm.delete = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
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

/**
 * @see \App\Http\Controllers\CustomModelController::publish
 * @see Http/Controllers/CustomModelController.php:112
 * @route '/models/{model}/publish'
 */
export const publish = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: publish.url(args, options),
    method: 'post',
});

publish.definition = {
    methods: ['post'],
    url: '/models/{model}/publish',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\CustomModelController::publish
 * @see Http/Controllers/CustomModelController.php:112
 * @route '/models/{model}/publish'
 */
publish.url = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { model: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { model: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            model: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        model: typeof args.model === 'object' ? args.model.id : args.model,
    };

    return (
        publish.definition.url
            .replace('{model}', parsedArgs.model.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CustomModelController::publish
 * @see Http/Controllers/CustomModelController.php:112
 * @route '/models/{model}/publish'
 */
publish.post = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: publish.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CustomModelController::publish
 * @see Http/Controllers/CustomModelController.php:112
 * @route '/models/{model}/publish'
 */
const publishForm = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: publish.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CustomModelController::publish
 * @see Http/Controllers/CustomModelController.php:112
 * @route '/models/{model}/publish'
 */
publishForm.post = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: publish.url(args, options),
    method: 'post',
});

publish.form = publishForm;

/**
 * @see \App\Http\Controllers\CustomModelController::test
 * @see Http/Controllers/CustomModelController.php:146
 * @route '/models/{model}/test'
 */
export const test = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: test.url(args, options),
    method: 'post',
});

test.definition = {
    methods: ['post'],
    url: '/models/{model}/test',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\CustomModelController::test
 * @see Http/Controllers/CustomModelController.php:146
 * @route '/models/{model}/test'
 */
test.url = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { model: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { model: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            model: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        model: typeof args.model === 'object' ? args.model.id : args.model,
    };

    return (
        test.definition.url
            .replace('{model}', parsedArgs.model.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\CustomModelController::test
 * @see Http/Controllers/CustomModelController.php:146
 * @route '/models/{model}/test'
 */
test.post = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: test.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CustomModelController::test
 * @see Http/Controllers/CustomModelController.php:146
 * @route '/models/{model}/test'
 */
const testForm = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: test.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\CustomModelController::test
 * @see Http/Controllers/CustomModelController.php:146
 * @route '/models/{model}/test'
 */
testForm.post = (
    args:
        | { model: number | { id: number } }
        | [model: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: test.url(args, options),
    method: 'post',
});

test.form = testForm;

const models = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
    publish: Object.assign(publish, publish),
    test: Object.assign(test, test),
};

export default models;
