<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MinimaxService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MinimaxController extends Controller
{
    protected $minimaxService;

    public function __construct(MinimaxService $minimaxService)
    {
        $this->minimaxService = $minimaxService;
    }

    /**
     * Get available voices from Minimax API
     */
    public function getVoices(Request $request): JsonResponse
    {
        try {
            $page = $request->get('page', 1);
            $pageSize = $request->get('page_size', 30);
            $tagList = $request->get('tag_list', []);

            $result = $this->minimaxService->getVoices($page, $pageSize, $tagList);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result['data'],
                    'voices' => $result['voices']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch voices: ' . $e->getMessage()
            ], 500);
        }
    }
}