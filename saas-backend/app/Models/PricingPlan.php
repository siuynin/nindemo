<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingPlan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'billing_cycle',
        'credits_included',
        'credits',
        'status',
        'is_popular',
        'features',
        'max_voice_clone',
        'is_premium',
        'is_active',
        'sort_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'credits_included' => 'integer',
        'credits' => 'integer',
        'is_popular' => 'boolean',
        'features' => 'array',
        'max_voice_clone' => 'boolean',
        'is_premium' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get the users that belong to this pricing plan.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'current_pricing_plan_id');
    }

    /**
     * Get the user credits associated with this pricing plan.
     */
    public function userCredits()
    {
        return $this->hasMany(UserCredit::class);
    }

    /**
     * Scope a query to only include active pricing plans.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order by sort order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
