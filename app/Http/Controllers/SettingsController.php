<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;
use App\Models\Settings;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\RedirectResponse;
use App\Http\Requests\UpdateGeneralSettingsRequest;
use App\Http\Requests\AssignRoleRequest;
use App\Http\Requests\AssignPermissionRequest;
use App\Http\Requests\AssignRolesAndPermissionsRequest;
use App\Http\Requests\StoreUserRequest;
use Illuminate\Support\Facades\Hash;

final class SettingsController extends Controller
{
    /**
     * Display the general settings page.
     */
    public function general(): Response
    {
        Gate::authorize('settings.general');
        
        $settings = Settings::all()->pluck('value', 'name')->toArray();

        $jsonContent = File::get(base_path('app/Helpers/currency.json'));
        $jsonContent = preg_replace('/^\xEF\xBB\xBF/', '', $jsonContent);
        $jsonContent = trim($jsonContent);
        
        $currencies = json_decode($jsonContent, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Failed to decode currency.json: '.json_last_error_msg());
        }

        return Inertia::render('settings/general', [
            'settings' => [
                'timezone' => $settings['timezone'] ?? null,
                'date_format' => $settings['date_format'] ?? null,
                'time_format' => $settings['time_format'] ?? null,
                'currency_position' => $settings['currency_position'] ?? null,
                'thousand_sep' => $settings['thousand_sep'] ?? null,
                'decimal_sep' => $settings['decimal_sep'] ?? null,
                'decimal_places' => $settings['decimal_places'] ?? null,
                'currency' => $settings['currency'] ?? null,
            ],
            'currencies' => $currencies,
        ]);
    }

    /**
     * Update the general settings.
     */
    public function update(UpdateGeneralSettingsRequest $request): RedirectResponse
    {
        Gate::authorize('settings.general');
        
        $validated = $request->validated();

        foreach ($validated as $name => $value) {
            Settings::updateOrCreate(
                ['name' => $name],
                ['value' => $value === '' ? null : $value]
            );
        }

        return redirect()->route('settings.general')->with('success', 'Settings updated successfully.');
    }

    /**
     * Display the user management page.
     */
    public function userManagement(): Response
    {
        Gate::authorize('users.view');

        $search = request()->query('search');
        $sortBy = request()->string('sort_by')->value();
        $sortDirection = request()->string('sort_direction')->value();

        $allowedSortColumns = ['name', 'email', 'created_at'];
        $allowedSortDirections = ['asc', 'desc'];

        $validSortBy = in_array($sortBy, $allowedSortColumns, true) ? $sortBy : null;
        $validSortDirection = in_array($sortDirection, $allowedSortDirections, true) ? $sortDirection : 'asc';

        $users = User::with('roles', 'permissions')
            ->when($search, static function ($query, string $term): void {
                $query->where(static function ($subQuery) use ($term): void {
                    $subQuery
                        ->where('name', 'like', '%'.$term.'%')
                        ->orWhere('email', 'like', '%'.$term.'%');
                });
            })
            ->when($validSortBy, static function ($query) use ($validSortBy, $validSortDirection): void {
                $query->orderBy($validSortBy, $validSortDirection);
            })
            ->get()
            ->map(static function (User $user): array {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_super_admin' => $user->is_super_admin,
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
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

        $permissions = \Spatie\Permission\Models\Permission::all()
            ->groupBy(static function ($permission): string {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'other';
            })
            ->map(static function ($group): array {
                return $group->map(static function ($permission): array {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                    ];
                })->values()->toArray();
            })
            ->toArray();

        return Inertia::render('settings/user-management', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy ?: null,
                'sort_direction' => $sortDirection ?: null,
            ],
        ]);
    }

    /**
     * Assign roles to a user.
     */
    public function assignRoles(AssignRoleRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('users.assign-roles');
        
        $validated = $request->validated();
        
        $user->syncRoles($validated['roles']);

        // Clear permission cache for this user and globally
        $user->forgetCachedPermissions();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('settings.user-management')
            ->with('success', 'User roles updated successfully.');
    }

    /**
     * Assign direct permissions to a user.
     */
    public function assignPermissions(AssignPermissionRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('users.assign-roles');
        
        $validated = $request->validated();
        
        $permissions = $validated['permissions'] ?? [];
        $user->syncPermissions($permissions);

        // Clear permission cache for this user and globally
        $user->forgetCachedPermissions();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('settings.user-management')
            ->with('success', 'User permissions updated successfully.');
    }

    /**
     * Assign roles and permissions to a user in a single request.
     */
    public function assignRolesAndPermissions(AssignRolesAndPermissionsRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('users.assign-roles');
        
        $validated = $request->validated();
        
        $user->syncRoles($validated['roles']);
        
        $permissions = $validated['permissions'] ?? [];
        $user->syncPermissions($permissions);

        // Clear permission cache for this user and globally
        $user->forgetCachedPermissions();
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('settings.user-management')
            ->with('success', 'User roles and permissions updated successfully.');
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        Gate::authorize('users.create');

        $validated = $request->validated();

        /** @var User */
        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()
            ->route('settings.user-management')
            ->with('success', 'User created successfully.');
    }

    /**
     * Display the roles and permissions page.
     */
    public function rolesPermissions(): RedirectResponse
    {
        Gate::authorize('settings.roles-permissions');
        
        return redirect()->route('roles.index');
    }
}
