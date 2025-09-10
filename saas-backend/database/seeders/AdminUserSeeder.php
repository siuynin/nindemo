<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tạo tài khoản admin mặc định
        User::updateOrCreate(
            ['email' => 'admin@saas.com'],
            [
                'name' => 'Administrator',
                'email' => 'admin@saas.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Tạo thêm một tài khoản admin khác (tùy chọn)
        User::updateOrCreate(
            ['email' => 'superadmin@saas.com'],
            [
                'name' => 'Super Administrator',
                'email' => 'superadmin@saas.com',
                'password' => Hash::make('superadmin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Admin users created successfully!');
        $this->command->info('Admin Login Credentials:');
        $this->command->info('Email: admin@saas.com | Password: admin123');
        $this->command->info('Email: superadmin@saas.com | Password: superadmin123');
    }
}
