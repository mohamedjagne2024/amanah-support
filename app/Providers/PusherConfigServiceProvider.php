<?php

namespace App\Providers;

use App\Models\Settings;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class PusherConfigServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->app->booted(function () {
            $this->configurePusherFromDatabase();
        });
    }

    /**
     * Configure Pusher broadcasting driver from database settings.
     */
    protected function configurePusherFromDatabase(): void
    {
        try {
            if (!Schema::hasTable('settings')) {
                return;
            }

            $appId = Settings::get('pusher_app_id');
            $appKey = Settings::get('pusher_app_key');
            $appSecret = Settings::get('pusher_app_secret');
            $appCluster = Settings::get('pusher_app_cluster');

            if ($appId && $appKey && $appSecret && $appCluster) {
                config([
                    'broadcasting.default' => 'pusher',
                    'broadcasting.connections.pusher' => [
                        'driver' => 'pusher',
                        'key' => $appKey,
                        'secret' => $appSecret,
                        'app_id' => $appId,
                        'options' => [
                            'cluster' => $appCluster,
                            'useTLS' => true,
                            'encrypted' => true,
                        ],
                    ],
                ]);
            }
        } catch (\Exception $e) {
            // Silently fail if database is not ready
        }
    }
}
