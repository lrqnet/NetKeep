<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Services\CaddyTlsConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TlsActivationController extends Controller
{
    public function show(): Response|RedirectResponse
    {
        $canonicalUrl = Organization::query()->value('canonical_url');
        if (! is_string($canonicalUrl) || $canonicalUrl === '') {
            return redirect()->route('home');
        }

        return Inertia::render('tls-activation', [
            'canonicalUrl' => rtrim($canonicalUrl, '/'),
        ]);
    }

    public function status(CaddyTlsConfigService $caddy): JsonResponse
    {
        $canonicalUrl = Organization::query()->value('canonical_url');

        return response()->json([
            'ready' => is_string($canonicalUrl) && $caddy->isReady($canonicalUrl),
        ]);
    }
}
