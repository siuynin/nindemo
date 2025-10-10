<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AudioStorageService
{
    /**
     * Upload audio content to S3
     */
    public function uploadAudioContent(string $audioContent, string $format = 'mp3', string $folder = 'generated-audio'): string
    {
        try {
            Log::info('Uploading audio content to S3', ['format' => $format, 'folder' => $folder]);

            // Generate unique filename with proper extension
            $extension = $this->getFileExtension($format);
            $filename = $folder . '/' . Str::uuid() . '.' . $extension;
            
            // Upload to S3
            $uploaded = Storage::disk('s3')->put($filename, $audioContent);
            
            if (!$uploaded) {
                throw new \Exception('Failed to upload audio to S3');
            }

            // Get the public URL
            $s3Url = Storage::disk('s3')->url($filename);
            
            Log::info('Audio uploaded successfully', [
                's3_url' => $s3Url,
                'filename' => $filename,
                'size' => strlen($audioContent)
            ]);

            return $s3Url;
        } catch (\Exception $e) {
            Log::error('Audio upload failed', [
                'error' => $e->getMessage(),
                'format' => $format
            ]);
            throw $e;
        }
    }

    /**
     * Download audio from URL and upload to S3
     */
    public function uploadAudioFromUrl(string $audioUrl, string $folder = 'generated-audio'): string
    {
        try {
            Log::info('Downloading audio from URL', ['url' => $audioUrl]);

            // Download audio from URL
            $response = Http::timeout(300)->get($audioUrl);
            
            if (!$response->successful()) {
                throw new \Exception('Failed to download audio from URL: ' . $audioUrl);
            }

            $audioContent = $response->body();
            
            // Detect format from URL or content type
            $format = $this->detectAudioFormat($audioUrl, $response->header('Content-Type'));
            
            return $this->uploadAudioContent($audioContent, $format, $folder);
        } catch (\Exception $e) {
            Log::error('Audio download and upload failed', [
                'url' => $audioUrl,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get file extension based on audio format
     */
    private function getFileExtension(string $format): string
    {
        $extensions = [
            'mp3' => 'mp3',
            'wav' => 'wav',
            'ogg' => 'ogg',
            'aac' => 'aac',
            'm4a' => 'm4a',
            'flac' => 'flac'
        ];

        return $extensions[strtolower($format)] ?? 'mp3';
    }

    /**
     * Detect audio format from URL or content type
     */
    private function detectAudioFormat(string $url, ?string $contentType): string
    {
        // Try to detect from content type first
        if ($contentType) {
            $contentTypeMap = [
                'audio/mpeg' => 'mp3',
                'audio/mp3' => 'mp3',
                'audio/wav' => 'wav',
                'audio/wave' => 'wav',
                'audio/ogg' => 'ogg',
                'audio/aac' => 'aac',
                'audio/mp4' => 'm4a',
                'audio/flac' => 'flac'
            ];

            if (isset($contentTypeMap[$contentType])) {
                return $contentTypeMap[$contentType];
            }
        }

        // Try to detect from URL extension
        $urlPath = parse_url($url, PHP_URL_PATH);
        if ($urlPath) {
            $extension = strtolower(pathinfo($urlPath, PATHINFO_EXTENSION));
            if (in_array($extension, ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'])) {
                return $extension;
            }
        }

        // Default to mp3
        return 'mp3';
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