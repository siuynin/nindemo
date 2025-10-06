@extends('admin.layouts.app')

@section('title', 'AI Models Management')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title">AI Models</h3>
                    <a href="{{ route('admin.models.create') }}" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add New Model
                    </a>
                </div>
                <div class="card-body">
                    @if(session('success'))
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            {{ session('success') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    @endif

                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Thumbnail</th>
                                    <th>Name</th>
                                    <th>Platform</th>
                                    <th>Type</th>
                                    <th>Credit Price</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($models as $model)
                                    <tr>
                                        <td>{{ $model->id }}</td>
                                        <td>
                                            @if($model->thumbnail)
                                                <img src="{{ Storage::disk('s3')->url($model->thumbnail) }}" 
                                                     alt="{{ $model->name }}" 
                                                     class="img-thumbnail" 
                                                     style="width: 50px; height: 50px; object-fit: cover;">
                                            @else
                                                <div class="bg-light d-flex align-items-center justify-content-center" 
                                                     style="width: 50px; height: 50px;">
                                                    <i class="fas fa-image text-muted"></i>
                                                </div>
                                            @endif
                                        </td>
                                        <td>
                                            <strong>{{ $model->name }}</strong><br>
                                            <small class="text-muted">{{ $model->slug }}</small>
                                        </td>
                                        <td>{{ $model->platform }}</td>
                                        <td>{{ $model->type }}</td>
                                        <td>${{ number_format($model->credit_price, 2) }}</td>
                                        <td>{{ $model->created_at->format('M d, Y') }}</td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <a href="{{ route('admin.models.show', $model) }}" 
                                                   class="btn btn-sm btn-info">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="{{ route('admin.models.edit', $model) }}" 
                                                   class="btn btn-sm btn-warning">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                                <form action="{{ route('admin.models.destroy', $model) }}" 
                                                      method="POST" 
                                                      class="d-inline"
                                                      onsubmit="return confirm('Are you sure you want to delete this model?')">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn btn-sm btn-danger">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="8" class="text-center py-4">
                                            <i class="fas fa-robot fa-3x text-muted mb-3"></i>
                                            <p class="text-muted">No AI models found. <a href="{{ route('admin.models.create') }}">Create your first model</a>.</p>
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    @if($models->hasPages())
                        <div class="d-flex justify-content-center">
                            {{ $models->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection