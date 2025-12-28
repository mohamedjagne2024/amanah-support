<?php

declare(strict_types=1);

namespace App\Actions\Fortify;

use App\Models\User;
use App\Models\Settings;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Fortify\Contracts\UpdatesUserProfileInformation;
use League\Flysystem\GoogleCloudStorage\UniformBucketLevelAccessVisibility;

final class UpdateUserProfileInformation implements UpdatesUserProfileInformation
{
    /**
     * @param  array  $input
     */
    public function update(User $user, array $input): void
    {
        Validator::make($input, [
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->getKey()),
            ],
            'profile_picture' => [
                'nullable',
                'image',
                'max:2048', // 2MB max
            ],
        ])->validate();

        $profilePicturePath = $user->profile_picture;

        // Handle profile picture upload
        if (isset($input['profile_picture']) && $input['profile_picture'] instanceof \Illuminate\Http\UploadedFile) {
            // Delete old profile picture if exists
            if (!empty($user->profile_picture)) {
                $this->deleteFromStorage($user->profile_picture);
            }

            // Upload new profile picture
            $profilePicturePath = $this->uploadToStorage($input['profile_picture'], 'profile-pictures');
        }

        $email = $user->getAttribute('email');

        /** @phpstan-ignore-next-line */
        if ($user instanceof MustVerifyEmail && $input['email'] !== $email) {
            $this->updateVerifiedUser($user, $input, $profilePicturePath);
        } else {
            $user->forceFill([
                'name' => $input['name'],
                'email' => $input['email'],
                'profile_picture' => $profilePicturePath,
            ])->save();
        }
    }

    /**
     * @param  array  $input
     */
    private function updateVerifiedUser(User $user, array $input, ?string $profilePicturePath): void
    {
        $user->forceFill([
            'name' => $input['name'],
            'email' => $input['email'],
            'email_verified_at' => null,
            'profile_picture' => $profilePicturePath,
        ])->save();

        $user->sendEmailVerificationNotification();
    }

    /**
     * Configure Google Cloud Storage from database settings.
     */
    private function configureGCS(): void
    {
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
    }

    /**
     * Upload a file to storage and return the path.
     */
    private function uploadToStorage(\Illuminate\Http\UploadedFile $file, string $directory): string|false
    {
        $this->configureGCS();

        $uniqueFileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();

        return Storage::disk('gcs')->putFileAs($directory, $file, $uniqueFileName);
    }

    /**
     * Delete a file from storage.
     */
    private function deleteFromStorage(string $filePath): bool
    {
        $this->configureGCS();

        try {
            return Storage::disk('gcs')->delete($filePath);
        } catch (\Exception $e) {
            return false;
        }
    }
}
