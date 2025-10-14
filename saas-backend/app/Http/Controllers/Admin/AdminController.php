<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\File;
use App\Models\PricingPlan;
use App\Models\UserCredit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Search Users for Ajax
     */
    public function searchUsers(Request $request)
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json(['users' => []]);
        }
        
        $users = User::where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->where('role', 'user')
            ->select('id', 'name', 'email', 'created_at')
            ->orderBy('name')
            ->limit(10)
            ->get();
            
        return response()->json(['users' => $users]);
    }

    /**
     * Admin Dashboard
     */
    public function dashboard()
    {
        // Statistics
        $totalUsers = User::count();
        $totalFiles = File::count();
        $totalCredits = UserCredit::sum('total_credits');
        $usedCredits = UserCredit::sum('used_credits');
        $totalPricingPlans = PricingPlan::count();
        $activePricingPlans = PricingPlan::where('is_active', true)->count();
        $totalStorageUsed = File::sum('file_size');
        
        // Additional stats for dashboard
        $activeUsers = User::where('updated_at', '>=', now()->subDays(30))->count();
        $filesThisMonth = File::whereMonth('created_at', now()->month)
                             ->whereYear('created_at', now()->year)
                             ->count();
        $creditsUsedThisMonth = UserCredit::whereMonth('created_at', now()->month)
                                         ->whereYear('created_at', now()->year)
                                         ->sum('used_credits');

        $recentUsers = User::latest()->take(5)->get();
        $recentFiles = File::with('user')->latest()->take(5)->get();
        $recentCredits = UserCredit::with(['user', 'pricingPlan'])->latest()->take(5)->get();

        return view('admin.dashboard', compact(
            'totalUsers', 'totalFiles', 'totalCredits', 'usedCredits', 
            'totalPricingPlans', 'activePricingPlans', 'totalStorageUsed', 'activeUsers', 
            'filesThisMonth', 'creditsUsedThisMonth', 'recentUsers', 
            'recentFiles', 'recentCredits'
        ));
    }

    /**
     * Users Management
     */
    public function users(Request $request)
    {
        $query = User::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->get('role'));
        }

        $users = $query->withCount(['files', 'credits'])
                      ->with(['currentPricingPlan'])
                      ->paginate(20);

        return view('admin.users.index', compact('users'));
    }

    /**
     * Show User Details
     */
    public function userShow(User $user)
    {
        $user->load(['files', 'credits.pricingPlan']);
        $totalCredits = $user->credits ? $user->credits->sum('total_credits') : 0;
        $usedCredits = $user->credits ? $user->credits->sum('used_credits') : 0;
        $remainingCredits = $user->total_remaining_credits;
        
        // Get recent files for this user
        $recentFiles = $user->files()->latest()->take(10)->get();
        
        // Get recent credits for this user
        $recentCredits = $user->credits()->latest()->take(10)->get();
        
        // Calculate total files and storage for this user
        $totalFiles = $user->files()->count();
        $totalStorage = $user->files()->sum('file_size');

        return view('admin.users.show', compact('user', 'totalCredits', 'usedCredits', 'remainingCredits', 'recentFiles', 'recentCredits', 'totalFiles', 'totalStorage'));
    }

    /**
     * Update User Role
     */
    public function updateUserRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user,admin'
        ]);

        $user->update([
            'role' => $request->role
        ]);

        return redirect()->back()->with('success', 'User role updated successfully.');
    }

    /**
     * Files Management
     */
    public function files(Request $request)
    {
        $query = File::with('user');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('original_name', 'like', "%{$search}%");
        }

        if ($request->has('file_type')) {
            $query->where('file_type', $request->get('file_type'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }

        $files = $query->orderBy('created_at', 'desc')
                      ->paginate(20);

        $fileTypes = File::distinct()->pluck('file_type');
        $users = User::select('id', 'name')->get();
        
        // Statistics for files page
        $totalFiles = File::count();
        $totalSize = File::sum('file_size');
        $filesThisMonth = File::whereMonth('created_at', now()->month)
                             ->whereYear('created_at', now()->year)
                             ->count();
        $todayFiles = File::whereDate('created_at', now()->toDateString())->count();
        $largeFiles = File::where('file_size', '>', 10 * 1024 * 1024)->count(); // Files > 10MB
        $avgFileSize = File::avg('file_size');

        return view('admin.files.index', compact('files', 'fileTypes', 'users', 'totalFiles', 'totalSize', 'filesThisMonth', 'todayFiles', 'largeFiles', 'avgFileSize'));
    }

    /**
     * Delete File
     */
    public function deleteFile(File $file)
    {
        // Delete file from storage
        if (\Storage::disk('public')->exists($file->file_path)) {
            \Storage::disk('public')->delete($file->file_path);
        }

        // Delete file record
        $file->delete();

        return redirect()->back()->with('success', 'File deleted successfully.');
    }

    /**
     * Statistics Page
     */
    public function statistics()
    {
        // User statistics
        $userStats = [
            'total_users' => User::count(),
            'users_by_role' => User::select('role', DB::raw('count(*) as count'))
                                  ->groupBy('role')
                                  ->pluck('count', 'role'),
            'new_users_this_month' => User::whereMonth('created_at', now()->month)
                                         ->whereYear('created_at', now()->year)
                                         ->count(),
        ];

        // File statistics
        $fileStats = [
            'total_files' => File::count(),
            'files_by_type' => File::select('file_type', DB::raw('count(*) as count'))
                                  ->groupBy('file_type')
                                  ->pluck('count', 'file_type'),
            'total_storage' => File::sum('file_size'),
            'files_this_month' => File::whereMonth('created_at', now()->month)
                                     ->whereYear('created_at', now()->year)
                                     ->count(),
        ];

        // Credit statistics
        $creditStats = [
            'total_credits_issued' => UserCredit::sum('total_credits'),
            'total_credits_used' => UserCredit::sum('used_credits'),
            'credits_by_plan' => UserCredit::with('pricingPlan')
                                          ->select('pricing_plan_id', DB::raw('sum(total_credits) as total'))
                                          ->groupBy('pricing_plan_id')
                                          ->get()
                                          ->mapWithKeys(function($item) {
                                              return [$item->pricingPlan->name ?? 'Unknown' => $item->total];
                                          }),
        ];

        return view('admin.statistics', compact('userStats', 'fileStats', 'creditStats'));
    }
}
