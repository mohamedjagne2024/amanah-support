<?php

namespace App\Http\Controllers;

use App\Models\Status;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class StatusesController extends Controller
{
    public function index()
    {
        Gate::authorize('status.view');
        
        $filters = Request::only(['search', 'sort_by', 'sort_direction']);
        
        $query = Status::query();
        
        // Apply search filter
        if ($search = Request::input('search')) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }
        
        // Apply sorting
        $sortBy = Request::input('sort_by', 'name');
        $sortDirection = Request::input('sort_direction', 'asc');
        
        // Only allow sorting by valid columns
        if (in_array($sortBy, ['name', 'slug', 'id'])) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }
        
        $perPage = Request::input('perPage', 10);
        
        return Inertia::render('status/index', [
            'statuses' => $query->paginate($perPage)->withQueryString()->through(function ($status) {
                return [
                    'id' => $status->id,
                    'name' => $status->name,
                    'slug' => $status->slug,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function store()
    {
        Gate::authorize('status.create');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        // Auto-generate slug from name
        $slug = strtolower(preg_replace('/\s+/', '_', $validated['name']));
        
        Status::create([
            'name' => $validated['name'],
            'slug' => $slug,
        ]);

        return Redirect::back()->with('success', 'Status created successfully.');
    }

    public function update(Status $status)
    {
        Gate::authorize('status.edit');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
            'slug' => ['required', 'string', 'max:50'],
        ]);

        $status->update($validated);

        return Redirect::back()->with('success', 'Status updated successfully.');
    }

    public function destroy(Status $status)
    {
        Gate::authorize('status.delete');
        
        $status->delete();
        
        return Redirect::back()->with('success', 'Status deleted successfully.');
    }

    public function bulkDelete()
    {
        Gate::authorize('status.delete');
        
        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:statuses,id'],
        ]);

        Status::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' status(es) deleted successfully.');
    }
}
