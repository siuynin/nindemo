@extends('admin.layouts.app')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-microphone me-2"></i>Quản lý Voice</h2>
                <a href="{{ route('admin.voices.create') }}" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Thêm Voice mới
                </a>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Danh sách Voice</h5>
                </div>

                <div class="card-body">
                    @if (session('success'))
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            {{ session('success') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    @endif

                    <!-- Filters -->
                    <div class="row mb-3">
                        <div class="col-md-12">
                            <form method="GET" action="{{ route('admin.voices.index') }}" class="row g-3">
                                <div class="col-md-2">
                                    <input type="text" class="form-control" name="search" 
                                           placeholder="Search..." value="{{ request('search') }}">
                                </div>
                                <div class="col-md-2">
                                    <select class="form-select" name="language">
                                        <option value="">All Languages</option>
                                        <option value="en" {{ request('language') == 'en' ? 'selected' : '' }}>English</option>
                                        <option value="fr" {{ request('language') == 'fr' ? 'selected' : '' }}>French</option>
                                        <option value="es" {{ request('language') == 'es' ? 'selected' : '' }}>Spanish</option>
                                        <option value="de" {{ request('language') == 'de' ? 'selected' : '' }}>German</option>
                                        <option value="zh" {{ request('language') == 'zh' ? 'selected' : '' }}>Chinese</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <select class="form-select" name="category">
                                        <option value="">All Categories</option>
                                        <option value="premade" {{ request('category') == 'premade' ? 'selected' : '' }}>Premade</option>
                                        <option value="custom" {{ request('category') == 'custom' ? 'selected' : '' }}>Custom</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <select class="form-select" name="gender">
                                        <option value="">All Genders</option>
                                        <option value="male" {{ request('gender') == 'male' ? 'selected' : '' }}>Male</option>
                                        <option value="female" {{ request('gender') == 'female' ? 'selected' : '' }}>Female</option>
                                        <option value="other" {{ request('gender') == 'other' ? 'selected' : '' }}>Other</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <select class="form-select" name="status">
                                        <option value="">All Status</option>
                                        <option value="1" {{ request('status') == '1' ? 'selected' : '' }}>Active</option>
                                        <option value="0" {{ request('status') == '0' ? 'selected' : '' }}>Inactive</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <button type="submit" class="btn btn-outline-primary w-100">
                                        <i class="fas fa-search"></i> Filter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Voices Table -->
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Voice ID</th>
                                    <th>Language</th>
                                    <th>Category</th>
                                    <th>Gender</th>
                                    <th>Age</th>
                                    <th>Platform</th>
                                    <th>Status</th>
                                    <th>User</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($voices as $voice)
                                    <tr>
                                        <td>{{ $voice->id }}</td>
                                        <td>
                                            <strong>{{ $voice->name }}</strong>
                                            @if($voice->preview_url)
                                                <br><small>
                                                    <audio controls style="width: 150px; height: 30px;">
                                                        <source src="{{ $voice->preview_url }}" type="audio/mpeg">
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </small>
                                            @endif
                                        </td>
                                        <td><code>{{ $voice->voice_id }}</code></td>
                                        <td>
                                            <span class="badge bg-info">{{ strtoupper($voice->language) }}</span>
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">{{ ucfirst($voice->category) }}</span>
                                        </td>
                                        <td>
                                            @if($voice->gender)
                                                <span class="badge bg-{{ $voice->gender == 'male' ? 'primary' : ($voice->gender == 'female' ? 'danger' : 'warning') }}">
                                                    {{ ucfirst($voice->gender) }}
                                                </span>
                                            @else
                                                <span class="text-muted">-</span>
                                            @endif
                                        </td>
                                        <td>
                                            @if($voice->age)
                                                <span class="badge bg-light text-dark">{{ ucfirst(str_replace('_', ' ', $voice->age)) }}</span>
                                            @else
                                                <span class="text-muted">-</span>
                                            @endif
                                        </td>
                                        <td>
                                            <span class="badge bg-success">{{ $voice->platforms }}</span>
                                        </td>
                                        <td>
                                            @if($voice->status)
                                                <span class="badge bg-success">Active</span>
                                            @else
                                                <span class="badge bg-danger">Inactive</span>
                                            @endif
                                        </td>
                                        <td>
                                            <small>{{ $voice->user->name ?? 'N/A' }}</small>
                                        </td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <a href="{{ route('admin.voices.show', $voice) }}" 
                                                   class="btn btn-sm btn-outline-info" title="View">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="{{ route('admin.voices.edit', $voice) }}" 
                                                   class="btn btn-sm btn-outline-warning" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                                <form action="{{ route('admin.voices.destroy', $voice) }}" method="POST" 
                                                      class="d-inline" onsubmit="return confirm('Are you sure you want to delete this voice?')">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn btn-sm btn-outline-danger" title="Delete">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="11" class="text-center py-4">
                                            <div class="text-muted">
                                                <i class="fas fa-microphone-slash fa-3x mb-3"></i>
                                                <h5>No voices found</h5>
                                                <p>Start by <a href="{{ route('admin.voices.create') }}">adding a new voice</a></p>
                                            </div>
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="d-flex justify-content-center">
                        {{ $voices->appends(request()->query())->links() }}
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
@endpush