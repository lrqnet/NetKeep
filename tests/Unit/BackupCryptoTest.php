<?php

namespace Tests\Unit;

use App\Services\BackupCrypto;
use PHPUnit\Framework\TestCase;

class BackupCryptoTest extends TestCase
{
    public function test_it_round_trips_large_password_encrypted_backups(): void
    {
        $directory = sys_get_temp_dir().'/netkeep-crypto-'.bin2hex(random_bytes(5));
        mkdir($directory, 0700);
        $source = $directory.'/source';
        $encrypted = $directory.'/backup.nkb';
        $restored = $directory.'/restored';
        file_put_contents($source, random_bytes(2_200_000));

        $crypto = new BackupCrypto;
        $crypto->encrypt($source, $encrypted, 'correct horse battery staple');
        $crypto->decrypt($encrypted, $restored, 'correct horse battery staple');

        $this->assertSame(hash_file('sha256', $source), hash_file('sha256', $restored));
        unlink($source);
        unlink($encrypted);
        unlink($restored);
        rmdir($directory);
    }

    public function test_it_rejects_an_incorrect_password(): void
    {
        $directory = sys_get_temp_dir().'/netkeep-crypto-'.bin2hex(random_bytes(5));
        mkdir($directory, 0700);
        $source = $directory.'/source';
        $encrypted = $directory.'/backup.nkb';
        $restored = $directory.'/restored';
        file_put_contents($source, 'sensitive configuration');

        $crypto = new BackupCrypto;
        $crypto->encrypt($source, $encrypted, 'correct horse battery staple');

        $this->expectException(\RuntimeException::class);
        try {
            $crypto->decrypt($encrypted, $restored, 'incorrect password value');
        } finally {
            unlink($source);
            unlink($encrypted);
            if (is_file($restored)) {
                unlink($restored);
            }
            rmdir($directory);
        }
    }

    public function test_it_encrypts_and_decrypts_streams_without_plaintext_files(): void
    {
        $directory = sys_get_temp_dir().'/netkeep-crypto-'.bin2hex(random_bytes(5));
        mkdir($directory, 0700);
        $encrypted = $directory.'/backup.nkb';
        $expected = random_bytes(2_200_000);
        $restored = '';
        $crypto = new BackupCrypto;

        $crypto->encryptStream(
            $encrypted,
            'correct horse battery staple',
            function (\Closure $write) use ($expected): void {
                $write(substr($expected, 0, 700000));
                $write(substr($expected, 700000));
            },
        );
        $crypto->decryptStream(
            $encrypted,
            'correct horse battery staple',
            function (string $chunk) use (&$restored): void {
                $restored .= $chunk;
            },
        );

        $this->assertSame(hash('sha256', $expected), hash('sha256', $restored));
        $this->assertFileDoesNotExist($encrypted.'.partial');
        unlink($encrypted);
        rmdir($directory);
    }
}
