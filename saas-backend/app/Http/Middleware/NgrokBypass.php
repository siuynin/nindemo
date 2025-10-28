<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NgrokBypass
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Xử lý request trước
        $response = $next($request);
        
        // Lấy origin từ request
        $origin = $request->headers->get('Origin');
        $allowedOrigins = [
            'https://www.ndhubs.com',
            'https://ndhubs.com',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5175',
            'http://127.0.0.1:5175',
        ];
        
        // Thêm header vào response để bypass ngrok warning
        $response->headers->set('ngrok-skip-browser-warning', 'true');
        
        // Kiểm tra và set CORS headers
        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }
        
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        
        return $response;
    }
}