# AWS S3 Setup Guide for Video Generation

## Overview
This guide explains how to configure AWS S3 for storing video input images in the video generation feature.

## Configuration Steps

### 1. AWS Account Setup
1. Create an AWS account if you don't have one
2. Go to AWS Console → IAM → Users
3. Create a new user or use existing one
4. Attach the following policies to the user:
   - `AmazonS3FullAccess` (or create custom policy with minimal required permissions)

### 2. S3 Bucket Configuration
1. Go to AWS Console → S3
2. Create a new bucket with the following settings:
   - Choose a unique bucket name (e.g., `your-app-video-inputs`)
   - Select your preferred region
   - Keep default settings for most options
   - Make sure to enable public access if you want direct URLs

### 3. Environment Variables
Add these variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1  # Change to your preferred region
AWS_BUCKET=your-bucket-name-here
AWS_URL=https://your-bucket-name-here.s3.amazonaws.com  # Optional: custom URL
AWS_USE_PATH_STYLE_ENDPOINT=false  # Set to true for some S3-compatible services
```

### 4. Laravel Configuration
The S3 configuration is already set up in `config/filesystems.php`:

```php
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
    'endpoint' => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    'throw' => true,
    'report' => true,
],
```

## Usage

### File Upload Structure
Files are automatically organized in the following structure:
```
video-inputs/
├── 2024/
│   ├── 01/
│   │   └── video-input-1234567890-abc123.jpg
│   └── 02/
│       └── video-input-1234567891-def456.png
└── 2025/
    └── 01/
        └── video-input-1234567892-ghi789.jpg
```

### Error Handling
The system includes comprehensive error handling:
- Validates AWS credentials before upload
- Logs detailed upload information
- Provides meaningful error messages
- Handles upload failures gracefully

### Security Considerations
1. **IAM Permissions**: Use minimal required permissions instead of `AmazonS3FullAccess`
2. **Bucket Policies**: Configure bucket policies for fine-grained access control
3. **CORS Settings**: Configure CORS if accessing from web applications
4. **Encryption**: Consider enabling server-side encryption for sensitive data

### Troubleshooting

#### Common Issues:
1. **"AWS S3 credentials not configured"**
   - Check if all AWS credentials are set in `.env`
   - Verify IAM user has proper permissions

2. **"Failed to store file in S3"**
   - Check bucket exists and is accessible
   - Verify region settings match
   - Check file size limits

3. **"Failed to upload input image to S3"**
   - Check network connectivity
   - Verify bucket permissions
   - Check Laravel logs for detailed error messages

#### Testing
You can test the S3 configuration by:
1. Running: `php artisan tinker`
2. Execute: `Storage::disk('s3')->put('test.txt', 'Hello S3');`
3. Check if file appears in your S3 bucket

## Additional Resources
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Laravel Filesystem Documentation](https://laravel.com/docs/filesystem)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)