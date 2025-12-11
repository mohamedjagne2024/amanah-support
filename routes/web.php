<?php

declare(strict_types=1);

use Laravel\Fortify\Features;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProfileInformationController;

Route::prefix('/')->group(static function (Router $router): void {
    $router->middleware('auth')->group(static function (Router $router): void {
        $router->get('/', [DashboardController::class, 'index'])->name('home');

        if (Features::enabled(Features::updateProfileInformation())) {
            $router->get('/profile', [ProfileInformationController::class, 'show']);
        }

        $router->get('/settings/general', [SettingsController::class, 'general'])->name('settings.general');
        $router->put('/settings/general', [SettingsController::class, 'update'])->name('settings.general.update');
        $router->get('/settings/user-management', [SettingsController::class, 'userManagement'])->name('settings.user-management');
        $router->post('/settings/users', [SettingsController::class, 'store'])->name('settings.users.store');
        $router->post('/settings/users/{user}/roles', [SettingsController::class, 'assignRoles'])->name('settings.users.assign-roles');
        $router->post('/settings/users/{user}/permissions', [SettingsController::class, 'assignPermissions'])->name('settings.users.assign-permissions');
        $router->post('/settings/users/{user}/roles-and-permissions', [SettingsController::class, 'assignRolesAndPermissions'])->name('settings.users.assign-roles-and-permissions');
        $router->get('/settings/roles-permissions', [SettingsController::class, 'rolesPermissions'])->name('settings.roles-permissions');
        $router->resource('/settings', SettingsController::class);

        // Roles and Permissions Management
        $router->get('/roles', [RoleController::class, 'index'])->name('roles.index');
        $router->post('/roles', [RoleController::class, 'store'])->name('roles.store');
        $router->put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        $router->delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
        $router->get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');
    });
});
