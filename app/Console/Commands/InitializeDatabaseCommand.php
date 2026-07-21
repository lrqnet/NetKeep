<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use PDO;
use PDOException;

class InitializeDatabaseCommand extends Command
{
    protected $signature = 'netkeep:database-initialize';

    protected $description = 'Creates the restricted NetKeep database role and database';

    public function handle(): int
    {
        $adminPassword = trim(File::get((string) config('netkeep.database_admin.password_path')));
        $appPassword = (string) config('database.connections.pgsql.password');
        if ($adminPassword === '' || $appPassword === '') {
            return self::FAILURE;
        }

        $pdo = $this->adminConnection($adminPassword, $appPassword);
        $quotedPassword = $pdo->quote($appPassword);
        $roleExists = (bool) $this->queryValue($pdo, "SELECT 1 FROM pg_roles WHERE rolname = 'netkeep'");
        $bootstrapRole = (bool) $this->queryValue(
            $pdo,
            "SELECT 1 FROM pg_roles WHERE rolname = 'netkeep' AND oid = 10 AND rolsuper",
        );
        $legacyBootstrapExists = (bool) $this->queryValue(
            $pdo,
            "SELECT 1 FROM pg_roles WHERE rolname = 'netkeep_legacy_bootstrap'",
        );
        if ($bootstrapRole) {
            $pdo->exec('ALTER ROLE netkeep RENAME TO netkeep_legacy_bootstrap');
            $legacyBootstrapExists = true;
            $roleExists = false;
        }
        if ($legacyBootstrapExists) {
            $pdo->exec(
                'ALTER ROLE netkeep_legacy_bootstrap NOLOGIN NOCREATEDB NOCREATEROLE NOREPLICATION',
            );
        }

        $pdo->exec($roleExists
            ? "ALTER ROLE netkeep WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD {$quotedPassword}"
            : "CREATE ROLE netkeep WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD {$quotedPassword}");
        $databaseExists = (bool) $this->queryValue($pdo, "SELECT 1 FROM pg_database WHERE datname = 'netkeep'");
        if (! $databaseExists) {
            $pdo->exec('CREATE DATABASE netkeep OWNER netkeep');
        } elseif ($legacyBootstrapExists) {
            $pdo->exec('ALTER DATABASE netkeep OWNER TO netkeep');
            $applicationDatabase = $this->connection(
                (string) config('netkeep.database_admin.username'),
                $adminPassword,
                'netkeep',
            );
            $applicationDatabase->exec('ALTER SCHEMA public OWNER TO netkeep');
            $this->transferPublicRelations($applicationDatabase);
        }

        $this->info('NetKeep database is ready.');

        return self::SUCCESS;
    }

    private function adminConnection(string $adminPassword, string $appPassword): PDO
    {
        try {
            return $this->connection((string) config('netkeep.database_admin.username'), $adminPassword);
        } catch (PDOException) {
            $legacy = $this->connection('netkeep', $appPassword);
            $quotedPassword = $legacy->quote($adminPassword);
            $roleExists = (bool) $this->queryValue(
                $legacy,
                "SELECT 1 FROM pg_roles WHERE rolname = 'netkeep_admin'",
            );
            $legacy->exec($roleExists
                ? "ALTER ROLE netkeep_admin WITH LOGIN SUPERUSER CREATEDB CREATEROLE REPLICATION PASSWORD {$quotedPassword}"
                : 'CREATE ROLE netkeep_admin WITH LOGIN SUPERUSER CREATEDB CREATEROLE REPLICATION '
                    ."PASSWORD {$quotedPassword}");

            return $this->connection((string) config('netkeep.database_admin.username'), $adminPassword);
        }
    }

    private function connection(string $username, string $password, string $database = 'postgres'): PDO
    {
        return new PDO(
            'pgsql:host='.config('database.connections.pgsql.host')
                .';port='.config('database.connections.pgsql.port')
                .';dbname='.$database,
            $username,
            $password,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
        );
    }

    private function queryValue(PDO $pdo, string $sql): mixed
    {
        $statement = $pdo->query($sql);
        if ($statement === false) {
            throw new PDOException('database_query_failed');
        }

        return $statement->fetchColumn();
    }

    private function transferPublicRelations(PDO $pdo): void
    {
        $this->transferPublicRelationsByKind($pdo, false);
        $this->transferPublicRelationsByKind($pdo, true);
    }

    private function transferPublicRelationsByKind(PDO $pdo, bool $sequences): void
    {
        $kinds = $sequences ? "'S'" : "'r', 'p', 'v', 'm', 'f'";
        $statement = $pdo->query(
            "SELECT c.relkind, quote_ident(n.nspname) AS schema_name, quote_ident(c.relname) AS relation_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_roles r ON r.oid = c.relowner
            WHERE n.nspname = 'public'
              AND r.rolname = 'netkeep_legacy_bootstrap'
              AND c.relkind IN ({$kinds})
            ORDER BY c.relname",
        );
        if ($statement === false) {
            throw new PDOException('database_query_failed');
        }

        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $relation) {
            $kind = (string) ($relation['relkind'] ?? '');
            $schema = (string) ($relation['schema_name'] ?? '');
            $name = (string) ($relation['relation_name'] ?? '');
            $type = match ($kind) {
                'S' => 'SEQUENCE',
                'v' => 'VIEW',
                'm' => 'MATERIALIZED VIEW',
                'f' => 'FOREIGN TABLE',
                default => 'TABLE',
            };
            $pdo->exec(
                "ALTER {$type} {$schema}.{$name} OWNER TO netkeep",
            );
        }
    }
}
