<?php

use App\Http\Controllers\AuditController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\CredentialProfileController;
use App\Http\Controllers\CustomModelController;
use App\Http\Controllers\DangerousFeatureController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DataProtectionController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\Internal\CaddyDomainController;
use App\Http\Controllers\Internal\OxidizedNodesController;
use App\Http\Controllers\Internal\SandboxNodesController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\NotificationChannelController;
use App\Http\Controllers\RestoreRequestController;
use App\Http\Controllers\SetupController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\TlsActivationController;
use App\Http\Controllers\UpdateController;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => inertia('welcome', [
    'installed' => User::query()->exists(),
]))->name('home');

Route::put('/locale', LocaleController::class)
    ->middleware('throttle:30,1')
    ->name('locale.update');

Route::get('/restore', [RestoreRequestController::class, 'index'])
    ->middleware('throttle:30,1')
    ->name('restore.index');
Route::post('/restore', [RestoreRequestController::class, 'store'])
    ->middleware('throttle:3,10')
    ->name('restore.store');

Route::get('/tls-activation', [TlsActivationController::class, 'show'])
    ->middleware('throttle:60,1')
    ->name('tls.activation');
Route::get('/tls-activation/status', [TlsActivationController::class, 'status'])
    ->middleware('throttle:120,1')
    ->name('tls.status');

Route::get('/internal/caddy/ask', CaddyDomainController::class)
    ->middleware('throttle:120,1')
    ->name('internal.caddy.ask');

Route::get('/internal/oxidized/nodes', OxidizedNodesController::class)
    ->middleware(['internal.token', 'throttle:120,1'])
    ->name('internal.oxidized.nodes');
Route::get('/internal/oxidized/sandbox-nodes', SandboxNodesController::class)
    ->middleware(['internal.token', 'throttle:120,1'])
    ->name('internal.oxidized.sandbox-nodes');

