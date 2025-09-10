@extends('admin.layouts.app')

@section('title', 'OpenAI Templates')

@section('content')
<div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h4>OpenAI Templates</h4>
                    <a href="{{ route('admin.openai.create') }}" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Add New Template
                    </a>
                </div>

                <div class="card-body">
                    @if(session('success'))
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            {{ session('success') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    @endif

                    @if($openais->count() > 0)
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Premium</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($openais as $openai)
                                        <tr>
                                            <td>{{ $openai->id }}</td>
                                            <td>
                                                <strong>{{ $openai->title }}</strong>
                                                @if($openai->slug)
                                                    <br><small class="text-muted">{{ $openai->slug }}</small>
                                                @endif
                                            </td>
                                            <td>
                                                <span class="badge bg-info">{{ $openai->type }}</span>
                                            </td>
                                            <td>
                                                @if($openai->active)
                                                    <span class="badge bg-success">Active</span>
                                                @else
                                                    <span class="badge bg-secondary">Inactive</span>
                                                @endif
                                            </td>
                                            <td>
                                                @if($openai->premium)
                                                    <span class="badge bg-warning">Premium</span>
                                                @else
                                                    <span class="badge bg-light text-dark">Free</span>
                                                @endif
                                            </td>
                                            <td>{{ $openai->created_at->format('M d, Y') }}</td>
                                            <td>
                                                <div class="btn-group" role="group">
                                                    <a href="{{ route('admin.openai.show', $openai) }}" class="btn btn-sm btn-outline-info" title="View">
                                                        <i class="fas fa-eye"></i>
                                                    </a>
                                                    <a href="{{ route('admin.openai.edit', $openai) }}" class="btn btn-sm btn-outline-primary" title="Edit">
                                                        <i class="fas fa-edit"></i>
                                                    </a>
                                                    <form action="{{ route('admin.openai.destroy', $openai) }}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this template?')">
                                                        @csrf
                                                        @method('DELETE')
                                                        <button type="submit" class="btn btn-sm btn-outline-danger" title="Delete">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination -->
                        <div class="d-flex justify-content-center">
                            {{ $openais->links() }}
                        </div>
                    @else
                        <div class="text-center py-5">
                            <i class="fas fa-robot fa-3x text-muted mb-3"></i>
                            <h5 class="text-muted">No OpenAI templates found</h5>
                            <p class="text-muted">Create your first template to get started.</p>
                            <a href="{{ route('admin.openai.create') }}" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Create Template
                            </a>
                        </div>
                    @endif
                </div>
            </div>
@endsection

@push('styles')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
@endpush