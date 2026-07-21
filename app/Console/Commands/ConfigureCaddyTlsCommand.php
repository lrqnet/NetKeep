<?php

namespace App\Console\Commands;

use App\Services\CaddyTlsConfigService;
use App\Services\CanonicalUrlService;
use Illuminate\Console\Command;

class ConfigureCaddyTlsCommand extends Command
{
    protected $signature = 'netkeep:caddy-configure {--reload}';

    protected $description = 'Materializes the canonical TLS configuration';

    public function handle(
        CanonicalUrlService $canonicalUrls,
        CaddyTlsConfigService $caddy,
    ): int {
        $caddy->configure($canonicalUrls->url(), (bool) $this->option('reload'));

        return self::SUCCESS;
    }
}
