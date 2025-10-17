<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only sanitize for TTS-related endpoints
        if ($this->shouldSanitize($request)) {
            $input = $request->all();
            $sanitized = $this->sanitizeArray($input);
            $request->replace($sanitized);
        }

        return $next($request);
    }

    /**
     * Determine if the request should be sanitized
     */
    private function shouldSanitize(Request $request): bool
    {
        $ttsEndpoints = [
            'api/ndhub-tts',
            'api/elevenlabs',
            'api/minimax',
            'api/generate'
        ];

        foreach ($ttsEndpoints as $endpoint) {
            if (str_contains($request->path(), $endpoint)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Recursively sanitize array data
     */
    private function sanitizeArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->sanitizeArray($value);
            } elseif (is_string($value)) {
                $data[$key] = $this->sanitizeString($value);
            }
        }

        return $data;
    }

    /**
     * Sanitize string input while preserving necessary characters for TTS
     */
    private function sanitizeString(string $input): string
    {
        // For text content fields, preserve punctuation but remove control characters
        if (strlen($input) > 100) { // Likely text content
            // Remove control characters but keep printable characters and common punctuation
            $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
            
            // Normalize excessive whitespace
            $input = preg_replace('/\s+/', ' ', $input);
        } else {
            // For shorter fields (names, IDs), be more restrictive
            $input = filter_var($input, FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
        }

        return trim($input);
    }
}