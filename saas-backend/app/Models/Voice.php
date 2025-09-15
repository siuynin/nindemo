<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voice extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'voice_id',
        'language',
        'category',
        'preview_url',
        'fine_data',
        'gender',
        'age',
        'description',
        'platforms',
        'status'
    ];

    protected $casts = [
        'fine_data' => 'array',
        'status' => 'boolean'
    ];

    protected $appends = [
        'processed_languages',
        'processed_gender',
        'processed_age'
    ];

    /**
     * Get the user that owns the voice.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope a query to only include active voices.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope a query to filter by language.
     */
    public function scopeByLanguage($query, $language)
    {
        return $query->where('language', $language);
    }

    /**
     * Scope a query to filter by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to filter by gender.
     */
    public function scopeByGender($query, $gender)
    {
        return $query->where('gender', $gender);
    }

    /**
     * Scope for public voices with elevenlab platform
     */
    public function scopePublicElevenlab($query)
    {
        return $query->where('status', true)
                    ->where('platforms', 'elevenlab');
    }

    /**
     * Get processed languages with preview URLs
     * Logic: If fine_data is null, use language and preview_url columns
     * If fine_data is not empty, use language and preview_url from fine_data
     * Skip duplicate language codes
     */
    public function getProcessedLanguagesAttribute()
    {
        if (empty($this->fine_data)) {
            // If fine_data is null or empty, use the main columns
            return [
                [
                    'language' => $this->language,
                    'preview_url' => $this->preview_url
                ]
            ];
        }

        // If fine_data is not empty, extract languages and preview_urls from it
        $languages = [];
        $seenLanguages = []; // Track seen language codes to avoid duplicates
        
        // Check if fine_data has languages array
        if (isset($this->fine_data['languages']) && is_array($this->fine_data['languages'])) {
            foreach ($this->fine_data['languages'] as $langData) {
                $languageCode = $langData['language'] ?? $this->language;
                
                // Skip if this language code has already been processed
                if (in_array($languageCode, $seenLanguages)) {
                    continue;
                }
                
                $languages[] = [
                    'language' => $languageCode,
                    'preview_url' => $langData['preview_url'] ?? $this->preview_url
                ];
                
                // Mark this language code as seen
                $seenLanguages[] = $languageCode;
            }
        } else {
            // If fine_data exists but doesn't have proper structure, fallback to main columns
            $languageCode = $this->fine_data['language'] ?? $this->language;
            $languages[] = [
                'language' => $languageCode,
                'preview_url' => $this->fine_data['preview_url'] ?? $this->preview_url
            ];
        }

        return $languages;
    }

    /**
     * Get processed gender
     * Logic: If fine_data is null, use gender column
     * If fine_data is not empty, use gender from fine_data if available
     */
    public function getProcessedGenderAttribute()
    {
        if (empty($this->fine_data)) {
            return $this->gender;
        }

        // Check if fine_data has gender
        return $this->fine_data['gender'] ?? $this->gender;
    }

    /**
     * Get processed age
     * Logic: If fine_data is null, use age column
     * If fine_data is not empty, use age from fine_data if available
     */
    public function getProcessedAgeAttribute()
    {
        if (empty($this->fine_data)) {
            return $this->age;
        }

        // Check if fine_data has age
        return $this->fine_data['age'] ?? $this->age;
    }

    /**
     * Get the voice data formatted for API response
     */
    public function getApiFormatAttribute()
    {
        return [
            'id' => $this->id,
            'voice_id' => $this->voice_id,
            'name' => $this->name,
            'category' => $this->category,
            'gender' => $this->processed_gender,
            'age' => $this->processed_age,
            'language' => $this->processed_languages
        ];
    }
}
