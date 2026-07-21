import {
    queryParams,
    type RouteQueryOptions,
    type RouteDefinition,
    type RouteFormDefinition,
} from './../../wayfinder';
import channels from './channels';
/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

index.definition = {
    methods: ['get', 'head'],
    url: '/notifications',
} satisfies RouteDefinition<['get', 'head']>;

/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options);
};

/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
 */
const indexForm = (
    options?: RouteQueryOptions,
): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
 */
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
});

/**
 * @see \App\Http\Controllers\NotificationChannelController::index
 * @see Http/Controllers/NotificationChannelController.php:19
 * @route '/notifications'
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

const notifications = {
    index: Object.assign(index, index),
    channels: Object.assign(channels, channels),
};

export default notifications;
