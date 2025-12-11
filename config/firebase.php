<?php

declare(strict_types=1);

return [
    /*
     * ------------------------------------------------------------------------
     * Default Firebase Project
     * ------------------------------------------------------------------------
     */
    'default' => env('FIREBASE_PROJECT', 'app'),

    /*
     * ------------------------------------------------------------------------
     * Firebase Projects Configuration
     * ------------------------------------------------------------------------
     */
    'projects' => [
        'app' => [
            /*
             * Path to the Firebase Service Account JSON file.
             *
             * Download this file from:
             * Firebase Console > Project Settings > Service Accounts > Generate new private key
             *
             * Store the file in: storage/app/firebase/service-account.json
             */
            'credentials' => storage_path('app/firebase/service-account.json'),

            /*
             * Database URL (only needed if using Realtime Database)
             */
            'database' => [
                'url' => env('FIREBASE_DATABASE_URL'),
            ],
        ],
    ],
];
