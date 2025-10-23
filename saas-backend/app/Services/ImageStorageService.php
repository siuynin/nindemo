<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImageStorageService
{
    /**
     * Upload image from base64 data URL to S3
     */
    public function uploadImageFromBase64(string $base64Data, string $folder = 'generated-images'): string
    {
        try {
            Log::info('Uploading image from base64 data');

            // Check if it's a data URL
            if (strpos($base64Data, 'data:image/') === 0) {
                // Extract the base64 content and mime type
                $parts = explode(',', $base64Data, 2);
                if (count($parts) !== 2) {
                    throw new \Exception('Invalid base64 data URL format');
                }

                $header = $parts[0];
                $data = $parts[1];

                // Extract mime type
                preg_match('/data:image\/([a-zA-Z0-9]+)/', $header, $matches);
                $extension = isset($matches[1]) ? $matches[1] : 'png';
                
                // Decode base64
                $imageContent = base64_decode($data);
                if ($imageContent === false) {
                    throw new \Exception('Failed to decode base64 data');
                }
            } else {
                // Assume it's already base64 encoded content
                $imageContent = base64_decode($base64Data);
                if ($imageContent === false) {
                    throw new \Exception('Failed to decode base64 data');
                }
                $extension = 'png'; // Default extension
            }

            // Generate unique filename
            $filename = $folder . '/' . Str::uuid() . '.' . $extension;
            
            // Upload to S3
            $uploaded = Storage::disk('s3')->put($filename, $imageContent);
            
            if (!$uploaded) {
                throw new \Exception('Failed to upload image to S3');
            }

            // Get the public URL
            $s3Url = Storage::disk('s3')->url($filename);
            
            Log::info('Base64 image uploaded successfully', [
                's3_url' => $s3Url,
                'filename' => $filename,
                'extension' => $extension
            ]);

            return $s3Url;
        } catch (\Exception $e) {
            Log::error('Base64 image upload failed', [
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Download image from URL and upload to S3
     */
    public function uploadImageFromUrl(string $imageUrl, string $folder = 'generated-images'): string
    {
        try {
            // Check if it's a base64 data URL
            if (strpos($imageUrl, 'data:image/') === 0) {
                return $this->uploadImageFromBase64($imageUrl, $folder);
            }

            Log::info('Downloading image from URL', ['url' => $imageUrl]);

            // Download image from URL
            $response = Http::timeout(30)->get($imageUrl);
            
            if (!$response->successful()) {
                throw new \Exception('Failed to download image from URL: ' . $imageUrl);
            }

            $imageContent = $response->body();
            
            // Generate unique filename
            $filename = $folder . '/' . Str::uuid() . '.png';
            
            // Upload to S3 (without ACL since bucket doesn't support it)
            $uploaded = Storage::disk('s3')->put($filename, $imageContent);
            
            if (!$uploaded) {
                throw new \Exception('Failed to upload image to S3');
            }

            // Get the public URL
            $s3Url = Storage::disk('s3')->url($filename);
            
            Log::info('Image uploaded successfully', [
                'original_url' => $imageUrl,
                's3_url' => $s3Url,
                'filename' => $filename
            ]);

            return $s3Url;
        } catch (\Exception $e) {
            Log::error('Image upload failed', [
                'url' => $imageUrl,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Upload multiple images from URLs
     */
    public function uploadMultipleImagesFromUrls(array $imageUrls, string $folder = 'generated-images'): array
    {
        $uploadedUrls = [];
        $errors = [];

        foreach ($imageUrls as $index => $imageUrl) {
            try {
                $s3Url = $this->uploadImageFromUrl($imageUrl, $folder);
                $uploadedUrls[] = $s3Url;
            } catch (\Exception $e) {
                $errors[] = [
                    'index' => $index,
                    'url' => $imageUrl,
                    'error' => $e->getMessage()
                ];
                Log::error('Failed to upload image', [
                    'index' => $index,
                    'url' => $imageUrl,
                    'error' => $e->getMessage()
                ]);
            }
        }

        if (!empty($errors)) {
            Log::warning('Some images failed to upload', ['errors' => $errors]);
        }

        return [
            'uploaded_urls' => $uploadedUrls,
            'errors' => $errors
        ];
    }

    /**
     * Check if S3 is configured
     */
    public function isS3Configured(): bool
    {
        return !empty(env('AWS_ACCESS_KEY_ID')) && 
               !empty(env('AWS_SECRET_ACCESS_KEY')) && 
               !empty(env('AWS_BUCKET')) && 
               !empty(env('AWS_DEFAULT_REGION'));
    }

    /**
     * Get S3 configuration status
     */
    public function getS3Status(): array
    {
        return [
            'configured' => $this->isS3Configured(),
            'access_key_set' => !empty(env('AWS_ACCESS_KEY_ID')),
            'secret_key_set' => !empty(env('AWS_SECRET_ACCESS_KEY')),
            'bucket_set' => !empty(env('AWS_BUCKET')),
            'region_set' => !empty(env('AWS_DEFAULT_REGION')),
        ];
    }
}