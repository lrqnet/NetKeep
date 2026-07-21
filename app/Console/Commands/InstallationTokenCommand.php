<?php

namespace App\Console\Commands;

use App\Services\InstallationClaimService;
use Illuminate\Console\Command;

class InstallationTokenCommand extends Command
{
    protected $signature = 'netkeep:installation-token {--rotate}';

    protected $description = 'Exibe ou rotaciona o token local de posse da instalação';

    public function handle(InstallationClaimService $claims): int
    {
        $token = $this->option('rotate') ? $claims->rotate() : $claims->token();
        if ($token === '') {
            $this->error('Token indisponível. Use --rotate no servidor.');

            return self::FAILURE;
        }

        $this->line($token);

        return self::SUCCESS;
    }
}
