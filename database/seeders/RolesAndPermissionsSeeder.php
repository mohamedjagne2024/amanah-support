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

        // Define the permissions that should exist based on routes
        $permissions = [
            // Dashboard
            'dashboard.view',

            // Tickets
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.update',
            'tickets.delete',
            'tickets.restore',
            'tickets.comment',
            'tickets.csv.import',
            'tickets.csv.export',

            // Notes
            'notes.view',
            'notes.save',
            'notes.delete',

            // Contacts
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.update',
            'contacts.delete',
            'contacts.restore',

            // Categories
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.update',
            'categories.delete',
            'categories.restore',

            // Chat
            'chat.view',
            'chat.create',
            'chat.edit',
            'chat.update',
            'chat.delete',
            'chat.restore',
            'chat.message',
            'chat.init',
            'chat.conversation',
            'chat.send_message',

            // Priorities
            'priorities.view',
            'priorities.create',
            'priorities.edit',
            'priorities.update',
            'priorities.delete',
            'priorities.restore',

            // FAQs
            'faqs.view',
            'faqs.create',
            'faqs.edit',
            'faqs.update',
            'faqs.delete',
            'faqs.restore',

            // Knowledge Base
            'knowledge_base.view',
            'knowledge_base.create',
            'knowledge_base.edit',
            'knowledge_base.update',
            'knowledge_base.delete',

            // Statuses
            'statuses.view',
            'statuses.create',
            'statuses.edit',
            'statuses.update',
            'statuses.delete',
            'statuses.restore',

            // Departments
            'departments.view',
            'departments.create',
            'departments.edit',
            'departments.update',
            'departments.delete',
            'departments.restore',

            // Types
            'types.view',
            'types.create',
            'types.edit',
            'types.update',
            'types.delete',
            'types.restore',

            // Email Templates
            'templates.view',
            'templates.edit',
            'templates.update',

            // Pending Users
            'pending_users.view',
            'pending_users.active',
            'pending_users.decline',

            // Contacts
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.update',
            'contacts.delete',
            'contacts.restore',

            // Organizations
            'organizations.view',
            'organizations.create',
            'organizations.edit',
            'organizations.update',
            'organizations.delete',
            'organizations.restore',

            // Front Pages
            'front_pages.view',
            'front_pages.update',
            'upload.image',

            // Reports
            'reports.view',

            // Settings
            'settings.general',
            'settings.general.update',
            'settings.user-management',
            'settings.users.store',
            'settings.users.assign-roles',
            'settings.users.assign-permissions',
            'settings.users.assign-roles-and-permissions',
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

            // Permissions
            'permissions.view',

            // Images
            'images.cke_upload',
            'images.view',

            // Cron Jobs (typically admin only)
            'cron.imap.run',
            'cron.piping',
            'cron.queue_work',
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
            'dashboard.view',
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.update',
            'tickets.delete',
            'tickets.restore',
            'tickets.comment',
            'tickets.csv.import',
            'tickets.csv.export',
            'notes.view',
            'notes.save',
            'notes.delete',
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.update',
            'contacts.delete',
            'contacts.restore',
            'categories.view',
            'categories.create',
            'categories.edit',
            'categories.update',
            'categories.delete',
            'categories.restore',
            'chat.view',
            'chat.create',
            'chat.edit',
            'chat.update',
            'chat.delete',
            'chat.restore',
            'chat.message',
            'chat.init',
            'chat.conversation',
            'chat.send_message',
            'priorities.view',
            'priorities.create',
            'priorities.edit',
            'priorities.update',
            'priorities.delete',
            'priorities.restore',
            'faqs.view',
            'faqs.create',
            'faqs.edit',
            'faqs.update',
            'faqs.delete',
            'faqs.restore',
            'knowledge_base.view',
            'knowledge_base.create',
            'knowledge_base.edit',
            'knowledge_base.update',
            'knowledge_base.delete',
            'statuses.view',
            'statuses.create',
            'statuses.edit',
            'statuses.update',
            'statuses.delete',
            'statuses.restore',
            'departments.view',
            'departments.create',
            'departments.edit',
            'departments.update',
            'departments.delete',
            'departments.restore',
            'types.view',
            'types.create',
            'types.edit',
            'types.update',
            'types.delete',
            'types.restore',
            'templates.view',
            'templates.edit',
            'templates.update',
            'pending_users.view',
            'pending_users.active',
            'pending_users.decline',
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.update',
            'contacts.delete',
            'contacts.restore',
            'organizations.view',
            'organizations.create',
            'organizations.edit',
            'organizations.update',
            'organizations.delete',
            'organizations.restore',
            'front_pages.view',
            'front_pages.update',
            'upload.image',
            'reports.view',
            'settings.general',
            'settings.general.update',
            'settings.user-management',
            'settings.users.store',
            'settings.users.assign-roles',
            'settings.users.assign-permissions',
            'settings.users.assign-roles-and-permissions',
            'settings.roles-permissions',
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'users.assign-roles',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.view',
            'images.cke_upload',
            'images.view',
            'cron.imap.run',
            'cron.piping',
            'cron.queue_work',
        ]);

        $manager = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $manager->givePermissionTo([
            'dashboard.view',
            'tickets.view',
            'tickets.create',
            'tickets.edit',
            'tickets.update',
            'tickets.comment',
            'tickets.csv.export',
            'notes.view',
            'notes.save',
            'notes.delete',
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.update',
            'chat.view',
            'chat.create',
            'chat.edit',
            'chat.update',
            'chat.message',
            'chat.init',
            'chat.conversation',
            'chat.send_message',
            'priorities.view',
            'faqs.view',
            'knowledge_base.view',
            'statuses.view',
            'departments.view',
            'types.view',
            'templates.view',
            'contacts.view',
            'contacts.create',
            'contacts.edit',
            'contacts.update',
            'organizations.view',
            'reports.view',
            'images.view',
        ]);

        $user = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);
        $user->givePermissionTo([
            'dashboard.view',
            'tickets.view',
            'tickets.create',
            'tickets.comment',
            'notes.view',
            'notes.save',
            'contacts.view',
            'chat.view',
            'chat.message',
            'chat.init',
            'chat.conversation',
            'chat.send_message',
            'faqs.view',
            'knowledge_base.view',
            'images.view',
        ]);

        // Assign Super Admin role to existing super admin users
        User::where('is_super_admin', true)->each(function (User $user): void {
            $user->assignRole('Super Admin');
        });
    }
}
