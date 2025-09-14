@extends('admin.layouts.app')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-microphone me-2"></i>Chi tiết Voice: {{ $voice->name }}</h2>
                <div>
                    <a href="{{ route('admin.voices.edit', $voice) }}" class="btn btn-warning me-2">
                        <i class="fas fa-edit me-2"></i>Chỉnh sửa
                    </a>
                    <a href="{{ route('admin.voices.index') }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left me-2"></i>Quay lại
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-10">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Thông tin Voice</h5>
                </div>

                <div class="card-body">
                    @if (session('success'))
                        <div class="alert alert-success alert-dismissible fade show" role="alert">
                            {{ session('success') }}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    @endif

                    <div class="row">
                        <!-- Basic Information -->
                        <div class="col-md-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="fas fa-info-circle"></i> Basic Information</h5>
                                </div>
                                <div class="card-body">
                                    <table class="table table-borderless">
                                        <tr>
                                            <td class="fw-bold" width="30%">ID:</td>
                                            <td>{{ $voice->id }}</td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Name:</td>
                                            <td>{{ $voice->name }}</td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Voice ID:</td>
                                            <td><code>{{ $voice->voice_id }}</code></td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Language:</td>
                                            <td>
                                                <span class="badge bg-info">{{ strtoupper($voice->language) }}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Category:</td>
                                            <td>
                                                <span class="badge bg-secondary">{{ ucfirst($voice->category) }}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Platform:</td>
                                            <td>
                                                <span class="badge bg-success">{{ $voice->platforms }}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Status:</td>
                                            <td>
                                                @if($voice->status)
                                                    <span class="badge bg-success">Active</span>
                                                @else
                                                    <span class="badge bg-danger">Inactive</span>
                                                @endif
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">User:</td>
                                            <td>{{ $voice->user->name ?? 'N/A' }}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Voice Characteristics -->
                        <div class="col-md-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0"><i class="fas fa-user"></i> Voice Characteristics</h5>
                                </div>
                                <div class="card-body">
                                    <table class="table table-borderless">
                                        <tr>
                                            <td class="fw-bold" width="30%">Gender:</td>
                                            <td>
                                                @if($voice->gender)
                                                    <span class="badge bg-{{ $voice->gender == 'male' ? 'primary' : ($voice->gender == 'female' ? 'danger' : 'warning') }}">
                                                        {{ ucfirst($voice->gender) }}
                                                    </span>
                                                @else
                                                    <span class="text-muted">Not specified</span>
                                                @endif
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Age:</td>
                                            <td>
                                                @if($voice->age)
                                                    <span class="badge bg-light text-dark">{{ ucfirst(str_replace('_', ' ', $voice->age)) }}</span>
                                                @else
                                                    <span class="text-muted">Not specified</span>
                                                @endif
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Created:</td>
                                            <td>{{ $voice->created_at->format('M d, Y H:i') }}</td>
                                        </tr>
                                        <tr>
                                            <td class="fw-bold">Updated:</td>
                                            <td>{{ $voice->updated_at->format('M d, Y H:i') }}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preview Audio -->
                    @if($voice->preview_url)
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-volume-up"></i> Voice Preview</h5>
                            </div>
                            <div class="card-body text-center">
                                <audio controls style="width: 100%; max-width: 500px;">
                                    <source src="{{ $voice->preview_url }}" type="audio/mpeg">
                                    Your browser does not support the audio element.
                                </audio>
                                <div class="mt-2">
                                    <small class="text-muted">Preview URL: 
                                        <a href="{{ $voice->preview_url }}" target="_blank" class="text-decoration-none">
                                            {{ $voice->preview_url }}
                                        </a>
                                    </small>
                                </div>
                            </div>
                        </div>
                    @endif

                    <!-- Description -->
                    @if($voice->description)
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-align-left"></i> Description</h5>
                            </div>
                            <div class="card-body">
                                <p class="mb-0">{{ $voice->description }}</p>
                            </div>
                        </div>
                    @endif

                    <!-- Fine Data -->
                    @if($voice->fine_data)
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-code"></i> Fine Data (JSON)</h5>
                            </div>
                            <div class="card-body">
                                <pre class="bg-light p-3 rounded"><code>{{ is_array($voice->fine_data) ? json_encode($voice->fine_data, JSON_PRETTY_PRINT) : $voice->fine_data }}</code></pre>
                            </div>
                        </div>
                    @endif

                    <!-- Actions -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="fas fa-cogs"></i> Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-flex gap-2 flex-wrap">
                                <a href="{{ route('admin.voices.edit', $voice) }}" class="btn btn-warning">
                                    <i class="fas fa-edit"></i> Edit Voice
                                </a>
                                
                                @if($voice->preview_url)
                                    <a href="{{ $voice->preview_url }}" target="_blank" class="btn btn-info">
                                        <i class="fas fa-external-link-alt"></i> Open Preview
                                    </a>
                                @endif
                                
                                <button type="button" class="btn btn-secondary" onclick="copyToClipboard('{{ $voice->voice_id }}')">
                                    <i class="fas fa-copy"></i> Copy Voice ID
                                </button>
                                
                                <form action="{{ route('admin.voices.destroy', $voice) }}" method="POST" class="d-inline" 
                                      onsubmit="return confirm('Are you sure you want to delete this voice? This action cannot be undone.')">'
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-danger">
                                        <i class="fas fa-trash"></i> Delete Voice
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
@endpush

@push('scripts')
<script>
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    Voice ID copied to clipboard!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', function() {
            document.body.removeChild(toast);
        });
    }, function(err) {
        console.error('Could not copy text: ', err);
        alert('Failed to copy to clipboard');
    });
}
</script>
@endpush