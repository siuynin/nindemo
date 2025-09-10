<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OpenAI extends Model
{
    use HasFactory;
    
    protected $table = 'openai';
    
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'slug',
        'active',
        'questions',
        'image',
        'premium',
        'type',
        'prompt',
        'custom_template',
        'tone_of_voice',
        'color',
        'filters',
        'package'
    ];
    
    protected $casts = [
        'active' => 'boolean',
        'premium' => 'boolean',
        'custom_template' => 'boolean',
        'tone_of_voice' => 'boolean',
        'questions' => 'array',
        'filters' => 'array',
        'package' => 'array'
    ];
    
    // Relationship with User (if needed)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    // Scope for active templates
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
    
    // Scope for premium templates
    public function scopePremium($query)
    {
        return $query->where('premium', true);
    }
    
    // Scope for free templates
    public function scopeFree($query)
    {
        return $query->where('premium', false);
    }
    
    // Scope by type
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }
}
