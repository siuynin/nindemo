<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Bill extends Model
{
    protected $fillable = [
        'user_id',
        'pricing_plan_id',
        'bill_number',
        'amount',
        'currency',
        'description',
        'status',
        'payment_method',
        'transaction_id',
        'paypal_order_id',
        'paypal_capture_id',
        'paypal_response',
        'invoice_url',
        'due_date',
        'paid_at',
        'metadata'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
        'metadata' => 'array',
        'paypal_response' => 'array'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($bill) {
            if (empty($bill->bill_number)) {
                $bill->bill_number = 'BILL-' . strtoupper(Str::random(8)) . '-' . date('Ymd');
            }
        });
    }

    /**
     * Get the user that owns the bill.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the pricing plan associated with the bill.
     */
    public function pricingPlan(): BelongsTo
    {
        return $this->belongsTo(PricingPlan::class);
    }

    /**
     * Check if the bill is paid.
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Check if the bill is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Mark the bill as paid.
     */
    public function markAsPaid(string $transactionId = null, array $paypalData = []): void
    {
        $updateData = [
            'status' => 'paid',
            'paid_at' => now()
        ];
        
        if ($transactionId) {
            $updateData['transaction_id'] = $transactionId;
        }
        
        if (!empty($paypalData)) {
            $updateData['paypal_order_id'] = $paypalData['order_id'] ?? null;
            $updateData['paypal_capture_id'] = $paypalData['capture_id'] ?? null;
            $updateData['paypal_response'] = $paypalData['response'] ?? null;
        }
        
        $this->update($updateData);
    }

    /**
     * Mark the bill as failed.
     */
    public function markAsFailed(): void
    {
        $this->update(['status' => 'failed']);
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by user.
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Generate unique bill number.
     */
    public static function generateBillNumber(): string
    {
        do {
            $billNumber = 'BILL-' . date('Y') . '-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (self::where('bill_number', $billNumber)->exists());

        return $billNumber;
    }

    /**
     * Get formatted amount with currency.
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }
}
