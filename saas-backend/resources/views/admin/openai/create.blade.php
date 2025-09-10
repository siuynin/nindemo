@extends('admin.layouts.app')

@section('title', 'Create OpenAI Template')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-8">
        <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4>Create New OpenAI Template</h4>
                    <a href="{{ route('admin.openai.index') }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back to List
                    </a>
                </div>

                <div class="card-body">
                    <form action="{{ route('admin.openai.store') }}" method="POST">
                        @csrf

                        <div class="row">
                            <div class="col-md-8">
                                <div class="mb-3">
                                    <label for="title" class="form-label">Title <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control @error('title') is-invalid @enderror" 
                                           id="title" name="title" value="{{ old('title') }}" required>
                                    @error('title')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="type" class="form-label">Type <span class="text-danger">*</span></label>
                                    <select class="form-select @error('type') is-invalid @enderror" id="type" name="type" required>
                                        <option value="">Select Type</option>
                                        <option value="text" {{ old('type') == 'text' ? 'selected' : '' }}>Text</option>
                                        <option value="image" {{ old('type') == 'image' ? 'selected' : '' }}>Image</option>
                                        <option value="code" {{ old('type') == 'code' ? 'selected' : '' }}>Code</option>
                                        <option value="chat" {{ old('type') == 'chat' ? 'selected' : '' }}>Chat</option>
                                    </select>
                                    @error('type')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="description" class="form-label">Description <span class="text-danger">*</span></label>
                            <textarea class="form-control @error('description') is-invalid @enderror" 
                                      id="description" name="description" rows="3" required>{{ old('description') }}</textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="slug" class="form-label">Slug</label>
                                    <input type="text" class="form-control @error('slug') is-invalid @enderror" 
                                           id="slug" name="slug" value="{{ old('slug') }}">
                                    <div class="form-text">Leave empty to auto-generate from title</div>
                                    @error('slug')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="color" class="form-label">Color</label>
                                    <input type="color" class="form-control form-control-color @error('color') is-invalid @enderror" 
                                           id="color" name="color" value="{{ old('color', '#007bff') }}">
                                    @error('color')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="prompt" class="form-label">Prompt</label>
                            <textarea class="form-control @error('prompt') is-invalid @enderror" 
                                      id="prompt" name="prompt" rows="4">{{ old('prompt') }}</textarea>
                            @error('prompt')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="mb-3">
                            <label for="questions" class="form-label">Questions (JSON format)</label>
                            <textarea class="form-control @error('questions') is-invalid @enderror" 
                                      id="questions" name="questions" rows="3" placeholder='[{"question": "What is your goal?", "type": "text"}]'>{{ old('questions') }}</textarea>
                            @error('questions')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="filters" class="form-label">Filters (comma separated)</label>
                                    <input type="text" class="form-control @error('filters') is-invalid @enderror" 
                                           id="filters" name="filters" value="{{ old('filters') }}" placeholder="filter1, filter2, filter3">
                                    @error('filters')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="package" class="form-label">Package (comma separated)</label>
                                    <input type="text" class="form-control @error('package') is-invalid @enderror" 
                                           id="package" name="package" value="{{ old('package') }}" placeholder="basic, premium, enterprise">
                                    @error('package')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="image" class="form-label">Image URL</label>
                            <input type="url" class="form-control @error('image') is-invalid @enderror" 
                                   id="image" name="image" value="{{ old('image') }}">
                            @error('image')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="active" name="active" value="1" {{ old('active') ? 'checked' : '' }}>
                                    <label class="form-check-label" for="active">
                                        Active
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="premium" name="premium" value="1" {{ old('premium') ? 'checked' : '' }}>
                                    <label class="form-check-label" for="premium">
                                        Premium
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="custom_template" name="custom_template" value="1" {{ old('custom_template') ? 'checked' : '' }}>
                                    <label class="form-check-label" for="custom_template">
                                        Custom Template
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="checkbox" id="tone_of_voice" name="tone_of_voice" value="1" {{ old('tone_of_voice') ? 'checked' : '' }}>
                                    <label class="form-check-label" for="tone_of_voice">
                                        Tone of Voice
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                            <a href="{{ route('openai.index') }}" class="btn btn-secondary me-md-2">Cancel</a>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Create Template
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('styles')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
@endpush

@push('scripts')
<script>
// Auto-generate slug from title
document.getElementById('title').addEventListener('input', function() {
    const title = this.value;
    const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    document.getElementById('slug').value = slug;
});
</script>
@endpush