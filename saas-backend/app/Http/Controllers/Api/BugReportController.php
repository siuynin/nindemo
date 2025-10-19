<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BugReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BugReportController extends Controller
{
    /**
     * Display a listing of the user's bug reports.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = BugReport::where('user_id', $user->id)->with('user:id,name,email');

            // Filter by status if provided
            if ($request->has('status')) {
                $query->byStatus($request->status);
            }

            $bugReports = $query->orderBy('created_at', 'desc')->paginate(10);

            return response()->json([
                'success' => true,
                'data' => $bugReports
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy danh sách báo cáo lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created bug report.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'screenshots' => 'nullable|array',
                'screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $screenshotUrls = [];

            // Handle screenshot uploads
            if ($request->hasFile('screenshots')) {
                foreach ($request->file('screenshots') as $screenshot) {
                    $path = $screenshot->store('bug-reports', 'public');
                    $screenshotUrls[] = Storage::url($path);
                }
            }

            $bugReport = BugReport::create([
                'user_id' => $user->id,
                'title' => $request->title,
                'description' => $request->description,
                'screenshots' => $screenshotUrls,
                'status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Báo cáo lỗi đã được gửi thành công',
                'data' => $bugReport->load('user:id,name,email')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tạo báo cáo lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified bug report.
     */
    public function show(string $id)
    {
        try {
            $user = Auth::user();
            $bugReport = BugReport::where('id', $id)
                ->where('user_id', $user->id)
                ->with('user:id,name,email')
                ->first();

            if (!$bugReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy báo cáo lỗi'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $bugReport
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thông tin báo cáo lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified bug report (only title and description).
     */
    public function update(Request $request, string $id)
    {
        try {
            $user = Auth::user();
            $bugReport = BugReport::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$bugReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy báo cáo lỗi'
                ], 404);
            }

            // Only allow updates if status is pending
            if ($bugReport->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể chỉnh sửa báo cáo lỗi đang chờ xử lý'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $bugReport->update($request->only(['title', 'description']));

            return response()->json([
                'success' => true,
                'message' => 'Báo cáo lỗi đã được cập nhật',
                'data' => $bugReport->load('user:id,name,email')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể cập nhật báo cáo lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified bug report.
     */
    public function destroy(string $id)
    {
        try {
            $user = Auth::user();
            $bugReport = BugReport::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$bugReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy báo cáo lỗi'
                ], 404);
            }

            // Only allow deletion if status is pending
            if ($bugReport->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể xóa báo cáo lỗi đang chờ xử lý'
                ], 403);
            }

            // Delete screenshot files
            if ($bugReport->screenshots) {
                foreach ($bugReport->screenshots as $screenshotUrl) {
                    $path = str_replace('/storage/', '', $screenshotUrl);
                    Storage::disk('public')->delete($path);
                }
            }

            $bugReport->delete();

            return response()->json([
                'success' => true,
                'message' => 'Báo cáo lỗi đã được xóa'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa báo cáo lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
