<?php

namespace App\Support;

final class UserInputLimits
{
    public const int EMAIL = 255;

    public const int NAME = 255;

    public const int PASSWORD = 128;

    /**
     * @return array{name: int, email: int, password: int}
     */
    public static function registration(): array
    {
        return [
            'name' => self::NAME,
            'email' => self::EMAIL,
            'password' => self::PASSWORD,
        ];
    }

    /**
     * @return array{email: int, password: int}
     */
    public static function authentication(): array
    {
        return [
            'email' => self::EMAIL,
            'password' => self::PASSWORD,
        ];
    }
}
