<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule ticket escalation check to run every minute
Schedule::command('tickets:check-escalation')->everyMinute()->withoutOverlapping();

// Schedule auto-close for resolved tickets to run every minute
Schedule::command('tickets:auto-close')->everyMinute()->withoutOverlapping();
