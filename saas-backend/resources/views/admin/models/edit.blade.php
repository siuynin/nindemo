@extends('admin.layouts.app')

@section('title', 'Edit AI Model')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Edit AI Model: {{ $model->name }}</h3>
                    <div class="card-tools">
                        <a href="{{ route('admin.models.index') }}" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to Models
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    <form action="{{ route('admin.models.update', $model) }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Name <span class="text-danger">*</span></label>
                                    <input type="text" 
                                           class="form-control @error('name') is-invalid @enderror" 
                                           id="name" 
                                           name="name" 
                                           value="{{ old('name', $model->name) }}" 
                                           required>
                                    @error('name')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="slug" class="form-label">Slug <span class="text-danger">*</span></label>
                                    <input type="text" 
                                           class="form-control @error('slug') is-invalid @enderror" 
                                           id="slug" 
                                           name="slug" 
                                           value="{{ old('slug', $model->slug) }}" 
                                           placeholder="Enter unique slug"
                                           required>
                                    @error('slug')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Slug must be unique and URL-friendly (e.g., gpt-4, claude-3)</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="platform" class="form-label">Platform <span class="text-danger">*</span></label>
                                    <select class="form-select @error('platform') is-invalid @enderror" 
                                            id="platform" 
                                            name="platform" 
                                            required>
                                        <option value="">Select Platform</option>
                                        <option value="OpenAI" {{ old('platform', $model->platform) == 'OpenAI' ? 'selected' : '' }}>OpenAI</option>
                                        <option value="Google" {{ old('platform', $model->platform) == 'Google' ? 'selected' : '' }}>Google</option>
                                        <option value="Anthropic" {{ old('platform', $model->platform) == 'Anthropic' ? 'selected' : '' }}>Anthropic</option>
                                        <option value="Runware" {{ old('platform', $model->platform) == 'Runware' ? 'selected' : '' }}>Runware</option>
                                        <option value="NDhubs" {{ old('platform', $model->platform) == 'NDhubs' ? 'selected' : '' }}>NDhubs</option>
                                        <option value="Other" {{ old('platform', $model->platform) == 'Other' ? 'selected' : '' }}>Other</option>
                                    </select>
                                    @error('platform')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="type" class="form-label">Type <span class="text-danger">*</span></label>
                                    <select class="form-select @error('type') is-invalid @enderror" 
                                            id="type" 
                                            name="type" 
                                            required>
                                        <option value="">Select Type</option>
                                        <option value="text" {{ old('type', $model->type) == 'text' ? 'selected' : '' }}>Text Generation</option>
                                        <option value="image" {{ old('type', $model->type) == 'image' ? 'selected' : '' }}>Image Generation</option>
                                        <option value="video" {{ old('type', $model->type) == 'video' ? 'selected' : '' }}>Video Generation</option>
                                        <option value="audio" {{ old('type', $model->type) == 'audio' ? 'selected' : '' }}>Audio Generation</option>
                                        <option value="code" {{ old('type', $model->type) == 'code' ? 'selected' : '' }}>Code Generation</option>
                                        <option value="translation" {{ old('type', $model->type) == 'translation' ? 'selected' : '' }}>Translation</option>
                                        <option value="analysis" {{ old('type', $model->type) == 'analysis' ? 'selected' : '' }}>Analysis</option>
                                        <option value="other" {{ old('type', $model->type) == 'other' ? 'selected' : '' }}>Other</option>
                                    </select>
                                    @error('type')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="credit_price" class="form-label">Credit Price <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" 
                                               class="form-control @error('credit_price') is-invalid @enderror" 
                                               id="credit_price" 
                                               name="credit_price" 
                                               value="{{ old('credit_price', $model->credit_price) }}" 
                                               step="0.01" 
                                               min="0" 
                                               required>
                                    </div>
                                    @error('credit_price')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="thumbnail" class="form-label">Thumbnail</label>
                                    @if($model->thumbnail)
                                        <div class="mb-2">
                                            <img src="{{ Storage::url($model->thumbnail) }}" 
                                                 alt="Current thumbnail" 
                                                 class="img-thumbnail" 
                                                 style="max-width: 150px; max-height: 150px;">
                                            <div class="form-text">Current thumbnail</div>
                                        </div>
                                    @endif
                                    <input type="file" 
                                           class="form-control @error('thumbnail') is-invalid @enderror" 
                                           id="thumbnail" 
                                           name="thumbnail" 
                                           accept="image/*">
                                    <div class="form-text">Upload a new image to replace current thumbnail (JPEG, PNG, JPG, GIF). Max size: 2MB</div>
                                    @error('thumbnail')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="short_description" class="form-label">Short Description</label>
                            <textarea class="form-control @error('short_description') is-invalid @enderror" 
                                      id="short_description" 
                                      name="short_description" 
                                      rows="3" 
                                      maxlength="1000">{{ old('short_description', $model->short_description) }}</textarea>
                            <div class="form-text">Maximum 1000 characters</div>
                            @error('short_description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>
                        
                        <div class="d-flex justify-content-end">
                            <a href="{{ route('admin.models.index') }}" class="btn btn-secondary me-2">Cancel</a>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Update Model
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>


@endsection