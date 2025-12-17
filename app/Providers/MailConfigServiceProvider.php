<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Settings;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

final class MailConfigServiceProvider extends ServiceProvider
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
     * 
     * Load SMTP settings from database and configure the mailer.
     */
    public function boot(): void
    {
        // Only run if the database is available and the settings table exists
        if (!$this->isDatabaseReady()) {
            return;
        }

        try {
            $this->configureMailFromDatabase();
        } catch (\Exception $e) {

        }
    }

    /**
     * Check if the database is ready and settings table exists.
     */
    private function isDatabaseReady(): bool
    {
        try {
            // Check if we can connect to the database
            if (!Schema::hasTable('settings')) {
                return false;
            }
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Configure mail settings from database.
     */
    private function configureMailFromDatabase(): void
    {
        // Fetch all SMTP-related settings from database
        $settings = Settings::whereIn('name', [
            'smtp_host',
            'smtp_port',
            'smtp_security',
            'smtp_username',
            'smtp_password',
            'smtp_from_name',
            'smtp_from_email',
        ])->pluck('value', 'name')->toArray();

        // Only configure if we have at least the host setting
        if (empty($settings['smtp_host'])) {
            return;
        }

        // Set the default mailer to SMTP
        Config::set('mail.default', 'smtp');

        // Configure SMTP transport settings
        Config::set('mail.mailers.smtp.host', $settings['smtp_host']);
        
        if (!empty($settings['smtp_port'])) {
            Config::set('mail.mailers.smtp.port', (int) $settings['smtp_port']);
        }

        if (!empty($settings['smtp_username'])) {
            Config::set('mail.mailers.smtp.username', $settings['smtp_username']);
        }

        if (!empty($settings['smtp_password'])) {
            Config::set('mail.mailers.smtp.password', $settings['smtp_password']);
        }

        // Configure encryption/security (Laravel 11+ uses 'scheme' instead of 'encryption')
        // Valid schemes: 'smtp' (for STARTTLS/TLS on port 587), 'smtps' (for SSL on port 465)
        if (!empty($settings['smtp_security']) && $settings['smtp_security'] !== 'none') {
            if ($settings['smtp_security'] === 'ssl' || $settings['smtp_security'] === 'smtps') {
                Config::set('mail.mailers.smtp.scheme', 'smtps');
            } else {
                Config::set('mail.mailers.smtp.scheme', 'smtp');
            }
        } else {
            // No encryption
            Config::set('mail.mailers.smtp.scheme', 'smtp');
        }

        // Configure "From" address
        if (!empty($settings['smtp_from_email'])) {
            Config::set('mail.from.address', $settings['smtp_from_email']);
        }

        if (!empty($settings['smtp_from_name'])) {
            Config::set('mail.from.name', $settings['smtp_from_name']);
        }
    }
}
