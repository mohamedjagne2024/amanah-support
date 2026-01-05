<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

final class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Define the permissions that should exist based on routes
        $permissions = [
            // Dashboard
            'dashboard.view',

            // Tickets
            'tickets.view',
            'tickets.create',
            'tickets.update',
            'tickets.delete',
            'tickets.restore',
            'tickets.comment',
            'tickets.csv.import',
            'tickets.csv.export',

            // Notes
            'notes.view',
            'notes.create',
            'notes.update',
            'notes.delete',

            // Contacts
            'contacts.view',
            'contacts.create',
            'contacts.update',
            'contacts.delete',
            'contacts.restore',

            // Categories
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'categories.restore',

            // Chat
            'chat.view',
            'chat.create',
            'chat.update',
            'chat.delete',
            'chat.restore',

            // FAQs
            'faqs.view',
            'faqs.create',
            'faqs.update',
            'faqs.delete',
            'faqs.restore',

            // Knowledge Base
            'knowledge_base.view',
            'knowledge_base.create',
            'knowledge_base.update',
            'knowledge_base.delete',

            // Regions
            'regions.view',
            'regions.create',
            'regions.update',
            'regions.delete',
            'regions.restore',

            // Types
            'types.view',
            'types.create',
            'types.edit',
            'types.update',
            'types.delete',
            'types.restore',

            // Email Templates
            'templates.view',
            'templates.update',

            // Organizations
            'organizations.view',
            'organizations.create',
            'organizations.update',
            'organizations.delete',
            'organizations.restore',

            // Front Pages
            'front_pages.home',
            'front_pages.about',
            'front_pages.contact',
            'front_pages.terms',
            'front_pages.privacy',
            'front_pages.footer',

            // Reports
            'reports.view',
            'reports.staff-performance',
            'reports.support-by-organization',

            // Settings
            'settings.general',
            'settings.general.update',
            'settings.user-management',

            // Users
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Roles
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ];

        // Delete permissions that are not in the seeder list
        $permissionNames = array_map(fn($name) => $name, $permissions);
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
            // Dashboard
            'dashboard.view',

            // Tickets - Full access
            'tickets.view',
            'tickets.create',
            'tickets.update',
            'tickets.delete',
            'tickets.restore',
            'tickets.comment',
            'tickets.csv.import',
            'tickets.csv.export',

            // Notes - Full access
            'notes.view',
            'notes.create',
            'notes.update',
            'notes.delete',

            // Contacts - Full access
            'contacts.view',
            'contacts.create',
            'contacts.update',
            'contacts.delete',
            'contacts.restore',

            // Categories - Full access
            'categories.view',
            'categories.create',
            'categories.update',
            'categories.delete',
            'categories.restore',

            // Chat - Full access
            'chat.view',
            'chat.create',
            'chat.update',
            'chat.delete',
            'chat.restore',

            // FAQs - Full access
            'faqs.view',
            'faqs.create',
            'faqs.update',
            'faqs.delete',
            'faqs.restore',

            // Knowledge Base - Full access
            'knowledge_base.view',
            'knowledge_base.create',
            'knowledge_base.update',
            'knowledge_base.delete',

            // Regions - Full access
            'regions.view',
            'regions.create',
            'regions.update',
            'regions.delete',
            'regions.restore',

            // Types - Full access
            'types.view',
            'types.create',
            'types.edit',
            'types.update',
            'types.delete',
            'types.restore',

            // Templates - Full access
            'templates.view',
            'templates.update',

            // Organizations - Full access
            'organizations.view',
            'organizations.create',
            'organizations.update',
            'organizations.delete',
            'organizations.restore',

            // Front Pages - Full access
            'front_pages.home',
            'front_pages.about',
            'front_pages.contact',
            'front_pages.terms',
            'front_pages.privacy',
            'front_pages.footer',

            // Reports - Full access
            'reports.view',
            'reports.staff-performance',
            'reports.support-by-organization',

            // Settings - Full access
            'settings.general',
            'settings.general.update',
            'settings.user-management',

            // Users - Full access
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Roles - Full access
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ]);

        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->givePermissionTo([
            // Dashboard
            'dashboard.view',

            // Tickets - Create, update, view, comment, export
            'tickets.view',
            'tickets.create',
            'tickets.update',
            'tickets.comment',
            'tickets.csv.export',

            // Notes - Full access
            'notes.view',
            'notes.create',
            'notes.update',
            'notes.delete',

            // Contacts - View, create, update (no delete/restore)
            'contacts.view',
            'contacts.create',
            'contacts.update',

            // Categories - View only
            'categories.view',

            // Chat - View, create, update (no delete/restore)
            'chat.view',
            'chat.create',
            'chat.update',

            // FAQs - View and update
            'faqs.view',
            'faqs.update',

            // Knowledge Base - View and update
            'knowledge_base.view',
            'knowledge_base.update',

            // Regions - View only
            'regions.view',

            // Types - View only
            'types.view',

            // Templates - View only
            'templates.view',

            // Organizations - View only
            'organizations.view',

            // Reports - View all reports
            'reports.view',
            'reports.staff-performance',
            'reports.support-by-organization',
        ]);

        $user = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);
        $user->givePermissionTo([
            // Dashboard
            'dashboard.view',

            // Tickets - View, create, comment only
            'tickets.view',
            'tickets.create',
            'tickets.comment',

            // Notes - View and create only
            'notes.view',
            'notes.create',
            'notes.update',

            // Contacts - View only
            'contacts.view',

            // Chat - View only
            'chat.view',

            // FAQs - View only
            'faqs.view',

            // Knowledge Base - View only
            'knowledge_base.view',
        ]);

        Role::firstOrCreate(['name' => 'Contact', 'guard_name' => 'web']);

        // Assign Super Admin role to existing super admin users
        User::where('is_super_admin', true)->each(function (User $user): void {
            $user->assignRole('Super Admin');
        });
    }
}
