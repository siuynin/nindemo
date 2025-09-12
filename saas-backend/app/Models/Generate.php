<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Generate extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'content',
        'type',
        'status',
        'share',
        'file_patch',
        'task_id',
        'credit_cost',
        'result_url',
        'error_message',
        'completed_at'
    ];

    protected $casts = [
        'credit_cost' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the generate.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
