<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BugReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminBugReportController extends Controller
{
    /**
     * Display a listing of all bug reports for admin.
     */
    public function index(Request $request)
    {
        try {
            $query = BugReport::with('user:id,name,email');

            // Filter by status if provided
            if ($request->has('status')) {
                $query->byStatus($request->status);
            }

            // Filter by user if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Search by title or description
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            $bugReports = $query->orderBy('created_at', 'desc')->paginate(15);

            // Check if this is an API request (AJAX)
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'data' => $bugReports
                ]);
            }

            // Return view for web requests
            return view('admin.bug-reports.index', compact('bugReports'));
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể lấy danh sách báo cáo lỗi',
                    'error' => $e->getMessage()
                ], 500);
            }

            return back()->with('error', 'Không thể lấy danh sách báo cáo lỗi: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified bug report for admin.
     */
    public function show(string $id)
    {
        try {
            $bugReport = BugReport::with('user:id,name,email')->find($id);

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
     * Update bug report status and admin notes.
     */
    public function update(Request $request, string $id)
    {
        try {
            $bugReport = BugReport::find($id);

            if (!$bugReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy báo cáo lỗi'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'sometimes|required|in:pending,completed',
                'admin_notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [];

            if ($request->has('status')) {
                $updateData['status'] = $request->status;
                
                // Set resolved_at when status changes to completed
                if ($request->status === 'completed') {
                    $updateData['resolved_at'] = now();
                } else {
                    $updateData['resolved_at'] = null;
                }
            }

            if ($request->has('admin_notes')) {
                $updateData['admin_notes'] = $request->admin_notes;
            }

            $bugReport->update($updateData);

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
     * Delete bug report (admin only).
     */
    public function destroy(string $id)
    {
        try {
            $bugReport = BugReport::find($id);

            if (!$bugReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy báo cáo lỗi'
                ], 404);
            }

            // Delete screenshot files
            if ($bugReport->screenshots) {
                foreach ($bugReport->screenshots as $screenshotUrl) {
                    $path = str_replace('/storage/', '', $screenshotUrl);
                    \Storage::disk('public')->delete($path);
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

    /**
     * Get bug report statistics for admin dashboard.
     */
    public function statistics()
    {
        try {
            $stats = [
                'total' => BugReport::count(),
                'pending' => BugReport::pending()->count(),
                'completed' => BugReport::completed()->count(),
                'recent' => BugReport::where('created_at', '>=', now()->subDays(7))->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể lấy thống kê báo cáo lỗi',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
