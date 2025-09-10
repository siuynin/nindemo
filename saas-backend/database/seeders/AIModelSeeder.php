<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AIModel;

class AIModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $models = [
            [
                'name' => 'DALL-E 3',
                'slug' => 'dall-e-3',
                'platform' => 'OpenAI',
                'type' => 'image',
                'credit_price' => 5.00,
                'short_description' => 'Advanced AI image generator with high-quality, detailed outputs'
            ],
            [
                'name' => 'Midjourney V6',
                'slug' => 'midjourney-v6',
                'platform' => 'Midjourney',
                'type' => 'image',
                'credit_price' => 4.00,
                'short_description' => 'Artistic AI model known for creative and stylized image generation'
            ],
            [
                'name' => 'Stable Diffusion XL',
                'slug' => 'stable-diffusion-xl',
                'platform' => 'Stability AI',
                'type' => 'image',
                'credit_price' => 3.00,
                'short_description' => 'Open-source model with excellent photorealistic capabilities'
            ],
            [
                'name' => 'Flux Pro',
                'slug' => 'flux-pro',
                'platform' => 'Black Forest Labs',
                'type' => 'image',
                'credit_price' => 6.00,
                'short_description' => 'State-of-the-art model with superior text rendering and realism'
            ],
            [
                'name' => 'Leonardo AI',
                'slug' => 'leonardo-ai',
                'platform' => 'Leonardo',
                'type' => 'image',
                'credit_price' => 2.50,
                'short_description' => 'Versatile model with multiple style presets and fine-tuning options'
            ],
            [
                'name' => 'Firefly 3',
                'slug' => 'firefly-3',
                'platform' => 'Adobe',
                'type' => 'image',
                'credit_price' => 4.50,
                'short_description' => 'Commercial-safe AI model integrated with Adobe Creative Suite'
            ]
        ];

        foreach ($models as $model) {
            AIModel::updateOrCreate(
                ['slug' => $model['slug']],
                $model
            );
        }

        $this->command->info('AI Models seeded successfully!');
    }
}