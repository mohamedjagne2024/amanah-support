<?php

namespace App\Http\Controllers;

use App\Models\Category;
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

        $query = Category::query();

        // Apply search filter
        if ($search = Request::input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        }

        // Apply sorting
        $sortBy = Request::input('sort_by', 'name');
        $sortDirection = Request::input('sort_direction', 'asc');

        $query->orderBy('categories.' . $sortBy, $sortDirection);

        $perPage = Request::input('perPage', 10);

        return Inertia::render('category/index', [
            'categories' => $query->paginate($perPage)->withQueryString()->through(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'color' => $category->color,
                ];
            }),
            'filters' => $filters,
        ]);
    }

    public function store()
    {
        Gate::authorize('category.create');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
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
        ]);

        $category->update($validated);

        return Redirect::back()->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category)
    {
        Gate::authorize('category.delete');

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

        Category::whereIn('id', $validated['ids'])->delete();

        return Redirect::back()->with('success', count($validated['ids']) . ' category(ies) deleted successfully.');
    }
}
