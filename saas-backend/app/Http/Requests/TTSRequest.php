<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TTSRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'content' => 'required|string|max:10000',
            'lang' => 'required|string|max:10',
            'voices' => 'required|string|max:50',
            'audio_format' => 'required|string|in:mp3,wav,ogg',
            'speed' => 'required|numeric|min:0.5|max:2.0'
        ];
    }

    /**
     * Get the validated data with sanitized content.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        if (isset($validated['content'])) {
            // Sanitize content while preserving necessary characters for TTS
            $validated['content'] = $this->sanitizeTextContent($validated['content']);
        }
        
        return $validated;
    }

    /**
     * Sanitize text content for TTS while preserving readability
     */
    private function sanitizeTextContent(string $content): string
    {
        // Remove potentially dangerous characters but keep punctuation for natural speech
        $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $content);
        
        // Normalize whitespace
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Trim and ensure reasonable length
        $content = trim($content);
        
        return $content;
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'content.required' => 'Text content is required for TTS generation.',
            'content.max' => 'Text content cannot exceed 10,000 characters.',
            'name.required' => 'A name for the TTS generation is required.',
            'lang.required' => 'Language selection is required.',
            'voices.required' => 'Voice selection is required.',
            'audio_format.in' => 'Audio format must be mp3, wav, or ogg.',
            'speed.between' => 'Speed must be between 0.5 and 2.0.'
        ];
    }
}