@extends('admin.layouts.app')

@section('title', 'OpenAI Template Details')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-10">
        <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4>OpenAI Template: {{ $openai->title }}</h4>
                    <div>
                        <a href="{{ route('admin.openai.edit', $openai) }}" class="btn btn-primary me-2">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        <a href="{{ route('admin.openai.index') }}" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to List
                        </a>
                    </div>
                </div>

                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="mb-4">
                                <h5 class="text-primary">Basic Information</h5>
                                <hr>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-3"><strong>ID:</strong></div>
                                    <div class="col-sm-9">{{ $openai->id }}</div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-3"><strong>Title:</strong></div>
                                    <div class="col-sm-9">{{ $openai->title }}</div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-3"><strong>Slug:</strong></div>
                                    <div class="col-sm-9">
                                        @if($openai->slug)
                                            <code>{{ $openai->slug }}</code>
                                        @else
                                            <span class="text-muted">Not set</span>
                                        @endif
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-3"><strong>Type:</strong></div>
                                    <div class="col-sm-9">
                                        <span class="badge bg-info">{{ ucfirst($openai->type) }}</span>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-sm-3"><strong>Description:</strong></div>
                                    <div class="col-sm-9">{{ $openai->description }}</div>
                                </div>
                            </div>

                            @if($openai->prompt)
                            <div class="mb-4">
                                <h5 class="text-primary">Prompt</h5>
                                <hr>
                                <div class="bg-light p-3 rounded">
                                    <pre class="mb-0">{{ $openai->prompt }}</pre>
                                </div>
                            </div>
                            @endif

                            @if($openai->questions && (is_array($openai->questions) ? count($openai->questions) > 0 : !empty($openai->questions)))
                            <div class="mb-4">
                                <h5 class="text-primary">Questions</h5>
                                <hr>
                                @if(is_array($openai->questions))
                                    <div class="list-group">
                                        @foreach($openai->questions as $index => $question)
                                            <div class="list-group-item">
                                                <strong>{{ $index + 1 }}.</strong> 
                                                @if(is_array($question))
                                                    {{ $question['question'] ?? 'No question text' }}
                                                    @if(isset($question['type']))
                                                        <span class="badge bg-secondary ms-2">{{ $question['type'] }}</span>
                                                    @endif
                                                @else
                                                    {{ $question }}
                                                @endif
                                            </div>
                                        @endforeach
                                    </div>
                                @else
                                    <div class="bg-light p-3 rounded">
                                        <pre class="mb-0">{{ $openai->questions }}</pre>
                                    </div>
                                @endif
                            </div>
                            @endif
                        </div>

                        <div class="col-md-4">
                            <div class="mb-4">
                                <h5 class="text-primary">Status & Settings</h5>
                                <hr>
                                
                                <div class="mb-3">
                                    <strong>Status:</strong><br>
                                    @if($openai->active)
                                        <span class="badge bg-success">Active</span>
                                    @else
                                        <span class="badge bg-secondary">Inactive</span>
                                    @endif
                                </div>
                                
                                <div class="mb-3">
                                    <strong>Premium:</strong><br>
                                    @if($openai->premium)
                                        <span class="badge bg-warning">Premium</span>
                                    @else
                                        <span class="badge bg-light text-dark">Free</span>
                                    @endif
                                </div>
                                
                                <div class="mb-3">
                                    <strong>Custom Template:</strong><br>
                                    @if($openai->custom_template)
                                        <span class="badge bg-info">Yes</span>
                                    @else
                                        <span class="badge bg-light text-dark">No</span>
                                    @endif
                                </div>
                                
                                <div class="mb-3">
                                    <strong>Tone of Voice:</strong><br>
                                    @if($openai->tone_of_voice)
                                        <span class="badge bg-info">Enabled</span>
                                    @else
                                        <span class="badge bg-light text-dark">Disabled</span>
                                    @endif
                                </div>
                                
                                @if($openai->color)
                                <div class="mb-3">
                                    <strong>Color:</strong><br>
                                    <div class="d-flex align-items-center">
                                        <div class="color-preview me-2" style="width: 20px; height: 20px; background-color: {{ $openai->color }}; border: 1px solid #ddd; border-radius: 3px;"></div>
                                        <code>{{ $openai->color }}</code>
                                    </div>
                                </div>
                                @endif
                            </div>

                            @if($openai->image)
                            <div class="mb-4">
                                <h5 class="text-primary">Image</h5>
                                <hr>
                                <img src="{{ $openai->image }}" alt="{{ $openai->title }}" class="img-fluid rounded" style="max-height: 200px;">
                            </div>
                            @endif

                            @if($openai->filters && (is_array($openai->filters) ? count($openai->filters) > 0 : !empty($openai->filters)))
                            <div class="mb-4">
                                <h5 class="text-primary">Filters</h5>
                                <hr>
                                @if(is_array($openai->filters))
                                    @foreach($openai->filters as $filter)
                                        <span class="badge bg-outline-primary me-1 mb-1">{{ $filter }}</span>
                                    @endforeach
                                @else
                                    <span class="badge bg-outline-primary">{{ $openai->filters }}</span>
                                @endif
                            </div>
                            @endif

                            @if($openai->package && (is_array($openai->package) ? count($openai->package) > 0 : !empty($openai->package)))
                            <div class="mb-4">
                                <h5 class="text-primary">Package</h5>
                                <hr>
                                @if(is_array($openai->package))
                                    @foreach($openai->package as $pkg)
                                        <span class="badge bg-outline-success me-1 mb-1">{{ $pkg }}</span>
                                    @endforeach
                                @else
                                    <span class="badge bg-outline-success">{{ $openai->package }}</span>
                                @endif
                            </div>
                            @endif

                            <div class="mb-4">
                                <h5 class="text-primary">Timestamps</h5>
                                <hr>
                                <div class="mb-2">
                                    <strong>Created:</strong><br>
                                    <small class="text-muted">{{ $openai->created_at->format('M d, Y \\a\\t g:i A') }}</small>
                                </div>
                                <div class="mb-2">
                                    <strong>Updated:</strong><br>
                                    <small class="text-muted">{{ $openai->updated_at->format('M d, Y \\a\\t g:i A') }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="d-flex justify-content-between">
                                <div>
                                    <a href="{{ route('openai.edit', $openai) }}" class="btn btn-primary">
                                        <i class="fas fa-edit"></i> Edit Template
                                    </a>
                                </div>
                                <div>
                                    <form action="{{ route('admin.openai.destroy', $openai) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this template? This action cannot be undone.')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-danger">
                                            <i class="fas fa-trash"></i> Delete Template
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('styles')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<style>
.bg-outline-primary {
    color: #0d6efd;
    border: 1px solid #0d6efd;
    background-color: transparent;
}
.bg-outline-success {
    color: #198754;
    border: 1px solid #198754;
    background-color: transparent;
}
</style>
@endpush