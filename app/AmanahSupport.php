<?php

namespace App;

use App\Models\Settings;

class AmanahSupport
{
    /**
     * The AmanahSupport version.
     *
     * @var string
     */
    const VERSION = '1';

    public function getSettingsEmailNotifications(): array
    {
        $settingQuery = Settings::where('name', 'email_notifications')->first();

        // Return default values if setting doesn't exist
        if (!$settingQuery) {
            return [
                'ticket_by_contact' => false,
                'ticket_from_dashboard' => false,
                'first_comment' => false,
                'user_assigned' => false,
                'status_priority_changes' => false,
                'new_user' => false,
            ];
        }

        $settings = \json_decode($settingQuery->value, true);

        // Return default values if JSON decode fails
        if (!is_array($settings)) {
            return [
                'ticket_by_contact' => false,
                'ticket_from_dashboard' => false,
                'first_comment' => false,
                'user_assigned' => false,
                'status_priority_changes' => false,
                'new_user' => false,
            ];
        }

        return $settings;
    }

    public function getUniqueUid($id)
    {
        return (string) (100000 + $id);
    }
}
