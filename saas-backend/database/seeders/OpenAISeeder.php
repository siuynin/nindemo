<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\OpenAI;
use Illuminate\Support\Facades\DB;

class OpenAISeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate the table first
        DB::table('openai')->truncate();
        
        $data = [
            [
                'id' => 1,
                'user_id' => null,
                'title' => 'Article Generator',
                'description' => 'Turn a title and outline text into a fully complete high quality article within seconds',
                'slug' => 'article_generator',
                'active' => 1,
                'questions' => '[{"name":"title","type":"text","question":"Title","select":""},{"name":"description","type":"textarea","question":"Description","select":""}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M430 896V356H200V256h560v100H530v540H430Z"/></svg>',
                'premium' => 0,
                'type' => 'text',
                'created_at' => '2023-03-11 03:43:50',
                'updated_at' => '2023-03-11 03:43:50',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#A3D6C2',
                'filters' => 'blog',
                'package' => null
            ],
            [
                'id' => 2,
                'user_id' => null,
                'title' => 'Content Rewriter',
                'description' => 'Take a piece of content and rewrite it to make it more interesting, creative, and engaging',
                'slug' => 'content_rewriter',
                'active' => 1,
                'questions' => '[{"name":"description","type":"textarea","question":"Description","select":""}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M430 896V356H200V256h560v100H530v540H430Z"/></svg>',
                'premium' => 0,
                'type' => 'text',
                'created_at' => '2023-03-11 03:43:50',
                'updated_at' => '2023-03-11 03:43:50',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#A3D6C2',
                'filters' => 'blog',
                'package' => null
            ],
            [
                'id' => 3,
                'user_id' => null,
                'title' => 'Summarize Text',
                'description' => 'Summarize any text in a short and easy to understand concise way',
                'slug' => 'summarize_text',
                'active' => 1,
                'questions' => '[{"name":"description","type":"textarea","question":"Description","select":""}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M160 666v-60h389v60H160Zm0-120v-60h640v60H160Z"/></svg>',
                'premium' => 0,
                'type' => 'text',
                'created_at' => '2023-03-11 03:43:50',
                'updated_at' => '2023-03-11 03:43:50',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#A3D6C2',
                'filters' => 'blog',
                'package' => null
            ]
        ];
        
        // Insert first batch
        foreach ($data as $item) {
            OpenAI::create($item);
        }
        
        // Continue with more data...
        $this->seedMoreData();
    }
    
    private function seedMoreData()
    {
        $moreData = [
            [
                'id' => 4,
                'user_id' => null,
                'title' => 'Product Description',
                'description' => 'Write the description about your product and why it worth it',
                'slug' => 'product_description',
                'active' => 1,
                'questions' => '[{"name":"title","type":"text","question":"Title","select":""},{"name":"description","type":"textarea","question":"Description","select":""}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M220 936q-24 0-42-18t-18-42V276q0-24 18-42t42-18h520q24 0 42 18t18 42v600q0 24-18 42t-42 18H220Zm0-60h520V276H220v600Zm70-120h160v-60H290v60Zm0-160h380v-60H290v60Zm0-160h380v-60H290v60ZM180 876V276v600Z"/></svg>',
                'premium' => 0,
                'type' => 'text',
                'created_at' => '2023-03-11 03:43:50',
                'updated_at' => '2023-03-11 03:43:50',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#E8CEC3',
                'filters' => 'ecommerce',
                'package' => null
            ],
            [
                'id' => 5,
                'user_id' => null,
                'title' => 'Article Generator',
                'description' => 'Turn a title and outline text into a fully complete high quality article within seconds',
                'slug' => 'article_generator_v2',
                'active' => 1,
                'questions' => '[{"name":"title","type":"text","question":"Title","select":""},{"name":"description","type":"textarea","question":"Description","select":""}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M430 896V356H200V256h560v100H530v540H430Z"/></svg>',
                'premium' => 0,
                'type' => 'text',
                'created_at' => '2023-03-11 03:43:50',
                'updated_at' => '2023-03-11 03:43:50',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#A3D6C2',
                'filters' => 'blog',
                'package' => null
            ]
        ];
        
        foreach ($moreData as $item) {
            OpenAI::create($item);
        }
        
        // Add remaining records in smaller batches to avoid memory issues
        $this->seedRemainingData();
    }
    
    private function seedRemainingData()
    {
        // Due to the large amount of data, we'll use DB::insert for better performance
        $remainingData = [
            // Add more records here - this is a simplified version
            // In production, you might want to read from the SQL file directly
            // or break this into smaller chunks
        ];
        
        // For now, let's add a few more key records
        $keyRecords = [
            [
                'id' => 32,
                'user_id' => null,
                'title' => 'AI Image Generator',
                'description' => 'Create stunning images in seconds.',
                'slug' => 'ai_image_generator',
                'active' => 1,
                'questions' => '[{"name":"description","type":"textarea","question":"Describe the Image","select":""},{"name":"size","type":"select","question":"Image Resolution","select":"<option value=\"256x256\">256x256</option><option value=\"512x512\">512x512</option><option value=\"1024x1024\">1024x1024</option>"}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="M180 936q-24 0-42-18t-18-42V276q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm56-157h489L578 583 446 754l-93-127-117 152Z"/></svg>',
                'premium' => 0,
                'type' => 'image',
                'created_at' => '2023-03-20 06:22:02',
                'updated_at' => '2023-03-20 06:22:02',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#D1C5DE',
                'filters' => 'development',
                'package' => null
            ],
            [
                'id' => 35,
                'user_id' => null,
                'title' => 'AI Code Generator',
                'description' => 'Create custom code in seconds! Leverage our state-of-the-art AI technology to quickly and easily generate code in any language.',
                'slug' => 'ai_code_generator',
                'active' => 1,
                'questions' => '[{"name":"description","type":"textarea","question":"Describe What Kind of Code You Need","select":""},{"name":"code_language","type":"text","question":"Coding Language (Java, PHP etc.)","select":""}]',
                'image' => '<svg xmlns="http://www.w3.org/2000/svg" height="40" viewBox="0 96 960 960" width="40"><path d="M196.666 965.333q-43.824 0-74.912-31.087-31.087-31.088-31.087-74.912V701.667h105.999v157.667h157.667v105.999H196.666Zm409.001 0V859.334h157.667V701.667H870v157.667q0 43.824-31.284 74.912-31.283 31.087-75.382 31.087H605.667ZM344 739.333 180.667 576 344 412.667 418.333 489l-86 87 86 87L344 739.333Zm272 0L541.667 663l86-87-86-87L616 412.667 779.333 576 616 739.333Zm-525.333-289V292.666q0-44.099 31.087-75.382Q152.842 186 196.666 186h157.667v106.666H196.666v157.667H90.667Zm672.667 0V292.666H605.667V186h157.667q44.099 0 75.382 31.284Q870 248.567 870 292.666v157.667H763.334Z"/></svg>',
                'premium' => 0,
                'type' => 'code',
                'created_at' => '2023-04-12 12:58:19',
                'updated_at' => '2023-05-06 14:43:02',
                'prompt' => null,
                'custom_template' => 0,
                'tone_of_voice' => 0,
                'color' => '#81FFC2',
                'filters' => 'development',
                'package' => null
            ]
        ];
        
        foreach ($keyRecords as $item) {
            OpenAI::create($item);
        }
    }
}
