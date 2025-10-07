<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AIModel extends Model
{
    protected $table = 'models';
    
    protected $fillable = [
        'name',
        'slug',
        'platform',
        'thumbnail',
        'type',
        'credit_price',
        'short_description'
    ];
    
    protected $casts = [
        'credit_price' => 'decimal:3'
    ];
    
    protected $appends = ['thumbnail_url'];
    
    /**
     * Get the thumbnail URL attribute.
     */
    public function getThumbnailUrlAttribute()
    {
        if (!$this->thumbnail) {
            return null;
        }
        
        // If thumbnail already contains full URL (starts with http), return as is
        if (str_starts_with($this->thumbnail, 'http')) {
            return $this->thumbnail;
        }
        
        // Generate S3 URL for thumbnail
        return Storage::disk('s3')->url($this->thumbnail);
    }
    
    /**
     * Boot the model.
     */
    // Removed auto-slug generation - users will input slug manually
    
    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName()
    {
        return 'slug';
    }
}
