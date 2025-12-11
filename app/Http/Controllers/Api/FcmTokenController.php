<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FcmToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class FcmTokenController extends Controller
{
    /**
     * Store or update an FCM token for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:500'],
            'device' => ['nullable', 'string', 'max:255'],
        ]);

        // Get user from web session
        $user = Auth::user();

        FcmToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $user?->id,
                'device' => $validated['device'] ?? $request->userAgent(),
            ]
        );

        return response()->json([
            'status' => 'ok',
            'message' => 'FCM token saved successfully.',
            'user_id' => $user?->id,
        ]);
    }

    /**
     * Remove an FCM token.
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        FcmToken::where('token', $validated['token'])->delete();

        return response()->json([
            'status' => 'ok',
            'message' => 'FCM token removed successfully.',
        ]);
    }
}
