<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VoiceClone extends Model
{
    use HasFactory;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'voice_name',
        'voice_id',
        'preview_text',
        'language_tag',
        'gender_tag',
        'need_noise_reduction',
        'platform',
        'file_path',
        'status',
        'cloned_at',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'need_noise_reduction' => 'boolean',
        'cloned_at' => 'datetime',
    ];
    
    /**
     * Get the user that owns the voice clone.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Check if voice clone is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
    
    /**
     * Check if voice clone is processing
     */
    public function isProcessing(): bool
    {
        return $this->status === 'processing';
    }
    
    /**
     * Check if voice clone failed
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }
    
    /**
     * Mark voice clone as completed
     */
    public function markAsCompleted(string $voiceId): void
    {
        $this->update([
            'status' => 'completed',
            'voice_id' => $voiceId,
            'cloned_at' => now()
        ]);
    }
    
    /**
     * Mark voice clone as failed
     */
    public function markAsFailed(): void
    {
        $this->update([
            'status' => 'failed'
        ]);
    }
    
    /**
     * Mark voice clone as processing
     */
    public function markAsProcessing(): void
    {
        $this->update([
            'status' => 'processing'
        ]);
    }
}