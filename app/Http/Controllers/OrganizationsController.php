<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Organization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Request;
use Inertia\Inertia;
use Inertia\Response;

final class OrganizationsController extends Controller
{
    /**
     * Display the organization management page.
     */
    public function index(): Response
    {
        Gate::authorize('organization.view');

        $search = request()->query('search');
        $sortBy = request()->string('sort_by')->value();
        $sortDirection = request()->string('sort_direction')->value();
        $perPage = request()->integer('per_page', 10);

        $allowedSortColumns = ['name', 'email', 'created_at'];
        $allowedSortDirections = ['asc', 'desc'];

        $validSortBy = in_array($sortBy, $allowedSortColumns, true) ? $sortBy : 'name';
        $validSortDirection = in_array($sortDirection, $allowedSortDirections, true) ? $sortDirection : 'asc';

        $organizations = Organization::query()
            ->when($search, static function ($query, string $term): void {
                $query->where(static function ($subQuery) use ($term): void {
                    $subQuery
                        ->where('name', 'like', '%' . $term . '%')
                        ->orWhere('email', 'like', '%' . $term . '%')
                        ->orWhere('phone', 'like', '%' . $term . '%')
                        ->orWhere('city', 'like', '%' . $term . '%');
                });
            })
            ->orderBy($validSortBy, $validSortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(static function (Organization $organization): array {
                return [
                    'id' => $organization->id,
                    'name' => $organization->name,
                    'email' => $organization->email,
                    'phone' => $organization->phone,
                    'address' => $organization->address,
                    'city' => $organization->city,
                    'region' => $organization->region,
                    'country' => $organization->country,
                    'postal_code' => $organization->postal_code,
                    'contacts_count' => $organization->contacts()->count(),
                    'created_at' => $organization->created_at?->toDateString(),
                ];
            });

        $countries = Country::all()
            ->map(static function (Country $country): array {
                return [
                    'id' => $country->id,
                    'name' => $country->name,
                    'code' => $country->short_code ?? null,
                ];
            });

        return Inertia::render('organization/index', [
            'title' => 'Organizations',
            'organizations' => $organizations,
            'countries' => $countries,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy ?: null,
                'sort_direction' => $sortDirection ?: null,
            ],
        ]);
    }

    /**
     * Store a newly created organization.
     */
    public function store(): RedirectResponse
    {
        Gate::authorize('organization.create');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'string', 'max:50', 'email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:50'],
            'region' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:2'],
            'postal_code' => ['nullable', 'string', 'max:25'],
        ]);

        Organization::create($validated);

        return redirect()
            ->route('organizations')
            ->with('success', 'Organization created successfully.');
    }

    /**
     * Update the specified organization.
     */
    public function update(Organization $organization): RedirectResponse
    {
        Gate::authorize('organization.edit');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'string', 'max:50', 'email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:150'],
            'city' => ['nullable', 'string', 'max:50'],
            'region' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:2'],
            'postal_code' => ['nullable', 'string', 'max:25'],
        ]);

        $organization->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Organization updated successfully.');
    }

    /**
     * Delete the specified organization.
     */
    public function destroy(Organization $organization): RedirectResponse
    {
        Gate::authorize('organization.delete');

        $organization->delete();

        return redirect()
            ->route('organizations')
            ->with('success', 'Organization deleted successfully.');
    }

    /**
     * Restore the specified organization.
     */
    public function restore(Organization $organization): RedirectResponse
    {
        Gate::authorize('organization.edit');

        $organization->restore();

        return redirect()
            ->back()
            ->with('success', 'Organization restored successfully.');
    }
}
