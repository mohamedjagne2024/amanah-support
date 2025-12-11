<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Model::unguard();
        Model::preventsLazyLoading();
        Model::preventAccessingMissingAttributes();

        // Super admins bypass all permission checks
        Gate::before(static function ($user): ?bool {
            return $user?->is_super_admin ? true : null;
        });
    }
}
