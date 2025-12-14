<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class DepartmentsController extends Controller
{
    public function index()
    {
        Gate::authorize('department.view');
        
        $filters = Request::only(['search', 'sort_by', 'sort_direction']);
        
        $query = Department::query();
        
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
        
        return Inertia::render('department/index', [
            'departments' => $query->paginate($perPage)->withQueryString()->through(function ($department) {
                return [
                    'id' => $department->id,
                    'name' => $department->name,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function store()
    {
        Gate::authorize('department.create');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        Department::create($validated);

        return Redirect::back()->with('success', 'Department created successfully.');
    }

    public function update(Department $department)
    {
        Gate::authorize('department.edit');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
        ]);

        $department->update($validated);

        return Redirect::back()->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department)
    {
        Gate::authorize('department.delete');
        
        $department->delete();
        
        return Redirect::back()->with('success', 'Department deleted successfully.');
    }

    public function bulkDelete()
    {
        Gate::authorize('department.delete');
        
        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:departments,id'],
        ]);

        Department::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' department(s) deleted successfully.');
    }
}
