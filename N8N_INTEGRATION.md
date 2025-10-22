# Hướng dẫn tích hợp n8n với AIapp

## Tổng quan

Tài liệu này hướng dẫn cách tích hợp n8n workflow automation platform với dự án AIapp hiện tại. Hệ thống sẽ cho phép người dùng tạo và quản lý các workflow automation với các tính năng:

- Đăng nhập single sign-on (SSO) từ AIapp vào n8n
- Quản lý và giới hạn số lượng flow theo gói dịch vụ
- Tính phí theo giờ chạy workflow
- Tự động dừng workflow khi hết credit
- Giao diện quản lý workflow tích hợp trong frontend

## Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   n8n Server    │
│   (React)       │◄──►│   (Laravel)     │◄──►│   (Separate)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Auth     │    │   Credit System │    │   Workflows     │
│   Flow Manager  │    │   Pricing Plans │    │   Executions    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Yêu cầu hệ thống

### n8n Server
- n8n version >= 1.0.0
- Node.js >= 18.x
- PostgreSQL/MySQL database
- Redis (cho queue và cache)

### Backend (Laravel)
- PHP >= 8.1
- Laravel >= 10.x
- Database: MySQL/PostgreSQL
- Queue system: Redis/Database

### Frontend (React)
- React >= 18.x
- TypeScript
- Axios cho API calls

## Cài đặt và cấu hình

### 1. Cấu hình n8n Server

#### 1.1 Cài đặt n8n

```bash
# Cài đặt n8n globally
npm install -g n8n

# Hoặc sử dụng Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e WEBHOOK_URL=https://your-n8n-domain.com/ \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-password \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### 1.2 Cấu hình Environment Variables

Tạo file `.env` cho n8n:

```env
# Database
DB_TYPE=postgresdb
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=n8n_db
DB_USERNAME=n8n_user
DB_PASSWORD=your_password

# n8n Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
WEBHOOK_URL=https://your-n8n-domain.com/

# Authentication
N8N_BASIC_AUTH_ACTIVE=false
N8N_JWT_AUTH_ACTIVE=true
N8N_JWT_AUTH_HEADER=authorization
N8N_JWT_AUTH_HEADER_VALUE_PREFIX=Bearer

# External Authentication
N8N_EXTERNAL_FRONTEND_HOOKS_URLS=https://your-aiapp-domain.com/api/n8n/hooks

# API Access
N8N_API_ENABLED=true
N8N_DISABLE_UI=false

# Execution
EXECUTIONS_PROCESS=main
EXECUTIONS_MODE=regular
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_MAX_TIMEOUT=7200
```

#### 1.3 Cấu hình Authentication Hook

Tạo file `external-hooks.js` trong thư mục n8n:

```javascript
// ~/.n8n/external-hooks.js
const axios = require('axios');

