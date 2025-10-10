<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateCredits
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  int $minCredits Minimum credits required
     */
    public function handle(Request $request, Closure $next, int $minCredits = 1): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required'
            ], 401);
        }

        // Check if user has enough credits
        if ($user->total_remaining_credits < $minCredits) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient credits. Please top up your account.',
                'required_credits' => $minCredits,
                'available_credits' => $user->total_remaining_credits
            ], 402);
        }

        return $next($request);
    }
}
