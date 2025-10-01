import {
  Provider,
  ImageOutput,
  loggingMiddleware,
  uploadMiddleware,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import type CreativeEditorSDK from '@cesdk/cesdk-js';

// Define your input type based on your schema
interface MyProviderInput {
  prompt: string;
  width: number;
  height: number;
  style: string;
  image_url?: string; // For image-to-image operations
}

// Define provider configuration
interface MyProviderConfiguration extends CommonProviderConfiguration<MyProviderInput, ImageOutput> {
  apiKey: string;
  baseUrl?: string;
}

// OpenAPI Schema for the input form
const apiSchema = {
  "openapi": "3.0.0",
  "info": {
    "title": "My Image Generator API",
    "version": "1.0.0"
  },
  "components": {
    "schemas": {
      "GenerationInput": {
        "type": "object",
        "required": ["prompt"],
        "properties": {
          "prompt": {
            "type": "string",
            "title": "Description",
            "description": "Describe the image you want to generate",
            "x-imgly-builder": {
              "component": "TextArea"
            }
          },
          "width": {
            "type": "integer",
            "title": "Width",
            "default": 512,
            "enum": [256, 512, 768, 1024],
            "x-imgly-builder": {
              "component": "Select"
            }
          },
          "height": {
            "type": "integer",
            "title": "Height",
            "default": 512,
            "enum": [256, 512, 768, 1024],
            "x-imgly-builder": {
              "component": "Select"
            }
          },
          "style": {
            "type": "string",
            "title": "Style",
            "default": "photorealistic",
            "enum": [
              "photorealistic",
              "cartoon",
              "sketch",
              "painting"
            ],
            "x-imgly-builder": {
              "component": "Select"
            }
          }
        },
        "x-order-properties": ["prompt", "width", "height", "style"]
      }
    }
  }
};

export class MyImageProvider implements Provider<MyProviderInput, ImageOutput> {
  public readonly id = 'my-image-provider';
  public readonly kind = 'image' as const;
  
  private config: MyProviderConfiguration;

  constructor(config: MyProviderConfiguration) {
    this.config = config;
  }

  async initialize(cesdk: CreativeEditorSDK): Promise<void> {
    // Initialize any necessary setup
    console.log('MyImageProvider initialized');
  }

  get input() {
    return {
      schema: apiSchema,
      schemaPath: '#/components/schemas/GenerationInput',
      supported: {
        'text-to-image': true,
        'image-to-image': false
      }
    };
  }

  get output() {
    return {
      generate: async (input: MyProviderInput): Promise<ImageOutput> => {
        try {
          // Here you would call your actual image generation API
          // For now, we'll use a placeholder implementation
          const response = await this.callImageGenerationAPI(input);
          
          return {
            images: response.images.map((imageUrl: string) => ({
              url: imageUrl,
              width: input.width,
              height: input.height
            }))
          };
        } catch (error) {
          console.error('Image generation failed:', error);
          throw new Error('Failed to generate image');
        }
      }
    };
  }

  private async callImageGenerationAPI(input: MyProviderInput): Promise<{ images: string[] }> {
    // This is where you would integrate with your actual image generation service
    // For example, calling Runware API, OpenAI DALL-E, or any other service
    
    const apiUrl = this.config.baseUrl || '/api/generate-image';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.headers
      },
      body: JSON.stringify({
        prompt: input.prompt,
        width: input.width,
        height: input.height,
        style: input.style
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }
}

// Factory function to create the provider
export function createMyImageProvider(config: Omit<MyProviderConfiguration, 'proxyUrl'>): MyImageProvider {
  return new MyImageProvider({
    ...config,
    proxyUrl: config.baseUrl || '/api/proxy',
    middleware: [
      loggingMiddleware(),
      uploadMiddleware()
    ]
  });
}