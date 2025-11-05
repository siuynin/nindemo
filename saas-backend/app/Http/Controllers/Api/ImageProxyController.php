<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ImageProxyController extends Controller
{
    /**
     * Stream image content from a remote URL through our server.
     * No local storage; returns the image bytes with appropriate headers.
     *
     * Query params:
     * - url: remote image URL (base64-encoded or plain). Only whitelisted domains allowed.
     */
    public function proxy(Request $request)
    {
        $raw = $request->query('url');
        if (!$raw) {
            return response()->json([
                'success' => false,
                'message' => 'Missing url parameter'
            ], 400);
        }

        // Allow both plain and base64-encoded url
        $sourceUrl = $raw;
        if (preg_match('/^[A-Za-z0-9+\/]+=*$/', $raw)) {
            // Looks like base64; attempt decode
            try {
                $decoded = base64_decode($raw, true);
                if ($decoded) {
                    $sourceUrl = $decoded;
                }
            } catch (\Throwable $e) {
                // ignore and use raw
            }
        }

        // Basic allowlist: permit S3/amazonaws and our own domains; block file:// etc.
        $parsed = parse_url($sourceUrl);
        $host = $parsed['host'] ?? '';
        $scheme = strtolower($parsed['scheme'] ?? '');
        if (!in_array($scheme, ['http', 'https'])) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid URL scheme'
            ], 400);
        }

        $allowed = false;
        if (str_contains($host, 'amazonaws.com') || str_contains($host, 's3.amazonaws.com')) {
            $allowed = true;
        }
        // Allow our own domain (useful when proxy-chaining)
        $appUrl = config('app.url');
        if ($appUrl) {
            $appHost = parse_url($appUrl, PHP_URL_HOST);
            if ($appHost && $host === $appHost) {
                $allowed = true;
            }
        }

        if (!$allowed) {
            return response()->json([
                'success' => false,
                'message' => 'URL host not allowed'
            ], 403);
        }

        Log::info('Proxying image', ['url' => $sourceUrl]);

        try {
            $resp = Http::timeout(60)->get($sourceUrl);
            if (!$resp->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch remote image',
                    'status' => $resp->status()
                ], 502);
            }

            $contentType = $resp->header('Content-Type') ?: 'image/png';
            $body = $resp->body();

            // Set short caching to reduce backend load
            return response($body, 200)
                ->header('Content-Type', $contentType)
                ->header('Cache-Control', 'public, max-age=300');
        } catch (\Throwable $e) {
            Log::error('Image proxy error', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Proxy error: ' . $e->getMessage()
            ], 500);
        }
    }
}