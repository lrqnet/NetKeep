<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $action = (string) $request->query('action', '');

        return Inertia::render('audit/index', [
            'events' => AuditEvent::query()
                ->with('user:id,name,email')
                ->when($action !== '', fn ($query) => $query->where('action', 'like', $action.'%'))
                ->latest()
                ->paginate(50)
                ->withQueryString(),
        ]);
    }
}
