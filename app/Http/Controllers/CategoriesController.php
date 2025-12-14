<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Department;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;

class CategoriesController extends Controller
{
    public function index()
    {
        Gate::authorize('category.view');
        
        $filters = Request::only(['search', 'sort_by', 'sort_direction']);
        
        $query = Category::with(['department', 'parent']);
        
        // Apply search filter
        if ($search = Request::input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('department', function ($q) use ($search) {
                      $q->where('name', 'like', '%' . $search . '%');
                  })
                  ->orWhereHas('parent', function ($q) use ($search) {
                      $q->where('name', 'like', '%' . $search . '%');
                  });
            });
        }
        
        // Apply sorting - but maintain hierarchy
        $sortBy = Request::input('sort_by', 'name');
        $sortDirection = Request::input('sort_direction', 'asc');
        
        // For hierarchical display, we need to group children with their parents
        // We'll use COALESCE to group: COALESCE(parent_id, id) groups children with their parent
        $query->orderByRaw('COALESCE(categories.parent_id, categories.id) ' . $sortDirection)
              ->orderByRaw('CASE WHEN categories.parent_id IS NULL THEN 0 ELSE 1 END') // Parents first, then children
              ->orderBy('categories.name', 'asc'); // Then by name within each group
        
        $perPage = Request::input('perPage', 10);
        
        return Inertia::render('category/index', [
            'categories' => $query->paginate($perPage)->withQueryString()->through(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                    'department_id' => $category->department_id,
                    'parent_id' => $category->parent_id,
                    'department' => $category->department ? [
                        'id' => $category->department->id,
                        'name' => $category->department->name,
                    ] : null,
                    'parent' => $category->parent ? [
                        'id' => $category->parent->id,
                        'name' => $category->parent->name,
                    ] : null,
                ];
            }),
            'filters' => $filters,
            'departments' => Department::orderBy('name')->get()->map(function ($dept) {
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                ];
            }),
            'parentCategories' => Category::whereNull('parent_id')->orderBy('name')->get()->map(function ($cat) {
                return [
                    'id' => $cat->id,
                    'name' => $cat->name,
                ];
            }),
        ]);
    }

    public function store()
    {
        Gate::authorize('category.create');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        Category::create($validated);

        return Redirect::back()->with('success', 'Category created successfully.');
    }

    public function update(Category $category)
    {
        Gate::authorize('category.edit');
        
        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ]);

        // Prevent category from being its own parent
        if (isset($validated['parent_id']) && $validated['parent_id'] == $category->id) {
            return Redirect::back()->withErrors(['parent_id' => 'Category cannot be its own parent.']);
        }

        $category->update($validated);

        return Redirect::back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        Gate::authorize('category.delete');
        
        // Check if category has children
        if (Category::where('parent_id', $category->id)->exists()) {
            return Redirect::back()->withErrors(['error' => 'Cannot delete category with subcategories.']);
        }
        
        $category->delete();
        
        return Redirect::back()->with('success', 'Category deleted successfully.');
    }

    public function bulkDelete()
    {
        Gate::authorize('category.delete');
        
        $validated = Request::validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:categories,id'],
        ]);

        // Check if any category has children
        $hasChildren = Category::whereIn('parent_id', $validated['ids'])->exists();
        if ($hasChildren) {
            return Redirect::back()->withErrors(['error' => 'Cannot delete categories that have subcategories.']);
        }

        Category::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' category(ies) deleted successfully.');
    }
}
