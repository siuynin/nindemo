<?php

return [
    'api_key' => env('RUNNINGHUB_API_KEY'),

    'models' => [
        // Provided example mapping for nano-banana
        'nano-banana' => [
            'webapp_id' => env('RUNNINGHUB_WEBAPPID_NANO_BANANA', '1961364941150294017'),
            'api_key' => env('RUNNINGHUB_API_KEY', '354d0021f5034586a7b448f798fe40bf'), // default to global key
            'nodes' => [
                'width' => env('RUNNINGHUB_NODEID_NANO_BANANA_WIDTH', '4'),
                'height' => env('RUNNINGHUB_NODEID_NANO_BANANA_HEIGHT', '4'),
                'prompt' => env('RUNNINGHUB_NODEID_NANO_BANANA_PROMPT', '10'),
                'role' => env('RUNNINGHUB_NODEID_NANO_BANANA_ROLE', '10'),
            ],
            'default_role' => env('RUNNINGHUB_DEFAULT_ROLE_NANO_BANANA', '你是一个优秀的智能提示词助手，请帮我优化提示词'),
        ],
        // Placeholders for other slugs; set webapp_id in .env
        'flux-kontext' => [
            'webapp_id' => env('RUNNINGHUB_WEBAPPID_FLUX_KONTEXT'),
            'api_key' => env('RUNNINGHUB_API_KEY'),
            'nodes' => [
                'prompt' => env('RUNNINGHUB_NODEID_FLUX_KONTEXT_PROMPT', '56'),
                'aspect_ratio' => env('RUNNINGHUB_NODEID_FLUX_KONTEXT_ASPECT_RATIO', '52'),
                'select' => env('RUNNINGHUB_NODEID_FLUX_KONTEXT_SELECT', '66'),
                'width' => env('RUNNINGHUB_NODEID_FLUX_KONTEXT_WIDTH'),
                'height' => env('RUNNINGHUB_NODEID_FLUX_KONTEXT_HEIGHT'),
                'role' => env('RUNNINGHUB_NODEID_FLUX_KONTEXT_ROLE', '10'),
            ],
            'default_role' => env('RUNNINGHUB_DEFAULT_ROLE_FLUX_KONTEXT', '你是一个优秀的智能提示词助手，请帮我优化提示词'),
            'defaults' => [
                'aspect_ratio' => env('RUNNINGHUB_DEFAULT_ASPECT_RATIO_FLUX_KONTEXT', '1:1 (Perfect Square)'),
                'select' => env('RUNNINGHUB_DEFAULT_SELECT_FLUX_KONTEXT', '1'),
            ],
        ],
        'midjourney' => [
            'webapp_id' => env('RUNNINGHUB_WEBAPPID_MIDJOURNEY'),
            'api_key' => env('RUNNINGHUB_API_KEY'),
            'nodes' => [
                'width' => env('RUNNINGHUB_NODEID_MIDJOURNEY_WIDTH', '4'),
                'height' => env('RUNNINGHUB_NODEID_MIDJOURNEY_HEIGHT', '4'),
                'prompt' => env('RUNNINGHUB_NODEID_MIDJOURNEY_PROMPT', '10'),
                'role' => env('RUNNINGHUB_NODEID_MIDJOURNEY_ROLE', '10'),
            ],
            'default_role' => env('RUNNINGHUB_DEFAULT_ROLE_MIDJOURNEY', '你是一个优秀的智能提示词助手，请帮我优化提示词'),
        ],
        'gpt-image-1' => [
            'webapp_id' => env('RUNNINGHUB_WEBAPPID_GPT_IMAGE_1'),
            'api_key' => env('RUNNINGHUB_API_KEY'),
            'nodes' => [
                'width' => env('RUNNINGHUB_NODEID_GPT_IMAGE_1_WIDTH', '4'),
                'height' => env('RUNNINGHUB_NODEID_GPT_IMAGE_1_HEIGHT', '4'),
                'prompt' => env('RUNNINGHUB_NODEID_GPT_IMAGE_1_PROMPT', '10'),
                'role' => env('RUNNINGHUB_NODEID_GPT_IMAGE_1_ROLE', '10'),
            ],
            'default_role' => env('RUNNINGHUB_DEFAULT_ROLE_GPT_IMAGE_1', '你是一个优秀的智能提示词助手，请帮我优化提示词'),
        ],
    ],
];