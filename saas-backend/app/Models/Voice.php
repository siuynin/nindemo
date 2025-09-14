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
}
