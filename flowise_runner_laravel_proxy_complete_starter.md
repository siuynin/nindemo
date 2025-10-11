# Flowise Runner (Node) + Laravel Proxy — Starter

> Tài liệu này chứa cấu trúc code mẫu để deploy **Flowise runner** (Node.js) sử dụng Flowise core / self-host hoặc REST API nội bộ, cùng **Laravel proxy** để quản lý tenant, credit và gọi runner.

---

## Files included (in the document below)
- `node-runner/server.js` — Node service (Express) làm runner cho Flowise
- `node-runner/package.json` — dependencies
- `node-runner/Dockerfile` — Docker build cho Node runner
- `docker-compose.yml` — mẫu compose kết hợp Laravel, Node-runner, Postgres (opt)
- `laravel/app/Http/Controllers/FlowController.php` — Laravel controller sample
- `laravel/routes/web.php` — route mẫu cho tenant subdomain
- `laravel/database/migrations/2025_01_01_create_tenants_table.php` — migration tenants
- `laravel/app/Models/Tenant.php` — Tenant model (mass assignable fields)
- `laravel/app/Console/Commands/CreateTenant.php` — artisan command để tạo tenant và clone flow

---

---

## node-runner/server.js

```js
// node-runner/server.js
// Lightweight runner that can:
//  - run a saved flow JSON via flowise core (if installed)
//  - fallback to calling Flowise REST API if core SDK isn't available
//  - expose endpoints: /run-flow, /upload-flow, /duplicate-flow, /health

import express from 'express'
import fs from 'fs'
import path from 'path'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'

const app = express()
app.use(bodyParser.json({ limit: '5mb' }))

// CONFIG: set via env
const PORT = process.env.PORT || 3001
const FLOWISE_LOCAL = process.env.FLOWISE_LOCAL === 'true' // whether we expect to run flowise SDK
const FLOWISE_REST_BASE = process.env.FLOWISE_REST_BASE || 'http://localhost:3000' // Flowise UI/API
const STORAGE_DIR = process.env.FLOW_STORAGE_DIR || './flows'

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true })

let flowiseApp = null
let useSdk = false

async function tryInitSdk() {
  if (!FLOWISE_LOCAL) return
  try {
    // attempt to lazy-import flowise core
    // note: actual import path may differ depending on the package; adjust if needed
    const { App } = await import('flowise-core')
    flowiseApp = new App({ flowsDir: STORAGE_DIR })
    if (flowiseApp.init) await flowiseApp.init()
    useSdk = true
    console.log('Flowise SDK inited (local)')
  } catch (err) {
    console.warn('Flowise SDK not available — falling back to REST API. Error:', err.message)
    useSdk = false
  }
}

await tryInitSdk()

app.get('/health', (req, res) => res.json({ ok: true, useSdk }))

// Upload a flow JSON (save into flows directory)
app.post('/upload-flow', async (req, res) => {
  try {
    const { flow_id, flow_json } = req.body
    if (!flow_id || !flow_json) return res.status(400).json({ error: 'flow_id and flow_json required' })
    const filePath = path.join(STORAGE_DIR, `${flow_id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(flow_json, null, 2))
    return res.json({ ok: true, path: filePath })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

