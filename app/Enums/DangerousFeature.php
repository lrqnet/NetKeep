<?php

namespace App\Enums;

enum DangerousFeature: string
{
    case RawRuby = 'raw_ruby';
    case Telnet = 'telnet';
    case HttpIpLogin = 'http_ip_login';
    case AutomaticUpdates = 'automatic_updates';
    case UnreviewedDrivers = 'unreviewed_drivers';
}
