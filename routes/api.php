<?php

declare(strict_types=1);

use App\Http\Controllers\Api\FcmTokenController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationTestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// FCM Token Management - uses optional auth (works for both authenticated and guest)
Route::middleware('web')->group(function (): void {
    // Store or update FCM token (links to user if authenticated)
    Route::post('/fcm-token', [FcmTokenController::class, 'store'])
        ->name('api.fcm-token.store');

    // Remove FCM token
    Route::delete('/fcm-token', [FcmTokenController::class, 'destroy'])
        ->name('api.fcm-token.destroy');

    // User notifications
    Route::get('/notifications', [NotificationController::class, 'index'])
        ->name('api.notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
        ->name('api.notifications.mark-as-read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('api.notifications.mark-all-as-read');
});

// FCM Status and Test endpoints
Route::prefix('notifications')->name('api.notifications.')->group(function (): void {
    // Check FCM status
    Route::get('/status', [NotificationTestController::class, 'status'])
        ->name('status');

    // Test endpoint - send to all tokens (for debugging)
    Route::post('/test/broadcast', [NotificationTestController::class, 'broadcast'])
        ->name('test.broadcast');

    // Test endpoint - send to specific user
    Route::post('/test/user/{userId}', [NotificationTestController::class, 'toUser'])
        ->name('test.to-user');
});
