<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class CreateTestToken extends Command
{
    protected $signature = 'token:create {user_id=1}';
    protected $description = 'Create a test token for a user';

    public function handle()
    {
        $userId = $this->argument('user_id');
        $user = User::find($userId);
        
        if (!$user) {
            $this->error('User not found');
            return 1;
        }
        
        $token = $user->createToken('test-token')->plainTextToken;
        $this->info('Token: ' . $token);
        
        return 0;
    }
}