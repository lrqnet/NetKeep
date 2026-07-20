import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../../wayfinder';
/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
export const exportMethod = (
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
});

exportMethod.definition = {
    methods: ['get', 'head'],
    url: '/devices/export',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
const exportMethodForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
exportMethodForm.get = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::exportMethod
 * @see Http/Controllers/DeviceController.php:147
 * @route '/devices/export'
 */
exportMethodForm.head = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: exportMethod.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

exportMethod.form = exportMethodForm;

/**
 * @see \App\Http\Controllers\DeviceController::importMethod
 * @see Http/Controllers/DeviceController.php:173
 * @route '/devices/import'
 */
export const importMethod = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
});

importMethod.definition = {
    methods: ['post'],
    url: '/devices/import',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DeviceController::importMethod
 * @see Http/Controllers/DeviceController.php:173
 * @route '/devices/import'
 */
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DeviceController::importMethod
 * @see Http/Controllers/DeviceController.php:173
 * @route '/devices/import'
 */
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DeviceController::importMethod
 * @see Http/Controllers/DeviceController.php:173
 * @route '/devices/import'
 */
const importMethodForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DeviceController::importMethod
 * @see Http/Controllers/DeviceController.php:173
 * @route '/devices/import'
 */
importMethodForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: importMethod.url(options),
    method: 'post',
});

importMethod.form = importMethodForm;

/**
 * @see \App\Http\Controllers\DeviceController::collect
 * @see Http/Controllers/DeviceController.php:135
 * @route '/devices/{device}/collect'
 */
export const collect = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: collect.url(args, options),
    method: 'post',
});

collect.definition = {
    methods: ['post'],
    url: '/devices/{device}/collect',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DeviceController::collect
 * @see Http/Controllers/DeviceController.php:135
 * @route '/devices/{device}/collect'
 */
collect.url = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { device: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { device: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            device: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        device: typeof args.device === 'object' ? args.device.id : args.device,
    };

    return (
        collect.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DeviceController::collect
 * @see Http/Controllers/DeviceController.php:135
 * @route '/devices/{device}/collect'
 */
collect.post = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: collect.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DeviceController::collect
 * @see Http/Controllers/DeviceController.php:135
 * @route '/devices/{device}/collect'
 */
const collectForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: collect.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DeviceController::collect
 * @see Http/Controllers/DeviceController.php:135
 * @route '/devices/{device}/collect'
 */
collectForm.post = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: collect.url(args, options),
    method: 'post',
});

collect.form = collectForm;

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/devices',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::index
 * @see Http/Controllers/DeviceController.php:42
 * @route '/devices'
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
 * @see \App\Http\Controllers\DeviceController::store
 * @see Http/Controllers/DeviceController.php:83
 * @route '/devices'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/devices',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\DeviceController::store
 * @see Http/Controllers/DeviceController.php:83
 * @route '/devices'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\DeviceController::store
 * @see Http/Controllers/DeviceController.php:83
 * @route '/devices'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DeviceController::store
 * @see Http/Controllers/DeviceController.php:83
 * @route '/devices'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\DeviceController::store
 * @see Http/Controllers/DeviceController.php:83
 * @route '/devices'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
export const edit = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
});

edit.definition = {
    methods: ['get', 'head'],
    url: '/devices/{device}/edit',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
edit.url = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { device: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { device: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            device: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        device: typeof args.device === 'object' ? args.device.id : args.device,
    };

    return (
        edit.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
edit.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
edit.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
const editForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
editForm.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: edit.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\DeviceController::edit
 * @see Http/Controllers/DeviceController.php:64
 * @route '/devices/{device}/edit'
 */
editForm.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: edit.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

edit.form = editForm;

/**
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
export const update = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

update.definition = {
    methods: ['put', 'patch'],
    url: '/devices/{device}',
} satisfies RouteDefinition<['put', 'patch']>;

/**
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
update.url = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { device: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { device: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            device: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        device: typeof args.device === 'object' ? args.device.id : args.device,
    };

    return (
        update.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
update.put = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
});

/**
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
update.patch = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
const updateForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
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
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
updateForm.put = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
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
 * @see \App\Http\Controllers\DeviceController::update
 * @see Http/Controllers/DeviceController.php:102
 * @route '/devices/{device}'
 */
updateForm.patch = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
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
 * @see \App\Http\Controllers\DeviceController::destroy
 * @see Http/Controllers/DeviceController.php:125
 * @route '/devices/{device}'
 */
export const destroy = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

destroy.definition = {
    methods: ['delete'],
    url: '/devices/{device}',
} satisfies RouteDefinition<['delete']>;

/**
 * @see \App\Http\Controllers\DeviceController::destroy
 * @see Http/Controllers/DeviceController.php:125
 * @route '/devices/{device}'
 */
destroy.url = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { device: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { device: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            device: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        device: typeof args.device === 'object' ? args.device.id : args.device,
    };

    return (
        destroy.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\DeviceController::destroy
 * @see Http/Controllers/DeviceController.php:125
 * @route '/devices/{device}'
 */
destroy.delete = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
});

/**
 * @see \App\Http\Controllers\DeviceController::destroy
 * @see Http/Controllers/DeviceController.php:125
 * @route '/devices/{device}'
 */
const destroyForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
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
 * @see \App\Http\Controllers\DeviceController::destroy
 * @see Http/Controllers/DeviceController.php:125
 * @route '/devices/{device}'
 */
destroyForm.delete = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
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

const DeviceController = {
    exportMethod,
    importMethod,
    collect,
    index,
    store,
    edit,
    update,
    destroy,
    export: exportMethod,
    import: importMethod,
};

export default DeviceController;
