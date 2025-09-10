<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCredit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'pricing_plan_id',
        'total_credits',
        'used_credits',
        'remaining_credits',
        'expires_at',
        'credit_type',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_credits' => 'integer',
        'used_credits' => 'integer',
        'remaining_credits' => 'integer',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user that owns the credit.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the pricing plan associated with this credit.
     */
    public function pricingPlan()
    {
        return $this->belongsTo(PricingPlan::class);
    }

    /**
     * Scope a query to only include active credits.
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now())
                    ->where('remaining_credits', '>', 0);
    }

    /**
     * Scope a query to only include expired credits.
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Use credits from this record.
     */
    public function useCredits($amount)
    {
        if ($this->remaining_credits >= $amount) {
            $this->used_credits += $amount;
            $this->remaining_credits -= $amount;
            $this->save();
            return true;
        }
        return false;
    }
}
