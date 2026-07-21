<?php

namespace App\Enums;

enum UserRole: string
{
    case Owner = 'owner';
    case Administrator = 'administrator';
    case Operator = 'operator';
    case Viewer = 'viewer';

    public function canManageSystem(): bool
    {
        return in_array($this, [self::Owner, self::Administrator], true);
    }

    public function canManageInventory(): bool
    {
        return $this !== self::Viewer;
    }

    public function canManageOwnership(): bool
    {
        return $this === self::Owner;
    }
}
