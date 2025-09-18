<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayPalTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'paypal_order_id',
        'amount',
        'currency',
        'status',
        'paypal_response',
        'captured_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paypal_response' => 'array',
        'captured_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PricingPlan::class);
    }
}
