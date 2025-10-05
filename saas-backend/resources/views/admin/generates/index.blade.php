@extends('admin.layouts.app')

@section('title', 'Quản lý Generates')

@section('page-actions')
<div class="btn-toolbar mb-2 mb-md-0">
    <div class="btn-group me-2">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#filterModal">
            <i class="fas fa-filter"></i> Lọc
        </button>
    </div>
</div>
@endsection

@section('content')
<div class="card shadow">
    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 class="m-0 font-weight-bold text-primary">Danh sách Generates</h6>
        <div class="d-flex">
            <form class="d-flex me-3" method="GET" action="{{ route('admin.generates.index') }}">
                <input class="form-control form-control-sm me-2" type="search" name="search" 
                       placeholder="Tìm kiếm..." value="{{ request('search') }}">
                <button class="btn btn-outline-success btn-sm" type="submit">
                    <i class="fas fa-search"></i>
                </button>
            </form>
        </div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Share</th>
                        <th>Credit Cost</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($generates as $generate)
                    <tr>
                        <td>{{ $generate->id }}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="ms-3">
                                    <div class="fw-bold">{{ $generate->user->name ?? 'N/A' }}</div>
                                    <div class="text-muted small">{{ $generate->user->email ?? 'N/A' }}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="fw-bold">{{ $generate->name }}</div>
                            @if($generate->task_id)
                                <div class="text-muted small">Task: {{ $generate->task_id }}</div>
                            @endif
                        </td>
                        <td>
                            <span class="badge bg-info">{{ $generate->type }}</span>
                        </td>
                        <td>
                            @php
                                $statusClass = match($generate->status) {
                                    'completed' => 'bg-success',
                                    'pending' => 'bg-warning',
                                    'failed' => 'bg-danger',
                                    default => 'bg-secondary'
                                };
                            @endphp
                            <span class="badge {{ $statusClass }}">{{ ucfirst($generate->status) }}</span>
                        </td>
                        <td>
                            @php
                                $shareClass = $generate->share === 'public' ? 'bg-success' : 'bg-secondary';
                            @endphp
                            <span class="badge {{ $shareClass }}">{{ ucfirst($generate->share) }}</span>
                        </td>
                        <td>
                            <span class="fw-bold text-primary">${{ number_format($generate->credit_cost, 2) }}</span>
                        </td>
                        <td>
                            <div class="small text-muted">
                                {{ $generate->created_at->format('d/m/Y H:i') }}
                            </div>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-outline-primary" 
                                        onclick="viewGenerate({{ $generate->id }})" 
                                        data-bs-toggle="modal" data-bs-target="#viewModal"
                                        title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-warning" 
                                        onclick="editGenerate({{ $generate->id }})" 
                                        title="Chỉnh sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-info" 
                                        onclick="duplicateGenerate({{ $generate->id }})" 
                                        title="Sao chép">
                                    <i class="fas fa-copy"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-danger" 
                                        onclick="deleteGenerate({{ $generate->id }})" 
                                        title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <div class="text-muted">
                                <i class="fas fa-inbox fa-3x mb-3"></i>
                                <p>Không có dữ liệu generates</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        @if($generates->hasPages())
        <div class="d-flex justify-content-center">
            {{ $generates->links() }}
        </div>
        @endif
    </div>
</div>

<!-- View Modal -->
<div class="modal fade" id="viewModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Chi tiết Generate</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="viewModalBody">
                <!-- Content will be loaded here -->
            </div>
        </div>
    </div>
</div>

<!-- Edit Modal -->
<div class="modal fade" id="editModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Chỉnh sửa Generate</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="editModalBody">
                <!-- Edit form will be loaded here -->
            </div>
        </div>
    </div>
</div>

