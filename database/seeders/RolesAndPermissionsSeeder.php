<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

final class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define the permissions that should exist
        $permissions = [
            // Assets
            'assets.view',
            'assets.create',
            'assets.edit',
            'assets.delete',
            'assets.export',
            'assets.import',

            // Purchase Orders
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.edit',
            'purchase-orders.delete',
            'purchase-orders.approve',
            'purchase-orders.reject',
            'purchase-orders.receive',
            'purchase-orders.bulk-operations',

            // Work Orders
            'work-orders.view',
            'work-orders.create',
            'work-orders.edit',
            'work-orders.delete',
            'work-orders.approve',
            'work-orders.reject',
            'work-orders.complete',
            'work-orders.in-progress',
            'work-orders.request',

            // Departments
            'departments.view',
            'departments.create',
            'departments.edit',
            'departments.delete',

            // Categories
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.delete',

            // Subcategories
            'subcategories.view',
            'subcategories.create',
            'subcategories.edit',
            'subcategories.delete',

            // Locations
            'locations.view',
            'locations.create',
            'locations.edit',
            'locations.delete',

            // Staff
            'staff.view',
            'staff.create',
            'staff.edit',
            'staff.delete',

            // Reports
            'reports.view',
            'reports.asset-summary',
            'reports.maintenance-insights',
            'reports.maintenance-activity-report',
            'reports.maintenance-by-staff',
            'reports.purchase-order-report',
            'reports.purchase-order-report',

            // Dashboard Widgets
            'dashboard.widgets.total-assets',
            'dashboard.widgets.work-orders',
            'dashboard.widgets.purchase-orders',
            'dashboard.widgets.total-asset-value',
            'dashboard.widgets.assets-by-status',
            'dashboard.widgets.work-orders-by-priority',
            'dashboard.widgets.assets-by-location',
            'dashboard.widgets.assets-by-category',
            'dashboard.widgets.purchase-orders-trend',
            'dashboard.widgets.work-orders-trend',
            'dashboard.widgets.recent-work-orders',
            'dashboard.widgets.recent-purchase-orders',

            // Settings
            'settings.general',
            'settings.user-management',
            'settings.roles-permissions',

            // Users
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign-roles',

            // Roles
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
        ];

        // Delete permissions that are not in the seeder list
        $permissionNames = array_map(fn ($name) => $name, $permissions);
        Permission::where('guard_name', 'web')
            ->whereNotIn('name', $permissionNames)
            ->delete();

        // Create or update permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->givePermissionTo(Permission::all());

        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->givePermissionTo([
            'assets.view',
            'assets.create',
            'assets.edit',
            'assets.delete',
            'assets.export',
            'assets.import',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.edit',
            'purchase-orders.delete',
            'purchase-orders.approve',
            'purchase-orders.reject',
            'purchase-orders.receive',
            'purchase-orders.bulk-operations',
            'work-orders.view',
            'work-orders.create',
            'work-orders.edit',
            'work-orders.delete',
            'work-orders.approve',
            'work-orders.reject',
            'work-orders.complete',
            'work-orders.in-progress',
            'work-orders.request',
            'departments.view',
            'departments.create',
            'departments.edit',
            'departments.delete',
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.delete',
            'subcategories.view',
            'subcategories.create',
            'subcategories.edit',
            'subcategories.delete',
            'locations.view',
            'locations.create',
            'locations.edit',
            'locations.delete',
            'staff.view',
            'staff.create',
            'staff.edit',
            'staff.delete',
            'reports.view',
            'reports.asset-summary',
            'reports.maintenance-insights',
            'reports.maintenance-activity-report',
            'reports.maintenance-by-staff',
            'reports.purchase-order-report',
            'dashboard.widgets.total-assets',
            'dashboard.widgets.work-orders',
            'dashboard.widgets.purchase-orders',
            'dashboard.widgets.total-asset-value',
            'dashboard.widgets.assets-by-status',
            'dashboard.widgets.work-orders-by-priority',
            'dashboard.widgets.assets-by-location',
            'dashboard.widgets.assets-by-category',
            'dashboard.widgets.purchase-orders-trend',
            'dashboard.widgets.work-orders-trend',
            'dashboard.widgets.recent-work-orders',
            'dashboard.widgets.recent-purchase-orders',
            'settings.general',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign-roles',
        ]);

        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->givePermissionTo([
            'assets.view',
            'assets.create',
            'assets.edit',
            'purchase-orders.view',
            'purchase-orders.create',
            'purchase-orders.edit',
            'purchase-orders.approve',
            'purchase-orders.reject',
            'purchase-orders.receive',
            'work-orders.view',
            'work-orders.create',
            'work-orders.edit',
            'work-orders.approve',
            'work-orders.reject',
            'work-orders.complete',
            'work-orders.in-progress',
            'work-orders.request',
            'departments.view',
            'categories.view',
            'subcategories.view',
            'locations.view',
            'staff.view',
            'reports.view',
            'reports.asset-summary',
            'reports.maintenance-insights',
            'reports.maintenance-activity-report',
            'reports.maintenance-by-staff',
            'reports.purchase-order-report',
            'dashboard.widgets.total-assets',
            'dashboard.widgets.work-orders',
            'dashboard.widgets.purchase-orders',
            'dashboard.widgets.total-asset-value',
            'dashboard.widgets.assets-by-status',
            'dashboard.widgets.work-orders-by-priority',
            'dashboard.widgets.assets-by-location',
            'dashboard.widgets.assets-by-category',
            'dashboard.widgets.purchase-orders-trend',
            'dashboard.widgets.work-orders-trend',
            'dashboard.widgets.recent-work-orders',
            'dashboard.widgets.recent-purchase-orders',
        ]);

        $user = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);
        $user->givePermissionTo([
            'assets.view',
            'purchase-orders.view',
            'work-orders.view',
            'work-orders.create',
            'work-orders.request',
            'departments.view',
            'categories.view',
            'subcategories.view',
            'locations.view',
            'staff.view',
        ]);

        // Assign Super Admin role to existing super admin users
        User::where('is_super_admin', true)->each(function (User $user): void {
            $user->assignRole('Super Admin');
        });
    }
}
