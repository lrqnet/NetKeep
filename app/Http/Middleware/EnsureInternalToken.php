<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureInternalToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('netkeep.oxidized.token');
        $provided = (string) $request->header('X-NetKeep-Token');

        abort_if($expected === '' || ! hash_equals($expected, $provided), 403);

        return $next($request);
    }
}
