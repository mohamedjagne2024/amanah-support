<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Inertia\Middleware;
use App\Models\Settings;
use Illuminate\Http\Request;
use App\Navigation\Navigation;
use App\Helpers\DateFormatHelper;

final class HandleInertiaRequests extends Middleware
{
    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return \array_merge(parent::share($request), [
            'auth.user' => fn() => $user ? array_merge(
                $user->only('id', 'name', 'email'),
                ['profile_picture_url' => $user->profile_picture_url]
            ) : null,

            'auth.permissions' => fn() => $user?->getAllPermissions()->pluck('name')->toArray() ?? [],

            'auth.roles' => fn() => $user?->getRoleNames()->toArray() ?? [],

            'fortify.features' => fn() => \config('fortify.features', []),

            'location.params' => fn() => (object) $request->query(),
            'location.search' => fn() => \sprintf('?%s', $request->getQueryString() ?: ''),

            'flash' => fn() => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],

            'settings.dateFormat' => fn() => [
                'php' => Settings::where('name', 'date_format')->first()?->value ?? 'Y-m-d',
                'js' => DateFormatHelper::phpToJsFormat(
                    Settings::where('name', 'date_format')->first()?->value ?? 'Y-m-d'
                ),
            ],

            'pusher' => fn() => [
                'key' => Settings::where('name', 'pusher_app_key')->first()?->value,
                'cluster' => Settings::where('name', 'pusher_app_cluster')->first()?->value,
            ],
        ]);
    }
}