<!-- Filter Modal -->
<div class="modal fade" id="filterModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Lọc Generates</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form method="GET" action="{{ route('admin.generates.index') }}">
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Type</label>
                        <select class="form-select" name="type">
                            <option value="">Tất cả</option>
                            <option value="text" {{ request('type') === 'text' ? 'selected' : '' }}>Text</option>
                            <option value="image" {{ request('type') === 'image' ? 'selected' : '' }}>Image</option>
                            <option value="audio" {{ request('type') === 'audio' ? 'selected' : '' }}>Audio</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" name="status">
                            <option value="">Tất cả</option>
                            <option value="pending" {{ request('status') === 'pending' ? 'selected' : '' }}>Pending</option>
                            <option value="completed" {{ request('status') === 'completed' ? 'selected' : '' }}>Completed</option>
                            <option value="failed" {{ request('status') === 'failed' ? 'selected' : '' }}>Failed</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">User ID</label>
                        <input type="number" class="form-control" name="user_id" value="{{ request('user_id') }}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    <button type="submit" class="btn btn-primary">Áp dụng</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // Fetch generates data
    function fetchGenerates(page = 1, search = '', filters = {}) {
        const params = new URLSearchParams({
            page: page,
            search: search,
            ...filters
        });
        
        fetch(`/admin/generates?${params}`, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            updateTable(data.data);
            updatePagination(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu');
        });
    }
    
    // Update table with data
    function updateTable(generates) {
        const tbody = document.querySelector('#generates-table tbody');
        tbody.innerHTML = '';
        
        generates.forEach(generate => {
            const row = `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${generate.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${generate.name || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${generate.user ? generate.user.name : 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${generate.type}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            generate.status === 'completed' ? 'bg-green-100 text-green-800' :
                            generate.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }">
                            ${generate.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(generate.created_at).toLocaleDateString('vi-VN')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="viewGenerate(${generate.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">Xem</button>
                        <button onclick="deleteGenerate(${generate.id})" class="text-red-600 hover:text-red-900">Xóa</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }
    
    // View generate details
    function viewGenerate(id) {
        fetch(`/admin/generates/${id}`)
            .then(response => response.json())
            .then(data => {
                const modalBody = document.getElementById('viewModalBody');
                modalBody.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Thông tin cơ bản</h6>
                            <p><strong>ID:</strong> ${data.id}</p>
                            <p><strong>Name:</strong> ${data.name}</p>
                            <p><strong>Type:</strong> ${data.type}</p>
                            <p><strong>Status:</strong> ${data.status}</p>
                            <p><strong>Share:</strong> ${data.share}</p>
                            <p><strong>Credit Cost:</strong> $${data.credit_cost}</p>
                            <p><strong>Task ID:</strong> ${data.task_id || 'N/A'}</p>
                            <p><strong>File Path:</strong> ${data.file_patch || 'N/A'}</p>
                        </div>
                        <div class="col-md-6">
                            <h6>User</h6>
                            <p><strong>Name:</strong> ${data.user?.name || 'N/A'}</p>
                            <p><strong>Email:</strong> ${data.user?.email || 'N/A'}</p>
                            <p><strong>Created:</strong> ${new Date(data.created_at).toLocaleString()}</p>
                            <p><strong>Updated:</strong> ${new Date(data.updated_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6>Content</h6>
                            <div class="border p-3 bg-light" style="max-height: 200px; overflow-y: auto;">
                                ${data.content || 'Không có nội dung'}
                            </div>
                        </div>
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Có lỗi xảy ra khi tải dữ liệu');
            });
    }
    
    // Delete generate
    function deleteGenerate(id) {
        if (confirm('Bạn có chắc chắn muốn xóa generate này?')) {
            fetch(`/admin/generates/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    location.reload(); // Reload page to update the list
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Có lỗi xảy ra khi xóa');
            });
        }
    }
    
    // Search functionality
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.querySelector('input[name="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const search = e.target.value;
                setTimeout(() => {
                    if (search === e.target.value) {
                        fetchGenerates(1, search);
                    }
                }, 300);
            });
        }
    });
    
    // Filter functionality
    function applyFilters() {
        const filters = {
            type: document.querySelector('select[name="type"]').value,
            status: document.querySelector('select[name="status"]').value,
            user_id: document.querySelector('input[name="user_id"]').value
        };
        
        const search = document.querySelector('input[name="search"]').value || '';
        fetchGenerates(1, search, filters);
        
        // Close modal
        const filterModal = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
        if (filterModal) {
            filterModal.hide();
        }
    }
</script>
@endpush