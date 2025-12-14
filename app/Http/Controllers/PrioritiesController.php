<?php

namespace App\Http\Controllers;

use App\Models\Priority;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class PrioritiesController extends Controller
{
    public function index()
    {
        Gate::authorize('priority.view');
        
        $filters = Request::only(['search', 'sort_by', 'sort_direction']);
        
        $query = Priority::query();
        
        // Apply search filter
        if ($search = Request::input('search')) {
            $query->where('name', 'like', '%' . $search . '%');
        }
        
        // Apply sorting
        $sortBy = Request::input('sort_by', 'name');
        $sortDirection = Request::input('sort_direction', 'asc');
        
        // Only allow sorting by valid columns
        if (in_array($sortBy, ['name', 'id'])) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }
        
        $perPage = Request::input('perPage', 10);
        
        return Inertia::render('priority/index', [
            'priorities' => $query->paginate($perPage)->withQueryString()->through(function ($priority) {
                return [
                    'id' => $priority->id,
                    'name' => $priority->name,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function store()
    {
        Gate::authorize('priority.create');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        Priority::create($validated);

        return Redirect::back()->with('success', 'Priority created successfully.');
    }

    public function update(Priority $priority)
    {
        Gate::authorize('priority.edit');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $priority->update($validated);

        return Redirect::back()->with('success', 'Priority updated successfully.');
    }

    public function destroy(Priority $priority)
    {
        Gate::authorize('priority.delete');
        
        $priority->delete();
        
        return Redirect::back()->with('success', 'Priority deleted successfully.');
    }

    public function bulkDelete()
    {
        Gate::authorize('priority.delete');
        
        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:priorities,id'],
        ]);

        Priority::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' priority(ies) deleted successfully.');
    }
}
