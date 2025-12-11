<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\RedirectResponse;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;

final class RoleController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('roles.view');

        $roles = Role::with('permissions')
            ->get()
            ->map(static function (Role $role): array {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                    'permissions_count' => $role->permissions->count(),
                    'users_count' => $role->users()->count(),
                ];
            });

        $permissions = Permission::all()
            ->groupBy(static function (Permission $permission): string {
                $parts = explode('.', $permission->name);
                return $parts[0] ?? 'other';
            })
            ->map(static function ($group): array {
                return $group->map(static function (Permission $permission): array {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                    ];
                })->values()->toArray();
            })
            ->toArray();

        return Inertia::render('settings/roles', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        Gate::authorize('roles.create');
        
        $validated = $request->validated();

        $role = Role::create(['name' => $validated['name']]);

        if (isset($validated['permissions']) && is_array($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        // Clear permission cache globally when role permissions change
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        Gate::authorize('roles.edit');
        
        $validated = $request->validated();

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions']) && is_array($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        } else {
            $role->syncPermissions([]);
        }

        // Clear permission cache for all users with this role and globally
        foreach ($role->users()->get() as $user) {
            $user->forgetCachedPermissions();
        }
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        Gate::authorize('roles.delete');

        // Prevent deleting Super Admin role
        if ($role->name === 'Super Admin') {
            return redirect()
                ->route('roles.index')
                ->with('error', 'Cannot delete Super Admin role.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return redirect()
                ->route('roles.index')
                ->with('error', 'Cannot delete role that is assigned to users.');
        }

        $role->delete();

        // Clear permission cache globally when role is deleted
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('roles.index')
            ->with('success', 'Role deleted successfully.');
    }
}