module.exports = {
  async 'workflow.postExecute'(workflowData, runData) {
    // Gửi thông tin execution về AIapp backend
    try {
      await axios.post('https://your-aiapp-domain.com/api/n8n/execution-complete', {
        workflowId: workflowData.id,
        executionId: runData.executionId,
        executionTime: runData.executionTime,
        success: runData.finished,
        userId: runData.userId
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AIAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to notify AIapp:', error);
    }
  },

  async 'workflow.preExecute'(workflowData, runData) {
    // Kiểm tra credit trước khi chạy workflow
    try {
      const response = await axios.post('https://your-aiapp-domain.com/api/n8n/check-credit', {
        workflowId: workflowData.id,
        userId: runData.userId
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.AIAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.canExecute) {
        throw new Error('Insufficient credits to execute workflow');
      }
    } catch (error) {
      console.error('Credit check failed:', error);
      throw error;
    }
  }
};
```

### 2. Cấu hình Backend (Laravel)

#### 2.1 Database Migration

Tạo các migration cần thiết:

```bash
php artisan make:migration create_n8n_workflows_table
php artisan make:migration create_n8n_executions_table
php artisan make:migration add_n8n_fields_to_users_table
```

**Migration: create_n8n_workflows_table**

```php
<?php
// database/migrations/xxxx_create_n8n_workflows_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('n8n_workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('n8n_workflow_id')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('active')->default(false);
            $table->json('settings')->nullable();
            $table->timestamp('last_execution_at')->nullable();
            $table->integer('execution_count')->default(0);
            $table->decimal('total_execution_time', 10, 2)->default(0); // in hours
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->timestamps();

            $table->index(['user_id', 'active']);
            $table->index('n8n_workflow_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('n8n_workflows');
    }
};
```

**Migration: create_n8n_executions_table**

```php
<?php
// database/migrations/xxxx_create_n8n_executions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('n8n_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('n8n_workflows')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('n8n_execution_id')->unique();
            $table->enum('status', ['running', 'success', 'error', 'canceled'])->default('running');
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->decimal('execution_time', 8, 2)->nullable(); // in hours
            $table->decimal('cost', 8, 2)->default(0);
            $table->json('execution_data')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['workflow_id', 'started_at']);
            $table->index('n8n_execution_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('n8n_executions');
    }
};
```

**Migration: add_n8n_fields_to_users_table**

```php
<?php
// database/migrations/xxxx_add_n8n_fields_to_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('n8n_user_id')->nullable()->unique();
            $table->integer('max_workflows')->default(5);
            $table->decimal('workflow_hourly_rate', 8, 2)->default(1.00); // USD per hour
            $table->boolean('n8n_enabled')->default(true);
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['n8n_user_id', 'max_workflows', 'workflow_hourly_rate', 'n8n_enabled']);
        });
    }
};
```

#### 2.2 Models

**Model: N8nWorkflow**

```php
<?php
// app/Models/N8nWorkflow.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class N8nWorkflow extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'n8n_workflow_id',
        'name',
        'description',
        'active',
        'settings',
        'last_execution_at',
        'execution_count',
        'total_execution_time',
        'total_cost'
    ];

    protected $casts = [
        'active' => 'boolean',
        'settings' => 'array',
        'last_execution_at' => 'datetime',
        'total_execution_time' => 'decimal:2',
        'total_cost' => 'decimal:2'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(N8nExecution::class, 'workflow_id');
    }

    public function getRunningExecutionsCount(): int
    {
        return $this->executions()->where('status', 'running')->count();
    }

    public function calculateHourlyCost(): float
    {
        return $this->user->workflow_hourly_rate;
    }
}
```

**Model: N8nExecution**

```php
<?php
// app/Models/N8nExecution.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class N8nExecution extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'user_id',
        'n8n_execution_id',
        'status',
        'started_at',
        'finished_at',
        'execution_time',
        'cost',
        'execution_data',
        'error_message'
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'execution_time' => 'decimal:2',
        'cost' => 'decimal:2',
        'execution_data' => 'array'
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(N8nWorkflow::class, 'workflow_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function calculateCost(): float
    {
        if (!$this->execution_time || !$this->user) {
            return 0;
        }

        return $this->execution_time * $this->user->workflow_hourly_rate;
    }
}
```

#### 2.3 Services

**Service: N8nService**

```php
<?php
// app/Services/N8nService.php

namespace App\Services;

