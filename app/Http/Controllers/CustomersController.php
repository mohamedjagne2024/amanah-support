<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

final class CustomersController extends Controller
{
    /**
     * Display the customer management page.
     */
    public function index(): Response
    {
        Gate::authorize('customers.view');

        $search = request()->query('search');
        $sortBy = request()->string('sort_by')->value();
        $sortDirection = request()->string('sort_direction')->value();
        $perPage = request()->integer('per_page', 10);

        $allowedSortColumns = ['name', 'email', 'created_at'];
        $allowedSortDirections = ['asc', 'desc'];

        $validSortBy = in_array($sortBy, $allowedSortColumns, true) ? $sortBy : 'name';
        $validSortDirection = in_array($sortDirection, $allowedSortDirections, true) ? $sortDirection : 'asc';

        $customers = User::with('roles')
            ->role('customer')
            ->when($search, static function ($query, string $term): void {
                $query->where(static function ($subQuery) use ($term): void {
                    $subQuery
                        ->where('name', 'like', '%'.$term.'%')
                        ->orWhere('email', 'like', '%'.$term.'%')
                        ->orWhere('phone', 'like', '%'.$term.'%')
                        ->orWhere('city', 'like', '%'.$term.'%');
                });
            })
            ->orderBy($validSortBy, $validSortDirection)
            ->paginate($perPage)
            ->withQueryString()
            ->through(static function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'city' => $user->city,
                    'country' => $user->country?->name,
                    'photo' => $user->photo_path,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'created_at' => $user->created_at?->toDateString(),
                ];
            });

        $roles = Role::all()
            ->map(static function (Role $role): array {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            });

        $countries = Country::all()
            ->map(static function (Country $country): array {
                return [
                    'id' => $country->id,
                    'name' => $country->name,
                ];
            });

        return Inertia::render('customer/index', [
            'title' => 'Customers',
            'customers' => $customers,
            'roles' => $roles,
            'countries' => $countries,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy ?: null,
                'sort_direction' => $sortDirection ?: null,
            ],
        ]);
    }

    /**
     * Store a newly created customer.
     */
    public function store(): RedirectResponse
    {
        Gate::authorize('customers.create');

        $validated = Request::validate([
            'first_name' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['required', 'string', 'max:50', 'email', Rule::unique('users')],
            'password' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'country_id' => ['nullable', 'exists:countries,id'],
        ]);

        $photoPath = null;
        if (Request::file('photo')) {
            $photoPath = '/files/'.Request::file('photo')->store('users', ['disk' => 'file_uploads']);
        }

        /** @var User */
        $user = User::create([
            'name' => $validated['first_name'].' '.$validated['last_name'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
            'photo_path' => $photoPath,
            'password' => !empty($validated['password']) 
                ? Hash::make($validated['password']) 
                : Hash::make(Str::random(16)),
        ]);

        // Assign the customer role
        $user->assignRole('customer');

        return redirect()
            ->route('customers')
            ->with('success', 'Customer created successfully.');
    }

    /**
     * Update the specified customer.
     */
    public function update(User $user): RedirectResponse
    {
        Gate::authorize('customers.edit');

        $validated = Request::validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['required', 'string', 'max:50', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'photo' => ['nullable', 'image'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'],
            'city' => $validated['city'] ?? null,
            'address' => $validated['address'] ?? null,
            'country_id' => $validated['country_id'] ?? null,
        ]);

        if (Request::file('photo')) {
            if (!empty($user->photo_path) && File::exists(public_path($user->photo_path))) {
                File::delete(public_path($user->photo_path));
            }
            $user->update([
                'photo_path' => '/files/'.Request::file('photo')->store('users', ['disk' => 'file_uploads']),
            ]);
        }

        if (!empty($validated['password'])) {
            $user->update(['password' => Hash::make($validated['password'])]);
        }

        // Update roles if provided
        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
            
            // Clear permission cache
            $user->forgetCachedPermissions();
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        }

        return redirect()
            ->back()
            ->with('success', 'Customer updated successfully.');
    }

    /**
     * Delete the specified customer.
     */
    public function destroy(User $user): RedirectResponse
    {
        Gate::authorize('customers.delete');

        $user->delete();

        return redirect()
            ->route('customers')
            ->with('success', 'Customer deleted successfully.');
    }

    /**
     * Restore the specified customer.
     */
    public function restore(User $user): RedirectResponse
    {
        Gate::authorize('customers.edit');

        $user->restore();

        return redirect()
            ->back()
            ->with('success', 'Customer restored successfully.');
    }
}
