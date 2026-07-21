<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CaddyDomainController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $domain = strtolower((string) $request->query('domain'));
        $allowed = Organization::query()
            ->get(['domain', 'canonical_url'])
            ->contains(function (Organization $organization) use ($domain): bool {
                $canonicalHost = strtolower((string) parse_url(
                    (string) $organization->canonical_url,
                    PHP_URL_HOST,
                ));

                return strtolower((string) $organization->domain) === $domain
                    || $canonicalHost === $domain;
            });

        return response('', $allowed ? 200 : 403);
    }
}
