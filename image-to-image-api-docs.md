# Image-to-Image API Endpoint

## Endpoint
`POST /api/images/image-to-image`

## Authentication
Requires Bearer token authentication.

## Request Body

```json
{
    "prompt": "string (required) - The text prompt describing the desired transformation",
    "image": "string (required) - Base64 encoded image data or image URL",
    "ratio": "string (required) - Aspect ratio. Valid values: auto, 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9",
    "name": "string (optional) - Name for the generation task",
    "share": "boolean (optional) - Whether to share the result publicly"
}
```

## Example Request

```bash
curl --location --request POST 'https://your-domain.com/api/images/image-to-image' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE' \
--header 'Content-Type: application/json' \
--data-raw '{
    "prompt": "A beautiful landscape with mountains and sunset",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "ratio": "16:9",
    "name": "My Image Transformation"
}'
```

## Success Response

```json
{
    "success": true,
    "data": {
        "id": 123,
        "status": "completed",
        "images": [
            {
                "url": "https://example.com/generated-image.jpg",
                "seed": null
            }
        ],
        "credit_cost": 10
    }
}
```

## Error Responses

### Validation Error (422)
```json
{
    "error": "Validation failed",
    "details": {
        "prompt": ["The prompt field is required."],
        "image": ["The image field is required."],
        "ratio": ["The ratio field is required."]
    }
}
```

### Insufficient Credits (400)
```json
{
    "error": "Insufficient credits",
    "required": 10,
    "available": 5
}
```

### Generation Failed (500)
```json
{
    "error": "Image-to-image generation failed: [error message]",
    "generate_id": 123
}
```

## Implementation Details

The endpoint:
1. Validates the request data
2. Checks user authentication and credits
3. Creates a generation record in the database
4. Deducts credits from user account
5. Calls the RunningHub API with the provided parameters
6. Polls for results until completion or timeout
7. Updates the generation record with results
8. Returns the generated images

## Credit Cost
The endpoint costs 10 credits per generation by default (configurable via the AIModel configuration).

## Notes
- The endpoint uses the RunningHub API for image generation
- Results are typically available within 30-90 seconds
- Failed generations automatically refund credits
- Generated images are stored and accessible via the generation ID