// Duplicate a template flow using Flowise REST API (if available)
app.post('/duplicate-flow', async (req, res) => {
  try {
    const { templateFlowId, newFlowId } = req.body
    if (!templateFlowId || !newFlowId) return res.status(400).json({ error: 'templateFlowId & newFlowId required' })

    if (useSdk && flowiseApp?.duplicateFlow) {
      const dup = await flowiseApp.duplicateFlow(templateFlowId, newFlowId)
      return res.json({ ok: true, dup })
    }

    // fallback to REST API duplicate (Flowise UI may support /api/v1/flows/duplicate)
    const url = `${FLOWISE_REST_BASE}/api/v1/flows/duplicate/${templateFlowId}`
    const r = await fetch(url, { method: 'POST' })
    const data = await r.json()
    return res.json({ ok: true, data })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

// Run a flow by id (load local JSON if using SDK, otherwise call Flowise REST prediction endpoint)
app.post('/run-flow', async (req, res) => {
  try {
    const { flow_id, inputs = {}, options = {} } = req.body
    if (!flow_id) return res.status(400).json({ error: 'flow_id required' })

    if (useSdk && flowiseApp?.runFlow) {
      // load local JSON
      const flowPath = path.join(STORAGE_DIR, `${flow_id}.json`)
      if (!fs.existsSync(flowPath)) return res.status(404).json({ error: 'flow not found' })
      const flowJson = JSON.parse(fs.readFileSync(flowPath, 'utf-8'))
      const result = await flowiseApp.runFlow(flowJson, { inputs, options })
      return res.json({ ok: true, result })
    }

    // fallback: call Flowise REST API prediction endpoint
    const url = `${FLOWISE_REST_BASE}/api/v1/prediction/${flow_id}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs, options })
    })
    const data = await r.json()
    return res.json({ ok: true, data })
  } catch (e) {
    console.error('run-flow error', e)
    return res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => console.log(`Flowise Runner listening on ${PORT}`))
```

---

## node-runner/package.json

```json
{
  "name": "flowise-runner",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "node-fetch": "^3.4.1",
    "flowise-core": "^0.0.1-PLACEHOLDER"
  }
}
```

> **Note:** `flowise-core` là tên giả định cho package core. Tên thực tế có thể khác (kiểm tra repo Flowise để biết tên package). Nếu không có package, runner sẽ fallback sang REST API của Flowise.

---

## node-runner/Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --production || npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

---

## docker-compose.yml (mẫu)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - db-data:/var/lib/postgresql/data

  laravel:
    build: ./laravel
    depends_on: [postgres]
    environment:
      DB_HOST: postgres
    ports:
      - 8000:80

  flowise-runner:
    build: ./node-runner
    environment:
      - FLOWISE_LOCAL=false
      - FLOWISE_REST_BASE=http://flowise:3000
    ports:
      - 3001:3001

  # optional: self-hosted Flowise UI instance
  flowise:
    image: ghcr.io/flowiseai/flowise:latest
    ports:
      - 3000:3000
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./flowise-data:/usr/src/app/data

volumes:
  db-data:
```

---

## Laravel: migration — tenants table

```php
// database/migrations/2025_01_01_create_tenants_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subdomain')->unique();
            $table->string('flowise_flow_id')->nullable();
            $table->string('n8n_webhook')->nullable();
            $table->decimal('credit_balance', 10, 2)->default(0);
            $table->json('branding')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
```

---

## Laravel: Tenant model

```php
// app/Models/Tenant.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = ['name', 'subdomain', 'flowise_flow_id', 'n8n_webhook', 'credit_balance', 'branding'];
    protected $casts = ['branding' => 'array'];
}
```

---

## Laravel: FlowController sample

```php
// app/Http/Controllers/FlowController.php
namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FlowController extends Controller
{
    public function runFlow(Request $request, $subdomain)
    {
        $tenant = Tenant::where('subdomain', $subdomain)->firstOrFail();
        $flowId = $tenant->flowise_flow_id;
        if (!$flowId) return response()->json(['error' => 'No flow configured'], 400);

        // check credit
        if ($tenant->credit_balance <= 0) {
            return response()->json(['error' => 'out_of_credit'], 402);
        }

        $payload = [
            'flow_id' => $flowId,
            'inputs' => $request->input('inputs', []),
            'options' => $request->input('options', []),
        ];

        // call node-runner (local)
        $runnerUrl = config('services.flowise_runner.url');
        $res = Http::post($runnerUrl . '/run-flow', $payload);
        $data = $res->json();

        // example: deduct flat 1 credit per run (you should calculate based on tokens)
        $tenant->decrement('credit_balance', 1);

        // log usage (you should implement Usage model)
        // Usage::create([...])

        return response()->json($data);
    }
}
```

---

## Laravel: routes/web.php (subdomain routing)

```php
// routes/web.php
use App\Http\Controllers\FlowController;

Route::domain('{subdomain}.' . env('APP_DOMAIN'))->group(function () {
    Route::post('/api/run-flow', [FlowController::class, 'runFlow']);
});
```

---

## Laravel: Artisan command to create tenant & duplicate flow

```php
// app/Console/Commands/CreateTenant.php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Tenant;

class CreateTenant extends Command
{
    protected $signature = 'tenant:create {name} {subdomain} {templateFlowId}';
    protected $description = 'Create tenant and duplicate template Flowise flow';

    public function handle()
    {
        $name = $this->argument('name');
        $subdomain = $this->argument('subdomain');
        $templateFlowId = $this->argument('templateFlowId');

        // Create DB record
        $tenant = Tenant::create([ 'name' => $name, 'subdomain' => $subdomain ]);

        // Call runner to duplicate flow
        $runnerUrl = config('services.flowise_runner.url');
        $resp = Http::post($runnerUrl . '/duplicate-flow', [
            'templateFlowId' => $templateFlowId,
            'newFlowId' => $tenant->id . '-' . time()
        ]);
        $data = $resp->json();

        // store flow id (flowise may return id)
        $tenant->flowise_flow_id = $data['data']['id'] ?? ($tenant->id . '-' . time());
        $tenant->save();

        $this->info('Tenant created: ' . $tenant->subdomain . ' with flow ' . $tenant->flowise_flow_id);
    }
}
```

---

## .env examples

``` 
FLOWISE_RUNNER_URL=http://flowise-runner:3001
FLOWISE_LOCAL=false
FLOWISE_REST_BASE=http://flowise:3000
```

---

## Notes & next steps
- **Flowise package name**: kiểm tra repo Flowise để biết tên package core (nếu có) và API methods (`runFlow`, `duplicateFlow`, `loadFlow`). Nếu không tồn tại, runner sẽ fallback sang REST API.  
- **Authentication**: bảo vệ endpoint runner (`/run-flow`) bằng HMAC / API keys giữa Laravel và node-runner.  
- **Security**: validate inputs, giới hạn upload size, run-timeouts cho flow execution.  
- **Usage accounting**: tính token usage từ Flowise/OpenAI response để trừ credit chính xác thay vì flat deduction.  
- **Scaling**: chạy nhiều runner replicas; dùng job queue để xử lý các request nặng.  

---

## Want me to generate:
- Docker Compose ready repo (with Laravel app skeleton + node-runner)?
- Full CI / GitHub Actions for deploy?
- Or a runnable tarball with these files?

