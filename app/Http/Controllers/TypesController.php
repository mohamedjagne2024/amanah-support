<?php

namespace App\Http\Controllers;

use App\Models\Type;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class TypesController extends Controller
{
    public function index()
    {
        Gate::authorize('type.view');
        
        $filters = Request::only(['search', 'sort_by', 'sort_direction']);
        
        $query = Type::query();
        
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
        
        return Inertia::render('type/index', [
            'types' => $query->paginate($perPage)->withQueryString()->through(function ($type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function store()
    {
        Gate::authorize('type.create');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        Type::create($validated);

        return Redirect::back()->with('success', 'Type created successfully.');
    }

    public function update(Type $type)
    {
        Gate::authorize('type.edit');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $type->update($validated);

        return Redirect::back()->with('success', 'Type updated successfully.');
    }

    public function destroy(Type $type)
    {
        Gate::authorize('type.delete');
        
        $type->delete();
        
        return Redirect::back()->with('success', 'Type deleted successfully.');
    }

    public function bulkDelete()
    {
        Gate::authorize('type.delete');
        
        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:types,id'],
        ]);

        Type::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' type(s) deleted successfully.');
    }
}

