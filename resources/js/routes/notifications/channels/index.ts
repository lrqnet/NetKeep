import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
    applyUrlDefaults,
} from './../../../wayfinder';
/**
 * @see \App\Http\Controllers\NotificationChannelController::store
 * @see Http/Controllers/NotificationChannelController.php:44
 * @route '/notifications/channels'
 */
export const store = (
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

store.definition = {
    methods: ['post'],
    url: '/notifications/channels',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\NotificationChannelController::store
 * @see Http/Controllers/NotificationChannelController.php:44
 * @route '/notifications/channels'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\NotificationChannelController::store
 * @see Http/Controllers/NotificationChannelController.php:44
 * @route '/notifications/channels'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::store
 * @see Http/Controllers/NotificationChannelController.php:44
 * @route '/notifications/channels'
 */
const storeForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::store
 * @see Http/Controllers/NotificationChannelController.php:44
 * @route '/notifications/channels'
 */
storeForm.post = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
});

store.form = storeForm;

/**
 * @see \App\Http\Controllers\NotificationChannelController::update
 * @see Http/Controllers/NotificationChannelController.php:103
 * @route '/notifications/channels/{channel}'
 */
export const update = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

update.definition = {
    methods: ['patch'],
    url: '/notifications/channels/{channel}',
} satisfies RouteDefinition<['patch']>;

/**
 * @see \App\Http\Controllers\NotificationChannelController::update
 * @see Http/Controllers/NotificationChannelController.php:103
 * @route '/notifications/channels/{channel}'
 */
update.url = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { channel: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { channel: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            channel: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        channel:
            typeof args.channel === 'object' ? args.channel.id : args.channel,
    };

    return (
        update.definition.url
            .replace('{channel}', parsedArgs.channel.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\NotificationChannelController::update
 * @see Http/Controllers/NotificationChannelController.php:103
 * @route '/notifications/channels/{channel}'
 */
update.patch = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::update
 * @see Http/Controllers/NotificationChannelController.php:103
 * @route '/notifications/channels/{channel}'
 */
const updateForm = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
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
 * @see \App\Http\Controllers\NotificationChannelController::update
 * @see Http/Controllers/NotificationChannelController.php:103
 * @route '/notifications/channels/{channel}'
 */
updateForm.patch = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
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
 * @see \App\Http\Controllers\NotificationChannelController::test
 * @see Http/Controllers/NotificationChannelController.php:119
 * @route '/notifications/channels/{channel}/test'
 */
export const test = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: test.url(args, options),
    method: 'post',
});

test.definition = {
    methods: ['post'],
    url: '/notifications/channels/{channel}/test',
} satisfies RouteDefinition<['post']>;

/**
 * @see \App\Http\Controllers\NotificationChannelController::test
 * @see Http/Controllers/NotificationChannelController.php:119
 * @route '/notifications/channels/{channel}/test'
 */
test.url = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { channel: args };
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { channel: args.id };
    }

    if (Array.isArray(args)) {
        args = {
            channel: args[0],
        };
    }

    args = applyUrlDefaults(args);

    const parsedArgs = {
        channel:
            typeof args.channel === 'object' ? args.channel.id : args.channel,
    };

    return (
        test.definition.url
            .replace('{channel}', parsedArgs.channel.toString())
            .replace(/\/+$/, '') + queryParams(options)
    );
};

/**
 * @see \App\Http\Controllers\NotificationChannelController::test
 * @see Http/Controllers/NotificationChannelController.php:119
 * @route '/notifications/channels/{channel}/test'
 */
test.post = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteDefinition<'post'> => ({
    url: test.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::test
 * @see Http/Controllers/NotificationChannelController.php:119
 * @route '/notifications/channels/{channel}/test'
 */
const testForm = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: test.url(args, options),
    method: 'post',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::test
 * @see Http/Controllers/NotificationChannelController.php:119
 * @route '/notifications/channels/{channel}/test'
 */
testForm.post = (
    args:
        | { channel: number | { id: number } }
        | [channel: number | { id: number }]
        | number
        | { id: number },
    options?: RouteQueryOptions,
): RouteFormDefinition<'post'> => ({
    action: test.url(args, options),
    method: 'post',
});

test.form = testForm;

const channels = {
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    test: Object.assign(test, test),
};

export default channels;
