<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

Route::post('/api/test-upload', function (Request $request) {
    try {
        if (!$request->hasFile('image')) {
            return response()->json([
                'success' => false,
                'error' => 'No image file provided'
            ], 400);
        }

        $file = $request->file('image');
        
        // Validate file
        if (!$file->isValid()) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid file upload'
            ], 400);
        }

        // Generate unique filename
        $extension = $file->getClientOriginalExtension();
        $filename = 'test-' . uniqid() . '.' . $extension;
        
        // Save to public directory
        $path = 'uploads/runninghub-inputs/' . $filename;
        $file->move(public_path('uploads/runninghub-inputs'), $filename);
        
        $url = url($path);
        
        Log::info('Test upload successful', [
            'filename' => $filename,
            'path' => $path,
            'url' => $url,
            'size' => $file->getSize(),
            'mime' => $file->getMimeType()
        ]);

        return response()->json([
            'success' => true,
            'url' => $url,
            'path' => $path,
            'filename' => $filename
        ]);

    } catch (\Exception $e) {
        Log::error('Test upload failed', ['error' => $e->getMessage()]);
        
        return response()->json([
            'success' => false,
            'error' => 'Upload failed: ' . $e->getMessage()
        ], 500);
    }
});

Route::get('/api/test-runninghub', function () {
    // Test the RunningHubImageService
    try {
        $service = app(\App\Services\RunningHubImageService::class);
        
        // Test with a sample base64 image (1x1 red pixel)
        $testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        
        $result = $service->processImage($testBase64, 'test-image');
        
        return response()->json([
            'success' => true,
            'result' => $result,
            'message' => 'RunningHub service test completed'
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'RunningHub service test failed: ' . $e->getMessage()
        ], 500);
    }
});