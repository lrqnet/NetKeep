<?php

namespace App\Enums;

enum CollectionTrigger: string
{
    case Manual = 'manual';
    case Scheduled = 'scheduled';
    case Retry = 'retry';
    case ModelTest = 'model_test';
}
