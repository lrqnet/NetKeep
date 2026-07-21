<?php

namespace App\Services;

class BackupCrypto
{
    private const MAGIC_V1 = "NETKEEP\x01";

    private const MAGIC_V2 = "NETKEEP\x02";

    private const CHUNK_SIZE = 1048576;

    public function encrypt(string $source, string $target, string $password): void
    {
        $input = fopen($source, 'rb');
        if ($input === false) {
            $this->close($input);
            throw new \RuntimeException('Não foi possível abrir o arquivo de backup para criptografia.');
        }

        try {
            $this->encryptStream($target, $password, function (\Closure $write) use ($input): void {
                while (! feof($input)) {
                    $chunk = fread($input, self::CHUNK_SIZE);
                    if ($chunk === false) {
                        throw new \RuntimeException('Falha ao ler o backup.');
                    }
                    if ($chunk !== '') {
                        $write($chunk);
                    }
                }
            });
        } finally {
            fclose($input);
        }
    }

    public function encryptStream(string $target, string $password, \Closure $producer): void
    {
        $this->assertPassword($password);
        $temporary = $target.'.partial';
        $output = fopen($temporary, 'xb');
        if ($output === false) {
            throw new \RuntimeException('Não foi possível abrir o arquivo de backup para criptografia.');
        }

        $salt = random_bytes(SODIUM_CRYPTO_PWHASH_SALTBYTES);
        $key = $this->deriveKey($password, $salt);
        [$state, $header] = sodium_crypto_secretstream_xchacha20poly1305_init_push($key);
        sodium_memzero($key);
        $complete = false;
        try {
            $this->write($output, self::MAGIC_V2.$salt.$header);
            $producer(function (string $plaintext) use (&$state, $output): void {
                $offset = 0;
                while ($offset < strlen($plaintext)) {
                    $chunk = substr($plaintext, $offset, self::CHUNK_SIZE);
                    $ciphertext = sodium_crypto_secretstream_xchacha20poly1305_push(
                        $state,
                        $chunk,
                        '',
                        SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_MESSAGE,
                    );
                    $this->write($output, pack('N', strlen($ciphertext)).$ciphertext);
                    $offset += strlen($chunk);
                }
            });
            $final = sodium_crypto_secretstream_xchacha20poly1305_push(
                $state,
                '',
                '',
                SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL,
            );
            $this->write($output, pack('N', strlen($final)).$final);
            fflush($output);
            fclose($output);
            if (! rename($temporary, $target)) {
                throw new \RuntimeException('Não foi possível publicar o backup criptografado.');
            }
            $complete = true;
        } finally {
            if (is_resource($output)) {
                fclose($output);
            }
            if (! $complete && is_file($temporary)) {
                unlink($temporary);
            }
        }
    }

    public function decrypt(string $source, string $target, string $password): void
    {
        $temporary = $target.'.partial-'.bin2hex(random_bytes(6));
        $output = fopen($temporary, 'xb');
        if ($output === false) {
            $this->close($output);
            throw new \RuntimeException('Não foi possível abrir o arquivo de backup para restauração.');
        }

        $complete = false;
        try {
            $this->decryptStream($source, $password, function (string $plaintext) use ($output): void {
                $this->write($output, $plaintext);
            });
            fflush($output);
            fclose($output);
            if (! rename($temporary, $target)) {
                throw new \RuntimeException('Não foi possível publicar o backup descriptografado.');
            }
            $complete = true;
        } finally {
            if (is_resource($output)) {
                fclose($output);
            }
            if (! $complete && is_file($temporary)) {
                unlink($temporary);
            }
        }
    }

    public function decryptStream(string $source, string $password, \Closure $consumer): void
    {
        $this->assertPassword($password);
        $input = fopen($source, 'rb');
        if ($input === false) {
            throw new \RuntimeException('Não foi possível abrir o arquivo de backup para restauração.');
        }

        try {
            $magic = $this->readExact($input, strlen(self::MAGIC_V2));
            if (! hash_equals(self::MAGIC_V1, $magic) && ! hash_equals(self::MAGIC_V2, $magic)) {
                throw new \RuntimeException('Formato de backup criptografado inválido.');
            }
            $salt = $this->readExact($input, SODIUM_CRYPTO_PWHASH_SALTBYTES);
            $header = $this->readExact($input, SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_HEADERBYTES);
            $key = $this->deriveKey($password, $salt);
            $state = sodium_crypto_secretstream_xchacha20poly1305_init_pull($header, $key);
            sodium_memzero($key);
            $final = false;

            while (! feof($input)) {
                $lengthBytes = fread($input, 4);
                if ($lengthBytes === '' && feof($input)) {
                    break;
                }
                if ($lengthBytes === false || strlen($lengthBytes) !== 4) {
                    throw new \RuntimeException('Backup criptografado truncado.');
                }
                $unpacked = unpack('Nlength', $lengthBytes);
                if ($unpacked === false) {
                    throw new \RuntimeException('Cabeçalho de bloco inválido.');
                }
                $length = $unpacked['length'];
                if ($length < SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_ABYTES
                    || $length > self::CHUNK_SIZE + SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_ABYTES) {
                    throw new \RuntimeException('Bloco de backup inválido.');
                }
                $ciphertext = $this->readExact($input, $length);
                $result = sodium_crypto_secretstream_xchacha20poly1305_pull($state, $ciphertext);
                if ($result === false) {
                    throw new \RuntimeException('Senha incorreta ou backup adulterado.');
                }
                [$plaintext, $tag] = $result;
                if ($final) {
                    throw new \RuntimeException('Dados encontrados após o final do backup.');
                }
                $offset = 0;
                while ($offset < strlen($plaintext)) {
                    $chunk = substr($plaintext, $offset, 65536);
                    $consumer($chunk);
                    $offset += strlen($chunk);
                }
                $final = $tag === SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL;
            }

            if (! $final) {
                throw new \RuntimeException('Backup criptografado incompleto.');
            }
        } finally {
            fclose($input);
        }
    }

    private function deriveKey(string $password, string $salt): string
    {
        return sodium_crypto_pwhash(
            SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_KEYBYTES,
            $password,
            $salt,
            SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE,
            SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE,
            SODIUM_CRYPTO_PWHASH_ALG_ARGON2ID13,
        );
    }

    private function assertPassword(string $password): void
    {
        if (strlen($password) < 16) {
            throw new \InvalidArgumentException('A senha de recuperação precisa ter ao menos 16 caracteres.');
        }
    }

    /**
     * @param  resource  $stream
     */
    private function readExact($stream, int $length): string
    {
        $value = '';
        while (strlen($value) < $length && ! feof($stream)) {
            $part = fread($stream, max(1, $length - strlen($value)));
            if ($part === false) {
                throw new \RuntimeException('Falha ao ler o backup criptografado.');
            }
            $value .= $part;
        }
        if (strlen($value) !== $length) {
            throw new \RuntimeException('Backup criptografado truncado.');
        }

        return $value;
    }

    /**
     * @param  resource  $stream
     */
    private function write($stream, string $value): void
    {
        $written = 0;
        while ($written < strlen($value)) {
            $count = fwrite($stream, substr($value, $written));
            if ($count === false || $count === 0) {
                throw new \RuntimeException('Falha ao gravar o backup criptografado.');
            }
            $written += $count;
        }
    }

    /**
     * @param  resource|false  $stream
     */
    private function close($stream): void
    {
        if (is_resource($stream)) {
            fclose($stream);
        }
    }
}
