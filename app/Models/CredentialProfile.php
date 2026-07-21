<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property string|null $password
 * @property string|null $enable_secret
 * @property string|null $private_key
 * @property string|null $private_key_passphrase
 */
class CredentialProfile extends Model
{
    protected $guarded = [];

    protected $hidden = ['password', 'enable_secret', 'private_key', 'private_key_passphrase'];

    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
            'enable_secret' => 'encrypted',
            'private_key' => 'encrypted',
            'private_key_passphrase' => 'encrypted',
        ];
    }

    /** @return HasMany<Device, $this> */
    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }
}