use App\Models\User;
use App\Models\N8nWorkflow;
use App\Models\N8nExecution;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class N8nService
{
    private string $n8nBaseUrl;
    private string $n8nApiKey;

    public function __construct()
    {
        $this->n8nBaseUrl = config('services.n8n.base_url');
        $this->n8nApiKey = config('services.n8n.api_key');
    }

    public function createUser(User $user): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->n8nApiKey}",
                'Content-Type' => 'application/json'
            ])->post("{$this->n8nBaseUrl}/api/v1/users", [
                'email' => $user->email,
                'firstName' => $user->name,
                'lastName' => '',
                'password' => \Str::random(32), // Random password, user will login via SSO
                'role' => 'user'
            ]);

            if ($response->successful()) {
                $userData = $response->json();
                $user->update(['n8n_user_id' => $userData['id']]);
                return $userData;
            }

            throw new \Exception('Failed to create n8n user: ' . $response->body());
        } catch (\Exception $e) {
            Log::error('N8n user creation failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function getWorkflows(User $user): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->n8nApiKey}"
            ])->get("{$this->n8nBaseUrl}/api/v1/workflows", [
                'filter' => json_encode(['ownerId' => $user->n8n_user_id])
            ]);

            if ($response->successful()) {
                return $response->json()['data'] ?? [];
            }

            return [];
        } catch (\Exception $e) {
            Log::error('Failed to fetch n8n workflows', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    public function canCreateWorkflow(User $user): bool
    {
        $currentWorkflowCount = N8nWorkflow::where('user_id', $user->id)->count();
        return $currentWorkflowCount < $user->max_workflows;
    }

    public function hasEnoughCredit(User $user, float $estimatedHours = 1): bool
    {
        $requiredCredit = $estimatedHours * $user->workflow_hourly_rate;
        return $user->credits >= $requiredCredit;
    }

    public function stopWorkflow(N8nWorkflow $workflow): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->n8nApiKey}"
            ])->post("{$this->n8nBaseUrl}/api/v1/workflows/{$workflow->n8n_workflow_id}/deactivate");

            if ($response->successful()) {
                $workflow->update(['active' => false]);
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to stop n8n workflow', [
                'workflow_id' => $workflow->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    public function stopAllUserWorkflows(User $user): int
    {
        $stoppedCount = 0;
        $activeWorkflows = N8nWorkflow::where('user_id', $user->id)
            ->where('active', true)
            ->get();

        foreach ($activeWorkflows as $workflow) {
            if ($this->stopWorkflow($workflow)) {
                $stoppedCount++;
            }
        }

        return $stoppedCount;
    }

    public function processExecutionComplete(array $data): void
    {
        try {
            $workflow = N8nWorkflow::where('n8n_workflow_id', $data['workflowId'])->first();
            if (!$workflow) {
                Log::warning('Workflow not found for execution', $data);
                return;
            }

            $execution = N8nExecution::where('n8n_execution_id', $data['executionId'])->first();
            if (!$execution) {
                Log::warning('Execution not found', $data);
                return;
            }

            $executionTime = $data['executionTime'] / 3600; // Convert seconds to hours
            $cost = $executionTime * $workflow->user->workflow_hourly_rate;

            $execution->update([
                'status' => $data['success'] ? 'success' : 'error',
                'finished_at' => now(),
                'execution_time' => $executionTime,
                'cost' => $cost
            ]);

            // Update workflow statistics
            $workflow->increment('execution_count');
            $workflow->increment('total_execution_time', $executionTime);
            $workflow->increment('total_cost', $cost);
            $workflow->update(['last_execution_at' => now()]);

            // Deduct credits from user
            $workflow->user->decrement('credits', $cost);

            // Check if user has enough credits for future executions
            if ($workflow->user->credits <= 0) {
                $this->stopAllUserWorkflows($workflow->user);
                Log::info('All workflows stopped due to insufficient credits', [
                    'user_id' => $workflow->user->id
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process execution complete', [
                'data' => $data,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function generateSSOToken(User $user): string
    {
        // Generate JWT token for SSO login to n8n
        $payload = [
            'sub' => $user->n8n_user_id,
            'email' => $user->email,
            'name' => $user->name,
            'iat' => time(),
            'exp' => time() + 3600 // 1 hour expiry
        ];

        return \Firebase\JWT\JWT::encode($payload, config('services.n8n.jwt_secret'), 'HS256');
    }
}
```

#### 2.4 Controllers

**Controller: N8nController**

```php
<?php
// app/Http/Controllers/Api/N8nController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\N8nService;
use App\Models\N8nWorkflow;
use App\Models\N8nExecution;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class N8nController extends Controller
{
    private N8nService $n8nService;

    public function __construct(N8nService $n8nService)
    {
        $this->n8nService = $n8nService;
    }

    public function getWorkflows(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Ensure user exists in n8n
            if (!$user->n8n_user_id) {
                $this->n8nService->createUser($user);
            }

            $workflows = $this->n8nService->getWorkflows($user);
            
            // Sync with local database
            foreach ($workflows as $workflowData) {
                N8nWorkflow::updateOrCreate(
                    ['n8n_workflow_id' => $workflowData['id']],
                    [
                        'user_id' => $user->id,
                        'name' => $workflowData['name'],
                        'active' => $workflowData['active'] ?? false,
                        'settings' => $workflowData['settings'] ?? null
                    ]
                );
            }

            $localWorkflows = N8nWorkflow::where('user_id', $user->id)
                ->with('executions')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'workflows' => $localWorkflows,
                    'limits' => [
                        'max_workflows' => $user->max_workflows,
                        'current_count' => $localWorkflows->count(),
                        'can_create_more' => $this->n8nService->canCreateWorkflow($user)
                    ],
                    'credits' => [
                        'current' => $user->credits,
                        'hourly_rate' => $user->workflow_hourly_rate
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch workflows',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkLimits(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'success' => true,
            'data' => [
                'can_create_workflow' => $this->n8nService->canCreateWorkflow($user),
                'max_workflows' => $user->max_workflows,
                'current_workflows' => N8nWorkflow::where('user_id', $user->id)->count(),
                'has_enough_credit' => $this->n8nService->hasEnoughCredit($user),
                'current_credits' => $user->credits,
                'hourly_rate' => $user->workflow_hourly_rate
            ]
        ]);
    }

    public function getSSOUrl(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            if (!$user->n8n_user_id) {
                $this->n8nService->createUser($user);
            }

            $token = $this->n8nService->generateSSOToken($user);
            $ssoUrl = config('services.n8n.base_url') . '/sso?token=' . $token;

            return response()->json([
                'success' => true,
                'data' => [
                    'sso_url' => $ssoUrl,
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate SSO URL',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stopWorkflow(Request $request, $workflowId): JsonResponse
    {
        try {
            $user = $request->user();
            $workflow = N8nWorkflow::where('id', $workflowId)
                ->where('user_id', $user->id)
                ->firstOrFail();

            $stopped = $this->n8nService->stopWorkflow($workflow);

            return response()->json([
                'success' => $stopped,
                'message' => $stopped ? 'Workflow stopped successfully' : 'Failed to stop workflow'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stop workflow',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stopAllWorkflows(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $stoppedCount = $this->n8nService->stopAllUserWorkflows($user);

            return response()->json([
                'success' => true,
                'message' => "Stopped {$stoppedCount} workflows",
                'data' => ['stopped_count' => $stoppedCount]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stop workflows',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Webhook endpoints for n8n callbacks
    public function executionComplete(Request $request): JsonResponse
    {
        try {
            $this->n8nService->processExecutionComplete($request->all());
            
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkCredit(Request $request): JsonResponse
    {
        try {
            $workflowId = $request->input('workflowId');
            $userId = $request->input('userId');

            $workflow = N8nWorkflow::where('n8n_workflow_id', $workflowId)->first();
            if (!$workflow) {
                return response()->json(['canExecute' => false, 'reason' => 'Workflow not found']);
            }

            $user = $workflow->user;
            if (!$user || $user->credits <= 0) {
                return response()->json(['canExecute' => false, 'reason' => 'Insufficient credits']);
            }

            if (!$user->n8n_enabled) {
                return response()->json(['canExecute' => false, 'reason' => 'n8n disabled for user']);
            }

            return response()->json(['canExecute' => true]);

        } catch (\Exception $e) {
            return response()->json([
                'canExecute' => false,
                'reason' => 'Credit check failed: ' . $e->getMessage()
            ]);
        }
    }
}
```

#### 2.5 Routes

Thêm vào `routes/api.php`:

```php
<?php
// routes/api.php

use App\Http\Controllers\Api\N8nController;

Route::middleware('auth:sanctum')->group(function () {
    // n8n Integration Routes
    Route::prefix('n8n')->group(function () {
        Route::get('/workflows', [N8nController::class, 'getWorkflows']);
        Route::get('/limits', [N8nController::class, 'checkLimits']);
        Route::get('/sso-url', [N8nController::class, 'getSSOUrl']);
        Route::post('/workflows/{workflow}/stop', [N8nController::class, 'stopWorkflow']);
        Route::post('/workflows/stop-all', [N8nController::class, 'stopAllWorkflows']);
    });
});

// Webhook routes (no auth required, but should be secured with API key)
Route::middleware('api')->group(function () {
    Route::post('/n8n/execution-complete', [N8nController::class, 'executionComplete']);
    Route::post('/n8n/check-credit', [N8nController::class, 'checkCredit']);
});
```

#### 2.6 Configuration

Thêm vào `config/services.php`:

```php
<?php
// config/services.php

return [
    // ... existing services

    'n8n' => [
        'base_url' => env('N8N_BASE_URL', 'https://your-n8n-domain.com'),
        'api_key' => env('N8N_API_KEY'),
        'jwt_secret' => env('N8N_JWT_SECRET'),
        'webhook_secret' => env('N8N_WEBHOOK_SECRET'),
    ],
];
```

Thêm vào `.env`:

```env
# n8n Configuration
N8N_BASE_URL=https://your-n8n-domain.com
N8N_API_KEY=your-n8n-api-key
N8N_JWT_SECRET=your-jwt-secret-key
N8N_WEBHOOK_SECRET=your-webhook-secret
```

### 3. Tích hợp Frontend

#### 3.1 Service Layer

Tạo `services/N8nService.ts`:

```typescript
// services/N8nService.ts

import axios from 'axios';

export interface N8nWorkflow {
  id: number;
  n8n_workflow_id: string;
  name: string;
  description?: string;
  active: boolean;
  settings?: any;
  last_execution_at?: string;
  execution_count: number;
  total_execution_time: number;
  total_cost: number;
  executions?: N8nExecution[];
}

export interface N8nExecution {
  id: number;
  n8n_execution_id: string;
  status: 'running' | 'success' | 'error' | 'canceled';
  started_at: string;
  finished_at?: string;
  execution_time?: number;
  cost: number;
  error_message?: string;
}

export interface WorkflowLimits {
  max_workflows: number;
  current_count: number;
  can_create_more: boolean;
}

export interface CreditInfo {
  current: number;
  hourly_rate: number;
}

export interface N8nData {
  workflows: N8nWorkflow[];
  limits: WorkflowLimits;
  credits: CreditInfo;
}

class N8nService {
  private baseURL = '/api/n8n';

  async getWorkflows(): Promise<N8nData> {
    const response = await axios.get(`${this.baseURL}/workflows`);
    return response.data.data;
  }

  async checkLimits(): Promise<{
    can_create_workflow: boolean;
    max_workflows: number;
    current_workflows: number;
    has_enough_credit: boolean;
    current_credits: number;
    hourly_rate: number;
  }> {
    const response = await axios.get(`${this.baseURL}/limits`);
    return response.data.data;
  }

  async getSSOUrl(): Promise<{ sso_url: string; token: string }> {
    const response = await axios.get(`${this.baseURL}/sso-url`);
    return response.data.data;
  }

  async stopWorkflow(workflowId: number): Promise<boolean> {
    const response = await axios.post(`${this.baseURL}/workflows/${workflowId}/stop`);
    return response.data.success;
  }

  async stopAllWorkflows(): Promise<{ stopped_count: number }> {
    const response = await axios.post(`${this.baseURL}/workflows/stop-all`);
    return response.data.data;
  }

  openN8nEditor(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const { sso_url } = await this.getSSOUrl();
        const newWindow = window.open(sso_url, 'n8n-editor', 'width=1200,height=800');
        
        if (!newWindow) {
          reject(new Error('Popup blocked. Please allow popups for this site.'));
          return;
        }

        // Listen for window close
        const checkClosed = setInterval(() => {
          if (newWindow.closed) {
            clearInterval(checkClosed);
            resolve();
          }
        }, 1000);

      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new N8nService();
```

#### 3.2 React Components

**Component: WorkflowManager**

```tsx
// components/WorkflowManager.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Settings, 
  Plus, 
  AlertTriangle,
  Clock,
  DollarSign,
  Zap
} from 'lucide-react';
import N8nService, { N8nWorkflow, N8nData } from '@/services/N8nService';

const WorkflowManager: React.FC = () => {
  const [data, setData] = useState<N8nData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const workflowData = await N8nService.getWorkflows();
      setData(workflowData);
      setError(null);
    } catch (err) {
      setError('Failed to load workflows');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = async () => {
    try {
      setActionLoading('editor');
      await N8nService.openN8nEditor();
      // Refresh workflows after editor is closed
      await loadWorkflows();
    } catch (err) {
      setError('Failed to open n8n editor');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopWorkflow = async (workflowId: number) => {
    try {
      setActionLoading(`stop-${workflowId}`);
      await N8nService.stopWorkflow(workflowId);
      await loadWorkflows();
    } catch (err) {
      setError('Failed to stop workflow');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAllWorkflows = async () => {
    try {
      setActionLoading('stop-all');
      await N8nService.stopAllWorkflows();
      await loadWorkflows();
    } catch (err) {
      setError('Failed to stop all workflows');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load workflow data</AlertDescription>
      </Alert>
    );
  }

  const { workflows, limits, credits } = data;
  const activeWorkflows = workflows.filter(w => w.active);
  const lowCredit = credits.current < credits.hourly_rate * 2; // Less than 2 hours

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workflow Automation</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleOpenEditor}
            disabled={!limits.can_create_more || actionLoading === 'editor'}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {actionLoading === 'editor' ? 'Opening...' : 'Create Workflow'}
          </Button>
          {activeWorkflows.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleStopAllWorkflows}
              disabled={actionLoading === 'stop-all'}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              {actionLoading === 'stop-all' ? 'Stopping...' : 'Stop All'}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lowCredit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Low credit warning! You have {formatCurrency(credits.current)} remaining. 
            Workflows cost {formatCurrency(credits.hourly_rate)} per hour.
          </AlertDescription>
        </Alert>
      )}

      {!limits.can_create_more && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You've reached the maximum number of workflows ({limits.max_workflows}). 
            Delete some workflows to create new ones.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">{activeWorkflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold">{workflows.length}/{limits.max_workflows}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Credits</p>
                <p className="text-2xl font-bold">{formatCurrency(credits.current)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="text-2xl font-bold">{formatCurrency(credits.hourly_rate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4">
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first automation workflow to get started.
              </p>
              <Button onClick={handleOpenEditor} disabled={!limits.can_create_more}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Workflow
              </Button>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onStop={() => handleStopWorkflow(workflow.id)}
              onEdit={handleOpenEditor}
              isLoading={actionLoading === `stop-${workflow.id}`}
              credits={credits}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface WorkflowCardProps {
  workflow: N8nWorkflow;
  onStop: () => void;
  onEdit: () => void;
  isLoading: boolean;
  credits: { current: number; hourly_rate: number };
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  onStop,
  onEdit,
  isLoading,
  credits
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const runningExecutions = workflow.executions?.filter(e => e.status === 'running') || [];
  const canRun = credits.current >= credits.hourly_rate;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {workflow.name}
              <Badge variant={workflow.active ? 'default' : 'secondary'}>
                {workflow.active ? 'Active' : 'Inactive'}
              </Badge>
              {runningExecutions.length > 0 && (
                <Badge variant="outline" className="text-blue-600">
                  {runningExecutions.length} Running
                </Badge>
              )}
            </CardTitle>
            {workflow.description && (
              <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Settings className="h-4 w-4" />
            </Button>
            {workflow.active && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStop}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Executions</p>
            <p className="font-semibold">{workflow.execution_count}</p>
          </div>
          <div>
            <p className="text-gray-600">Runtime</p>
            <p className="font-semibold">{formatHours(workflow.total_execution_time)}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Cost</p>
            <p className="font-semibold">{formatCurrency(workflow.total_cost)}</p>
          </div>
          <div>
            <p className="text-gray-600">Last Run</p>
            <p className="font-semibold">
              {workflow.last_execution_at 
                ? new Date(workflow.last_execution_at).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>

        {!canRun && workflow.active && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Insufficient credits to run this workflow. 
              Add more credits to continue automation.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowManager;
```

#### 3.3 Integration với Router

Thêm vào `router.tsx`:

```tsx
// router.tsx

import WorkflowManager from '@/components/WorkflowManager';

// Thêm route mới
{
  path: '/workflows',
  element: <WorkflowManager />,
  meta: {
    title: 'Workflow Automation',
    requiresAuth: true
  }
}
```

### 4. Cron Jobs và Background Tasks

#### 4.1 Laravel Scheduler

Thêm vào `app/Console/Kernel.php`:

```php
<?php
// app/Console/Kernel.php

protected function schedule(Schedule $schedule)
{
    // Check and stop workflows for users with insufficient credits
    $schedule->command('n8n:check-credits')
        ->everyFiveMinutes()
        ->withoutOverlapping();

    // Sync workflow status with n8n server
    $schedule->command('n8n:sync-workflows')
        ->hourly()
        ->withoutOverlapping();

    // Clean up old execution records
    $schedule->command('n8n:cleanup-executions')
        ->daily()
        ->at('02:00');
}
```

#### 4.2 Artisan Commands

**Command: CheckCredits**

```php
<?php
// app/Console/Commands/CheckN8nCredits.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\N8nService;

class CheckN8nCredits extends Command
{
    protected $signature = 'n8n:check-credits';
    protected $description = 'Check user credits and stop workflows if insufficient';

    private N8nService $n8nService;

    public function __construct(N8nService $n8nService)
    {
        parent::__construct();
        $this->n8nService = $n8nService;
    }

    public function handle()
    {
        $this->info('Checking user credits for n8n workflows...');

        $usersWithLowCredits = User::where('n8n_enabled', true)
            ->where('credits', '<=', 0)
            ->whereHas('n8nWorkflows', function ($query) {
                $query->where('active', true);
            })
            ->get();

        $totalStopped = 0;

        foreach ($usersWithLowCredits as $user) {
            $stoppedCount = $this->n8nService->stopAllUserWorkflows($user);
            $totalStopped += $stoppedCount;
            
            $this->info("Stopped {$stoppedCount} workflows for user {$user->email}");
        }

        $this->info("Total workflows stopped: {$totalStopped}");
        
        return 0;
    }
}
```

**Command: SyncWorkflows**

```php
<?php
// app/Console/Commands/SyncN8nWorkflows.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\N8nWorkflow;
use App\Services\N8nService;

class SyncN8nWorkflows extends Command
{
    protected $signature = 'n8n:sync-workflows';
    protected $description = 'Sync workflow status with n8n server';

    private N8nService $n8nService;

    public function __construct(N8nService $n8nService)
    {
        parent::__construct();
        $this->n8nService = $n8nService;
    }

    public function handle()
    {
        $this->info('Syncing workflows with n8n server...');

        $users = User::where('n8n_enabled', true)
            ->whereNotNull('n8n_user_id')
            ->get();

        foreach ($users as $user) {
            try {
                $n8nWorkflows = $this->n8nService->getWorkflows($user);
                
                foreach ($n8nWorkflows as $workflowData) {
                    N8nWorkflow::updateOrCreate(
                        ['n8n_workflow_id' => $workflowData['id']],
                        [
                            'user_id' => $user->id,
                            'name' => $workflowData['name'],
                            'active' => $workflowData['active'] ?? false,
                            'settings' => $workflowData['settings'] ?? null
                        ]
                    );
                }

                $this->info("Synced workflows for user {$user->email}");
                
            } catch (\Exception $e) {
                $this->error("Failed to sync workflows for user {$user->email}: {$e->getMessage()}");
            }
        }

        $this->info('Workflow sync completed');
        
        return 0;
    }
}
```

### 5. Testing và Deployment

#### 5.1 Testing Script

Tạo `test-n8n-integration.php`:

```php
<?php
// test-n8n-integration.php

require_once 'vendor/autoload.php';

use App\Services\N8nService;
use App\Models\User;

// Test n8n service integration
$user = User::find(1); // Replace with actual user ID
$n8nService = new N8nService();

echo "Testing n8n Integration...\n";

try {
    // Test 1: Create user in n8n
    echo "1. Creating user in n8n...\n";
    $n8nUser = $n8nService->createUser($user);
    echo "✓ User created: " . json_encode($n8nUser) . "\n";

    // Test 2: Get workflows
    echo "2. Fetching workflows...\n";
    $workflows = $n8nService->getWorkflows($user);
    echo "✓ Workflows fetched: " . count($workflows) . " workflows\n";

    // Test 3: Check limits
    echo "3. Checking workflow limits...\n";
    $canCreate = $n8nService->canCreateWorkflow($user);
    echo "✓ Can create workflow: " . ($canCreate ? 'Yes' : 'No') . "\n";

    // Test 4: Check credits
    echo "4. Checking credits...\n";
    $hasCredit = $n8nService->hasEnoughCredit($user);
    echo "✓ Has enough credit: " . ($hasCredit ? 'Yes' : 'No') . "\n";

    // Test 5: Generate SSO token
    echo "5. Generating SSO token...\n";
    $token = $n8nService->generateSSOToken($user);
    echo "✓ SSO token generated: " . substr($token, 0, 20) . "...\n";

    echo "\n✅ All tests passed!\n";

} catch (Exception $e) {
    echo "❌ Test failed: " . $e->getMessage() . "\n";
}
```

#### 5.2 Frontend Testing

Tạo `frontend/test-n8n.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>n8n Integration Test</title>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
    <h1>n8n Integration Test</h1>
    <div id="results"></div>

    <script>
        async function testN8nIntegration() {
            const results = document.getElementById('results');
            
            try {
                // Test API endpoints
                const tests = [
                    { name: 'Get Workflows', url: '/api/n8n/workflows' },
                    { name: 'Check Limits', url: '/api/n8n/limits' },
                    { name: 'Get SSO URL', url: '/api/n8n/sso-url' }
                ];

                for (const test of tests) {
                    try {
                        const response = await axios.get(test.url);
                        results.innerHTML += `<p>✅ ${test.name}: Success</p>`;
                        console.log(test.name, response.data);
                    } catch (error) {
                        results.innerHTML += `<p>❌ ${test.name}: ${error.message}</p>`;
                    }
                }

            } catch (error) {
                results.innerHTML += `<p>❌ General Error: ${error.message}</p>`;
            }
        }

        // Run tests when page loads
        testN8nIntegration();
    </script>
</body>
</html>
```

### 6. Security và Best Practices

#### 6.1 API Security

```php
<?php
// app/Http/Middleware/N8nWebhookAuth.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class N8nWebhookAuth
{
    public function handle(Request $request, Closure $next)
    {
        $expectedSecret = config('services.n8n.webhook_secret');
        $providedSecret = $request->header('X-N8N-Webhook-Secret');

        if (!$expectedSecret || !$providedSecret || !hash_equals($expectedSecret, $providedSecret)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
```

#### 6.2 Rate Limiting

```php
<?php
// app/Http/Controllers/Api/N8nController.php

use Illuminate\Support\Facades\RateLimiter;

class N8nController extends Controller
{
    public function getWorkflows(Request $request): JsonResponse
    {
        $key = 'n8n-workflows:' . $request->user()->id;
        
        if (RateLimiter::tooManyAttempts($key, 10)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests'
            ], 429);
        }

        RateLimiter::hit($key, 60); // 10 requests per minute

        // ... rest of the method
    }
}
```

### 7. Monitoring và Logging

#### 7.1 Workflow Monitoring

```php
<?php
// app/Services/N8nMonitoringService.php

namespace App\Services;

use App\Models\N8nWorkflow;
use App\Models\N8nExecution;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class N8nMonitoringService
{
    public function checkWorkflowHealth(): array
    {
        $issues = [];

        // Check for stuck executions
        $stuckExecutions = N8nExecution::where('status', 'running')
            ->where('started_at', '<', now()->subHours(2))
            ->get();

        if ($stuckExecutions->count() > 0) {
            $issues[] = "Found {$stuckExecutions->count()} stuck executions";
            Log::warning('Stuck n8n executions detected', [
                'count' => $stuckExecutions->count(),
                'executions' => $stuckExecutions->pluck('id')
            ]);
        }

        // Check for workflows with high error rates
        $errorProneWorkflows = N8nWorkflow::whereHas('executions', function ($query) {
            $query->where('status', 'error')
                ->where('created_at', '>', now()->subDay());
        }, '>=', 5)->get();

        if ($errorProneWorkflows->count() > 0) {
            $issues[] = "Found {$errorProneWorkflows->count()} workflows with high error rates";
        }

        return $issues;
    }

    public function generateUsageReport(int $userId = null): array
    {
        $query = N8nExecution::with(['workflow', 'user']);
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $executions = $query->where('created_at', '>', now()->subMonth())->get();

        return [
            'total_executions' => $executions->count(),
            'successful_executions' => $executions->where('status', 'success')->count(),
            'failed_executions' => $executions->where('status', 'error')->count(),
            'total_runtime' => $executions->sum('execution_time'),
            'total_cost' => $executions->sum('cost'),
            'top_workflows' => $executions->groupBy('workflow_id')
                ->map(function ($group) {
                    return [
                        'workflow_name' => $group->first()->workflow->name,
                        'execution_count' => $group->count(),
                        'total_cost' => $group->sum('cost')
                    ];
                })
                ->sortByDesc('execution_count')
                ->take(10)
                ->values()
        ];
    }
}
```

## Kết luận

Hướng dẫn này cung cấp một giải pháp tích hợp hoàn chỉnh giữa n8n và dự án AIapp, bao gồm:

1. **Authentication**: SSO từ AIapp vào n8n
2. **Workflow Management**: Quản lý và giới hạn workflow theo gói dịch vụ
3. **Credit System**: Tính phí theo giờ và tự động dừng khi hết credit
4. **Frontend Integration**: Giao diện quản lý workflow tích hợp
5. **Monitoring**: Theo dõi và báo cáo sử dụng
6. **Security**: Bảo mật API và webhook

### Các bước triển khai:

1. Cài đặt và cấu hình n8n server
2. Chạy migration và cập nhật backend Laravel
3. Tích hợp frontend React components
4. Cấu hình cron jobs và background tasks
5. Test và deploy hệ thống

Hệ thống này cho phép người dùng tạo và quản lý workflow automation một cách liền mạch trong ứng dụng AIapp hiện tại.