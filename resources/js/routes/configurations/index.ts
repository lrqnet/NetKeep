import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../wayfinder';
/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
export const show = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

show.definition = {
    methods: ['get', 'head'],
    url: '/devices/{device}/configuration',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
show.url = (
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
        show.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
show.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
show.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
const showForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
showForm.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::show
 * @see Http/Controllers/ConfigurationController.php:16
 * @route '/devices/{device}/configuration'
 */
showForm.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

show.form = showForm;

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
export const download = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
});

download.definition = {
    methods: ['get', 'head'],
    url: '/devices/{device}/configuration/download',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
download.url = (
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
        download.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
download.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
download.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
const downloadForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
downloadForm.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: download.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::download
 * @see Http/Controllers/ConfigurationController.php:25
 * @route '/devices/{device}/configuration/download'
 */
downloadForm.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: download.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

download.form = downloadForm;

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
export const diff = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: diff.url(args, options),
    method: 'get',
});

diff.definition = {
    methods: ['get', 'head'],
    url: '/devices/{device}/configuration/diff',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
diff.url = (
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
        diff.definition.url
            .replace('{device}', parsedArgs.device.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
diff.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'get'> => ({
    url: diff.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
diff.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'head'> => ({
    url: diff.url(args, options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
const diffForm = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: diff.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
diffForm.get = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: diff.url(args, options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\ConfigurationController::diff
 * @see Http/Controllers/ConfigurationController.php:39
 * @route '/devices/{device}/configuration/diff'
 */
diffForm.head = (
    args:
        | { device: number | { id: number } }
        | [device: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: diff.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        },
    }),
    method: 'get',
});

diff.form = diffForm;

const configurations = {
    show: Object.assign(show, show),
    download: Object.assign(download, download),
    diff: Object.assign(diff, diff),
};

export default configurations;
