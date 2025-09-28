<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditTransaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'amount',
        'type',
        'description',
        'model_id',
        'operation_type',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'integer',
        'model_id' => 'integer',
    ];

    /**
     * Get the user that owns the transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the model associated with the transaction.
     */
    public function model()
    {
        return $this->belongsTo(Model::class, 'model_id');
    }

    /**
     * Scope a query to only include transactions of a specific type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include transactions of a specific operation type.
     */
    public function scopeOfOperationType($query, string $operationType)
    {
        return $query->where('operation_type', $operationType);
    }
}