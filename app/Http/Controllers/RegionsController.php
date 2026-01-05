<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class RegionsController extends Controller
{
    public function index()
    {
        Gate::authorize('region.view');

        $filters = Request::only(['search', 'sort_by', 'sort_direction']);

        $query = Region::query();

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

        return Inertia::render('region/index', [
            'regions' => $query->paginate($perPage)->withQueryString()->through(function ($region) {
                return [
                    'id' => $region->id,
                    'name' => $region->name,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function store()
    {
        Gate::authorize('region.create');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        Region::create($validated);

        return Redirect::back()->with('success', 'Region created successfully.');
    }

    public function update(Region $region)
    {
        Gate::authorize('region.edit');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        $region->update($validated);

        return Redirect::back()->with('success', 'Region updated successfully.');
    }

    public function destroy(Region $region)
    {
        Gate::authorize('region.delete');

        $region->delete();

        return Redirect::back()->with('success', 'Region deleted successfully.');
    }

    public function bulkDelete()
    {
        Gate::authorize('region.delete');

        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:regions,id'],
        ]);

        Region::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' region(s) deleted successfully.');
    }
}
