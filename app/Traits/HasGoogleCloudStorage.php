<?php

declare(strict_types=1);

namespace App\Traits;

use App\Models\Settings;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\GoogleCloudStorage\UniformBucketLevelAccessVisibility;

/**
 * Trait for handling Google Cloud Storage operations.
 * 
 * This trait provides reusable methods for configuring GCS and generating
 * signed URLs for secure file access.
 */
trait HasGoogleCloudStorage
{
    /**
     * Configure Google Cloud Storage from database settings.
     */
    protected function configureGCS(): void
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
     * Get a signed URL for a file stored in GCS or a local asset URL.
     *
     * This method intelligently detects where the file is actually stored:
     * - GCS files typically have paths like "assets/...", "work-orders/...", "purchase-orders/..."
     * - Local public files typically have paths starting with "images/" or "storage/"
     *
     * @param string $filePath The file path in storage
     * @param int $expirationMinutes How long the signed URL should be valid (default: 60 minutes)
     * @return string The signed URL or local asset URL
     */
    protected function getStorageUrl(string $filePath, int $expirationMinutes = 60): string
    {
        // Detect if this is a GCS file based on path patterns
        // GCS files are stored with prefixes like: assets/, work-orders/, purchase-orders/
        $gcsPatterns = ['assets/', 'work-orders/', 'purchase-orders/', 'tickets/'];
        $isGcsFile = false;
        
        foreach ($gcsPatterns as $pattern) {
            if (str_starts_with($filePath, $pattern)) {
                $isGcsFile = true;
                break;
            }
        }
        
        // Also check if the file exists locally (for legacy files stored in public)
        $localPatterns = ['images/', 'storage/', 'uploads/'];
        $isLocalFile = false;
        
        foreach ($localPatterns as $pattern) {
            if (str_starts_with($filePath, $pattern) || str_contains($filePath, '/storage/')) {
                $isLocalFile = true;
                break;
            }
        }
        
        // If it looks like a GCS file, try to get from GCS
        if ($isGcsFile && !$isLocalFile) {
            try {
                $this->configureGCS();
                return Storage::disk('gcs')->temporaryUrl($filePath, now()->addMinutes($expirationMinutes));
            } catch (\Exception $e) {
                // If GCS fails, fall back to local asset
                return asset($filePath);
            }
        }
        
        // If it's explicitly a local file, return local asset URL
        if ($isLocalFile) {
            return asset($filePath);
        }
        
        // Fallback: use the current upload_destination setting
        $uploadDestination = Settings::get('upload_destination', 'public');
        
        if ($uploadDestination === 'gcs') {
            try {
                $this->configureGCS();
                return Storage::disk('gcs')->temporaryUrl($filePath, now()->addMinutes($expirationMinutes));
            } catch (\Exception $e) {
                // If GCS fails, fall back to local asset
                return asset($filePath);
            }
        }
        
        return asset($filePath);
    }

    /**
     * Check if GCS is the configured upload destination.
     */
    protected function isGcsEnabled(): bool
    {
        return Settings::get('upload_destination', 'public') === 'gcs';
    }

    /**
     * Upload a file to storage and return the path.
     *
     * @param \Illuminate\Http\UploadedFile $file The file to upload
     * @param string $directory The directory to store the file in
     * @return string|false The file path on success, false on failure
     */
    protected function uploadToStorage($file, string $directory): string|false
    {
        $this->configureGCS();
        
        $uniqueFileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        
        return Storage::disk('gcs')->putFileAs($directory, $file, $uniqueFileName);
    }

    /**
     * Delete a file from storage.
     *
     * @param string $filePath The file path to delete
     * @return bool True on success, false on failure
     */
    protected function deleteFromStorage(string $filePath): bool
    {
        $this->configureGCS();
        
        try {
            return Storage::disk('gcs')->delete($filePath);
        } catch (\Exception $e) {
            return false;
        }
    }
}
