<?php

namespace App\Http\Controllers;

use App\Exceptions\GitRepositoryUnavailable;
use App\Models\Device;
use App\Services\AuditLogger;
use App\Services\GitHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ConfigurationController extends Controller
{
    public function show(Device $device, GitHistory $history): Response
    {
        $unavailable = false;
        try {
            $versions = $history->versions($device);
            $content = $versions === [] ? '' : $history->content($device);
        } catch (GitRepositoryUnavailable) {
            Log::warning('configuration_history_unavailable');
            $versions = [];
            $content = '';
            $unavailable = true;
        }

        return Inertia::render('configurations/show', [
            'device' => $device->load(['group:id,name', 'site:id,name']),
            'versions' => $versions,
            'content' => $content,
            'historyUnavailable' => $unavailable,
        ]);
    }

    public function download(Request $request, Device $device, GitHistory $history, AuditLogger $audit): HttpResponse
    {
        $revision = (string) $request->query('revision', 'HEAD');
        try {
            $content = $history->content($device, $revision);
        } catch (GitRepositoryUnavailable) {
            return $this->historyUnavailableResponse();
        }
        $audit->record('configuration.exported', $device, ['revision' => $revision]);
        $filename = Str::slug($device->name) ?: $device->uuid;

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$filename.'-'.$revision.'.cfg"',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function diff(Request $request, Device $device, GitHistory $history): HttpResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'regex:/^(HEAD|[a-f0-9]{7,40})$/'],
            'to' => ['required', 'regex:/^(HEAD|[a-f0-9]{7,40})$/'],
        ]);

        try {
            $diff = $history->diff($device, $validated['from'], $validated['to']);
        } catch (GitRepositoryUnavailable) {
            return $this->historyUnavailableResponse();
        }

        return response($diff, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function historyUnavailableResponse(): HttpResponse
    {
        return response(__('netkeep.config.history_unavailable'), 503, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
