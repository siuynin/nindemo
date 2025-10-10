<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Http\Controllers\Api\UserCreditController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Http\Response;

class FileController extends Controller
{
    protected $userCreditController;

    public function __construct(UserCreditController $userCreditController)
    {
        $this->userCreditController = $userCreditController;
    }

    /**
     * Get user's files
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->files();

        // Filter by file type
        if ($request->has('file_type')) {
            $query->ofType($request->file_type);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('original_name', 'like', '%' . $request->search . '%');
        }

        // Pagination
        $files = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $files
        ]);
    }

    /**
     * Upload file
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB max
            'is_public' => 'boolean',
            'metadata' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $uploadedFile = $request->file('file');
        
        // Calculate credits needed (1 credit per MB)
        $fileSizeInMB = ceil($uploadedFile->getSize() / 1024 / 1024);
        $creditsNeeded = max(1, $fileSizeInMB);

        // Check if user has enough credits
        if ($user->total_remaining_credits < $creditsNeeded) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient credits. Please top up your account.',
                'required_credits' => $creditsNeeded,
                'available_credits' => $user->total_remaining_credits
            ], 402);
        }

        // Use credits
        $creditResult = $this->userCreditController->useCredits($user, $creditsNeeded);
        if (!$creditResult['success']) {
            return response()->json($creditResult, 402);
        }

        // Generate unique filename
        $originalName = $uploadedFile->getClientOriginalName();
        $extension = $uploadedFile->getClientOriginalExtension();
        $storedName = Str::uuid() . '.' . $extension;
        
        // Store file
        $path = $uploadedFile->storeAs('uploads', $storedName, 'public');
        
        // Create file record
        $file = File::create([
            'user_id' => $user->id,
            'original_name' => $originalName,
            'stored_name' => $storedName,
            'file_path' => $path,
            'mime_type' => $uploadedFile->getMimeType(),
            'file_size' => $uploadedFile->getSize(),
            'file_extension' => $extension,
            'file_type' => $this->getFileType($uploadedFile->getMimeType()),
            'is_public' => $request->get('is_public', false),
            'metadata' => $request->get('metadata', []),
            'hash' => hash_file('sha256', $uploadedFile->getRealPath())
        ]);

        return response()->json([
            'success' => true,
            'message' => 'File uploaded successfully',
            'data' => [
                'file' => $file,
                'credits_used' => $creditsNeeded,
                'remaining_credits' => $user->fresh()->total_remaining_credits
            ]
        ], 201);
    }

    /**
     * Get file details
     */
    public function show(Request $request, File $file)
    {
        $user = $request->user();
        
        // Check if user owns the file or file is public
        if ($file->user_id !== $user->id && !$file->is_public) {
            return response()->json([
                'success' => false,
                'message' => 'File not found or access denied'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => ['file' => $file]
        ]);
    }

    /**
     * Download file
     */
    public function download(Request $request, File $file)
    {
        $user = $request->user();
        
        // Check if user owns the file or file is public
        if ($file->user_id !== $user->id && !$file->is_public) {
            return response()->json([
                'success' => false,
                'message' => 'File not found or access denied'
            ], 404);
        }

        // Check if file exists
        if (!Storage::disk('public')->exists($file->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found on storage'
            ], 404);
        }

        // Increment download count
        $file->incrementDownloadCount();

        // Return file download
        return Storage::disk('public')->download(
            $file->file_path,
            $file->original_name
        );
    }

    /**
     * Update file metadata
     */
    public function update(Request $request, File $file)
    {
        $user = $request->user();
        
        // Check if user owns the file
        if ($file->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'File not found or access denied'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'is_public' => 'boolean',
            'metadata' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $file->update($request->only(['is_public', 'metadata']));

        return response()->json([
            'success' => true,
            'message' => 'File updated successfully',
            'data' => ['file' => $file->fresh()]
        ]);
    }

    /**
     * Delete file
     */
    public function destroy(Request $request, File $file)
    {
        $user = $request->user();
        
        // Check if user owns the file
        if ($file->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'File not found or access denied'
            ], 404);
        }

        // Delete file from storage
        if (Storage::disk('public')->exists($file->file_path)) {
            Storage::disk('public')->delete($file->file_path);
        }

        // Delete file record
        $file->delete();

        return response()->json([
            'success' => true,
            'message' => 'File deleted successfully'
        ]);
    }

    /**
     * Get public files
     */
    public function publicFiles(Request $request)
    {
        $query = File::public()->with('user:id,name');

        // Filter by file type
        if ($request->has('file_type')) {
            $query->ofType($request->file_type);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('original_name', 'like', '%' . $request->search . '%');
        }

        $files = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $files
        ]);
    }

    /**
     * Determine file type based on MIME type
     */
    private function getFileType($mimeType)
    {
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        } elseif (in_array($mimeType, [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ])) {
            return 'document';
        } else {
            return 'other';
        }
    }
}
