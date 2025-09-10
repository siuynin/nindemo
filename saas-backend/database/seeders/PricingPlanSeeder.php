<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PricingPlan;

class PricingPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free Plan',
                'description' => 'Basic plan with limited features for new users',
                'price' => 0.00,
                'billing_cycle' => 'monthly',
                'credits_included' => 10,
                'features' => [
                    'Upload up to 10 files',
                    'Basic file management',
                    'Public file sharing',
                    'Email support'
                ],
                'max_file_size' => 5,
                'max_files_per_month' => 10,
                'is_active' => true,
                'sort_order' => 1
            ],
            [
                'name' => 'Starter Plan',
                'description' => 'Perfect for individuals and small projects',
                'price' => 9.99,
                'billing_cycle' => 'monthly',
                'credits_included' => 100,
                'features' => [
                    'Upload up to 100 files',
                    'Advanced file management',
                    'Private & public file sharing',
                    'Priority email support',
                    'File analytics'
                ],
                'max_file_size' => 25,
                'max_files_per_month' => 100,
                'is_active' => true,
                'sort_order' => 2
            ],
            [
                'name' => 'Professional Plan',
                'description' => 'Ideal for professionals and growing businesses',
                'price' => 29.99,
                'billing_cycle' => 'monthly',
                'credits_included' => 500,
                'features' => [
                    'Upload up to 500 files',
                    'Advanced file management',
                    'Team collaboration',
                    'API access',
                    'Advanced analytics',
                    'Priority support'
                ],
                'max_file_size' => 100,
                'max_files_per_month' => 500,
                'is_active' => true,
                'sort_order' => 3
            ],
            [
                'name' => 'Enterprise Plan',
                'description' => 'Comprehensive solution for large organizations',
                'price' => 99.99,
                'billing_cycle' => 'monthly',
                'credits_included' => 2000,
                'features' => [
                    'Unlimited file uploads',
                    'Advanced file management',
                    'Team collaboration',
                    'Full API access',
                    'Custom integrations',
                    'Advanced analytics & reporting',
                    'Dedicated support manager',
                    'SLA guarantee'
                ],
                'max_file_size' => null,
                'max_files_per_month' => null,
                'is_active' => true,
                'sort_order' => 4
            ]
        ];

        foreach ($plans as $plan) {
            PricingPlan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
