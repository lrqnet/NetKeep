<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOxidizedReporter
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('netkeep.oxidized.token');
        $provided = (string) $request->header('X-NetKeep-Token');

        abort_if(
            $request->getHost() !== 'app'
            || $expected === ''
            || ! hash_equals($expected, $provided),
            403,
        );

        return $next($request);
    }
}
