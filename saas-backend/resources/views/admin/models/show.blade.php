@extends('admin.layouts.app')

@section('title', 'AI Model Details')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">AI Model Details</h3>
                    <div class="card-tools">
                        <a href="{{ route('admin.models.edit', $model) }}" class="btn btn-warning me-2">
                            <i class="fas fa-edit"></i> Edit
                        </a>
                        <a href="{{ route('admin.models.index') }}" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to Models
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            @if($model->thumbnail)
                                <div class="text-center mb-4">
                                    <img src="{{ Storage::disk('s3')->url($model->thumbnail) }}" 
                                         alt="{{ $model->name }}" 
                                         class="img-fluid rounded shadow" 
                                         style="max-width: 100%; max-height: 300px; object-fit: cover;">
                                </div>
                            @else
                                <div class="text-center mb-4">
                                    <div class="bg-light d-flex align-items-center justify-content-center rounded" 
                                         style="height: 200px;">
                                        <i class="fas fa-robot fa-4x text-muted"></i>
                                    </div>
                                    <p class="text-muted mt-2">No thumbnail available</p>
                                </div>
                            @endif
                        </div>
                        
                        <div class="col-md-8">
                            <div class="row">
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Name:</label>
                                        <p class="mb-0">{{ $model->name }}</p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Slug:</label>
                                        <p class="mb-0">
                                            <code>{{ $model->slug }}</code>
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Platform:</label>
                                        <p class="mb-0">
                                            <span class="badge bg-primary">{{ $model->platform }}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Type:</label>
                                        <p class="mb-0">
                                            <span class="badge bg-info">{{ $model->type }}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Credit Price:</label>
                                        <p class="mb-0">
                                            <span class="badge bg-success fs-6">${{ number_format($model->credit_price, 2) }}</span>
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Created:</label>
                                        <p class="mb-0">{{ $model->created_at->format('M d, Y \a\t g:i A') }}</p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Last Updated:</label>
                                        <p class="mb-0">{{ $model->updated_at->format('M d, Y \a\t g:i A') }}</p>
                                    </div>
                                </div>
                                
                                <div class="col-sm-6">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">ID:</label>
                                        <p class="mb-0">
                                            <code>#{{ $model->id }}</code>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    @if($model->short_description)
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card bg-light">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">
                                            <i class="fas fa-info-circle"></i> Description
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <p class="mb-0">{{ $model->short_description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif
                    
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="d-flex justify-content-end">
                                <form action="{{ route('admin.models.destroy', $model) }}" 
                                      method="POST" 
                                      class="d-inline"
                                      onsubmit="return confirm('Are you sure you want to delete this model? This action cannot be undone.')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-danger me-2">
                                        <i class="fas fa-trash"></i> Delete Model
                                    </button>
                                </form>
                                
                                <a href="{{ route('admin.models.edit', $model) }}" class="btn btn-warning">
                                    <i class="fas fa-edit"></i> Edit Model
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection