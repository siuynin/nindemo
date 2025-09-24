<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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