Route::middleware('auth')->group(function (): void {
    Route::get('/setup', [SetupController::class, 'show'])->name('setup.show');
    Route::post('/setup', [SetupController::class, 'store'])
        ->middleware('role:owner')
        ->name('setup.store');

    Route::middleware('setup.complete')->group(function (): void {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        Route::get('/devices/export', [DeviceController::class, 'export'])->name('devices.export');
        Route::post('/devices/import', [DeviceController::class, 'import'])
            ->middleware('role:owner,administrator,operator')
            ->name('devices.import');
        Route::post('/devices/{device}/collect', [DeviceController::class, 'collect'])
            ->middleware(['role:owner,administrator,operator', 'throttle:30,1'])
            ->name('devices.collect');
        Route::post('/devices/{device}/force-collect', [DeviceController::class, 'forceCollect'])
            ->middleware(['role:owner,administrator', 'password.confirm', 'throttle:6,10'])
            ->name('devices.force-collect');
        Route::post('/devices/{device}/approve', [DeviceController::class, 'approve'])
            ->middleware(['role:owner,administrator', 'password.confirm', 'throttle:10,1'])
            ->name('devices.approve');
        Route::post('/devices/{device}/revoke-approval', [DeviceController::class, 'revoke'])
            ->middleware(['role:owner,administrator', 'password.confirm'])
            ->name('devices.revoke-approval');
        Route::resource('devices', DeviceController::class)
            ->only(['index', 'store', 'edit', 'update', 'destroy'])
            ->middlewareFor(['store', 'update', 'destroy'], 'role:owner,administrator,operator');

        Route::get('/devices/{device}/configuration', [ConfigurationController::class, 'show'])
            ->name('configurations.show');
        Route::get('/devices/{device}/configuration/download', [ConfigurationController::class, 'download'])
            ->name('configurations.download');
        Route::get('/devices/{device}/configuration/diff', [ConfigurationController::class, 'diff'])
            ->name('configurations.diff');

        Route::resource('credentials', CredentialProfileController::class)
            ->parameters(['credentials' => 'credential'])
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('role:owner,administrator');

        Route::get('/catalog', [CatalogController::class, 'index'])
            ->middleware('role:owner,administrator')
            ->name('catalog.index');
        Route::post('/catalog', [CatalogController::class, 'store'])
            ->middleware('role:owner,administrator')
            ->name('catalog.store');
        Route::delete('/catalog/{kind}/{id}', [CatalogController::class, 'destroy'])
            ->whereIn('kind', ['site', 'group', 'tag', 'manufacturer', 'hardware_model'])
            ->middleware('role:owner,administrator')
            ->name('catalog.destroy');

        Route::resource('models', CustomModelController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('role:owner,administrator');
        Route::post('/models/{model}/publish', [CustomModelController::class, 'publish'])
            ->middleware(['role:owner,administrator', 'password.confirm'])
            ->name('models.publish');
        Route::post('/models/{model}/test', [CustomModelController::class, 'test'])
            ->middleware(['role:owner,administrator', 'password.confirm', 'throttle:3,10'])
            ->name('models.test');

        Route::get('/integrations', [IntegrationController::class, 'index'])
            ->middleware('role:owner,administrator')
            ->name('integrations.index');
        Route::post('/integrations/inventory', [IntegrationController::class, 'storeInventory'])
            ->middleware('role:owner,administrator')
            ->name('integrations.inventory.store');
        Route::post('/integrations/inventory/{source}/sync', [IntegrationController::class, 'syncInventory'])
            ->middleware(['role:owner,administrator', 'throttle:10,1'])
            ->name('integrations.inventory.sync');
        Route::get('/notifications', [NotificationChannelController::class, 'index'])
            ->middleware('role:owner,administrator')
            ->name('notifications.index');
        Route::post('/notifications/channels', [NotificationChannelController::class, 'store'])
            ->middleware('role:owner,administrator')
            ->name('notifications.channels.store');
        Route::patch('/notifications/channels/{channel}', [NotificationChannelController::class, 'update'])
            ->middleware('role:owner,administrator')
            ->name('notifications.channels.update');
        Route::post('/notifications/channels/{channel}/test', [NotificationChannelController::class, 'test'])
            ->middleware(['role:owner,administrator', 'throttle:10,1'])
            ->name('notifications.channels.test');

        Route::get('/data-protection', [DataProtectionController::class, 'index'])
            ->middleware('role:owner,administrator')
            ->name('data-protection.index');
        Route::post('/data-protection/destinations', [DataProtectionController::class, 'store'])
            ->middleware(['role:owner,administrator', 'password.confirm'])
            ->name('data-protection.destinations.store');
        Route::patch('/data-protection/destinations/{destination}', [DataProtectionController::class, 'update'])
            ->middleware(['role:owner,administrator', 'password.confirm'])
            ->name('data-protection.destinations.update');
        Route::post('/data-protection/destinations/{destination}/backup', [DataProtectionController::class, 'runBackup'])
            ->middleware(['role:owner,administrator', 'password.confirm', 'throttle:3,10'])
            ->name('data-protection.destinations.backup');
        Route::post('/data-protection/destinations/{destination}/mirror', [DataProtectionController::class, 'mirrorGit'])
            ->middleware(['role:owner,administrator', 'password.confirm', 'throttle:3,10'])
            ->name('data-protection.destinations.mirror');

        Route::resource('users', UserController::class)
            ->only(['index', 'store', 'update'])
            ->middleware('role:owner,administrator')
            ->middlewareFor('update', 'password.confirm');
        Route::post('/users/{user}/transfer-ownership', [UserController::class, 'transferOwnership'])
            ->middleware(['role:owner', 'password.confirm'])
            ->name('users.transfer-ownership');

        Route::get('/audit', AuditController::class)
            ->middleware('role:owner,administrator')
            ->name('audit.index');

        Route::get('/updates', [UpdateController::class, 'index'])
            ->middleware('role:owner')
            ->name('updates.index');
        Route::put('/updates/settings', [UpdateController::class, 'settings'])
            ->middleware(['role:owner', 'password.confirm'])
            ->name('updates.settings');
        Route::post('/updates/run', [UpdateController::class, 'run'])
            ->middleware(['role:owner', 'password.confirm', 'throttle:3,10'])
            ->name('updates.run');

        Route::get('/system', [SystemSettingsController::class, 'index'])
            ->middleware('role:owner,administrator')
            ->name('system.index');
        Route::put('/system', [SystemSettingsController::class, 'update'])
            ->middleware(['role:owner,administrator', 'password.confirm'])
            ->name('system.update');
        Route::patch('/system/dangerous-features/{feature}', [DangerousFeatureController::class, 'update'])
            ->whereIn('feature', ['raw_ruby', 'telnet', 'http_ip_login', 'automatic_updates', 'unreviewed_drivers'])
            ->middleware(['role:owner', 'password.confirm', 'throttle:6,10'])
            ->name('system.dangerous-features.update');
    });
});

require __DIR__.'/settings.php';
