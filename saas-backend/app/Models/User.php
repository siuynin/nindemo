<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'google_id',
        'role',
        'status',
        'current_pricing_plan_id',
        'plan_expires_at',
        'preferences',
        'last_login_at',
        'last_login_ip',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'plan_expires_at' => 'datetime',
            'preferences' => 'array',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Get the pricing plan that the user belongs to.
     */
    public function pricingPlan()
    {
        return $this->belongsTo(PricingPlan::class, 'current_pricing_plan_id');
    }

    /**
     * Get the user's credits.
     */
    public function credits()
    {
        return $this->hasMany(UserCredit::class);
    }

    /**
     * Get the user's files.
     */
    public function files()
    {
        return $this->hasMany(File::class);
    }

    /**
     * Get the user's active credits.
     */
    public function activeCredits()
    {
        return $this->hasMany(UserCredit::class)
            ->where('expires_at', '>', now())
            ->where('remaining_credits', '>', 0);
    }

    /**
     * Get total remaining credits for the user.
     */
    public function getTotalRemainingCreditsAttribute()
    {
        return $this->activeCredits()->sum('remaining_credits');
    }
}
