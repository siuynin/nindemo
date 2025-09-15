<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VoiceController extends Controller
{
    /**
     * Get public voices from ElevenLabs platform
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Get query parameters for filtering
            $category = $request->query('category');
            $gender = $request->query('gender');
            $language = $request->query('language');
            $perPage = $request->query('per_page', 15);
            $page = $request->query('page', 1);

            // Build query for public ElevenLabs voices
            $query = Voice::publicElevenlab();

            // Apply filters if provided
            if ($category) {
                $query->byCategory($category);
            }

            if ($gender) {
                $query->byGender($gender);
            }

            if ($language) {
                $query->byLanguage($language);
            }

            // Get paginated results
            $voices = $query->orderBy('created_at', 'desc')
                          ->paginate($perPage, ['*'], 'page', $page);

            // Format response data
            $formattedVoices = $voices->getCollection()->map(function ($voice) {
                return [
                    'id' => $voice->id,
                    'voice_id' => $voice->voice_id,
                    'name' => $voice->name,
                    'category' => $voice->category,
                    'gender' => $voice->processed_gender,
                    'age' => $voice->processed_age,
                    'language' => $voice->processed_languages
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Public voices retrieved successfully',
                'data' => [
                    'voices' => $formattedVoices,
                    'pagination' => [
                        'current_page' => $voices->currentPage(),
                        'last_page' => $voices->lastPage(),
                        'per_page' => $voices->perPage(),
                        'total' => $voices->total(),
                        'from' => $voices->firstItem(),
                        'to' => $voices->lastItem()
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve public voices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific public voice by ID
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $voice = Voice::publicElevenlab()->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Voice retrieved successfully',
                'data' => [
                    'id' => $voice->id,
                    'voice_id' => $voice->voice_id,
                    'name' => $voice->name,
                    'category' => $voice->category,
                    'gender' => $voice->processed_gender,
                    'age' => $voice->processed_age,
                    'description' => $voice->description,
                    'language' => $voice->processed_languages
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Voice not found or not available',
                'error' => $e->getMessage()
            ], 404);
        }
    }
}