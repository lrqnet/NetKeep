<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Services\AuditLogger;
use App\Services\GitHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ConfigurationController extends Controller
{
    public function show(Device $device, GitHistory $history): Response
    {
        return Inertia::render('configurations/show', [
            'device' => $device->load(['group:id,name', 'site:id,name']),
            'versions' => $history->versions($device),
            'content' => $history->content($device),
        ]);
    }

    public function download(Request $request, Device $device, GitHistory $history, AuditLogger $audit): HttpResponse
    {
        $revision = (string) $request->query('revision', 'HEAD');
        $content = $history->content($device, $revision);
        $audit->record('configuration.exported', $device, ['revision' => $revision]);
        $filename = Str::slug($device->name) ?: $device->uuid;

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'-'.$revision.'.cfg"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function diff(Request $request, Device $device, GitHistory $history): HttpResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'regex:/^(HEAD|[a-f0-9]{7,40})$/'],
            'to' => ['required', 'regex:/^(HEAD|[a-f0-9]{7,40})$/'],
        ]);

        return response($history->diff($device, $validated['from'], $validated['to']))
            ->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
