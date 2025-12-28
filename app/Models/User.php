<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use League\Flysystem\GoogleCloudStorage\UniformBucketLevelAccessVisibility;
use Illuminate\Support\Facades\Storage;

final class User extends Auth\User
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'profile_picture_url',
    ];

    /**
     * @return string[]
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the profile picture URL with a signed link.
     */
    public function getProfilePictureUrlAttribute(): ?string
    {
        if (empty($this->profile_picture)) {
            return null;
        }

        try {
            $keyFilePath = storage_path(Settings::get('gcs_key_file_path', 'app/gcs/upload-service-account.json'));

            config([
                'filesystems.disks.gcs.driver'             => 'gcs',
                'filesystems.disks.gcs.project_id'         => Settings::get('gcs_project_id'),
                'filesystems.disks.gcs.key_file_path'      => $keyFilePath,
                'filesystems.disks.gcs.bucket'             => Settings::get('gcs_bucket'),
                'filesystems.disks.gcs.path_prefix'        => Settings::get('gcs_path_prefix'),
                'filesystems.disks.gcs.storage_api_uri'    => Settings::get('gcs_api_uri'),
                'filesystems.disks.gcs.visibility_handler' => UniformBucketLevelAccessVisibility::class,
                'filesystems.disks.gcs.throw'              => true,
            ]);

            return Storage::disk('gcs')->temporaryUrl($this->profile_picture, now()->addMinutes(60));
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get the FCM tokens associated with this user.
     *
     * @return HasMany<FcmToken, $this>
     */
    public function fcmTokens(): HasMany
    {
        return $this->hasMany(FcmToken::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
