@extends('admin.layouts.app')

@section('title', 'Quản lý Files')

@section('page-actions')
<div class="btn-toolbar mb-2 mb-md-0">
    <div class="btn-group me-2">
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="refreshTable()">
            <i class="fas fa-sync-alt"></i> Làm mới
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="bulkDelete()" id="bulkDeleteBtn" style="display: none;">
            <i class="fas fa-trash"></i> Xóa đã chọn
        </button>
    </div>
</div>
@endsection

@section('content')
<div class="card shadow mb-4">
    <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Danh sách Files từ người dùng</h6>
    </div>
    <div class="card-body">
        <!-- Search and Filter -->
        <div class="row mb-3">
            <div class="col-md-4">
                <div class="input-group">
                    <input type="text" class="form-control" id="searchInput" placeholder="Tìm kiếm theo tên file...">
                    <button class="btn btn-outline-secondary" type="button" onclick="searchFiles()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="userFilter" onchange="filterFiles()">
                    <option value="">Tất cả users</option>
                    @foreach($users as $user)
                        <option value="{{ $user->id }}" {{ request('user_id') == $user->id ? 'selected' : '' }}>
                            {{ $user->name }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="typeFilter" onchange="filterFiles()">
                    <option value="">Tất cả loại</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC</option>
                    <option value="docx">DOCX</option>
                    <option value="txt">TXT</option>
                    <option value="image">Hình ảnh</option>
                    <option value="other">Khác</option>
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="sizeFilter" onchange="filterFiles()">
                    <option value="">Tất cả kích thước</option>
                    <option value="small">< 1MB</option>
                    <option value="medium">1MB - 10MB</option>
                    <option value="large">10MB - 50MB</option>
                    <option value="xlarge">> 50MB</option>
                </select>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="sortBy" onchange="sortFiles()">
                    <option value="created_at">Mới nhất</option>
                    <option value="name">Tên A-Z</option>
                    <option value="size">Kích thước</option>
                    <option value="user">Người dùng</option>
                </select>
            </div>
        </div>
        
        <!-- Statistics -->
        <div class="row mb-3">
            <div class="col-md-3">
                <div class="card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Tổng Files</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ number_format($totalFiles) }}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-file-alt fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-left-success shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Tổng dung lượng</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ number_format($totalSize / (1024*1024*1024), 2) }} GB</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-hdd fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-left-info shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">Files hôm nay</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ number_format($todayFiles) }}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-calendar-day fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-left-warning shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">Files lớn (>10MB)</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">{{ number_format($largeFiles) }}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Files Table -->
        <div class="table-responsive">
            <table class="table table-bordered" id="filesTable">
                <thead>
                    <tr>
                        <th width="30">
                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                        </th>
                        <th>Tên File</th>
                        <th>Người dùng</th>
                        <th>Loại</th>
                        <th>Kích thước</th>
                        <th>Ngày tạo</th>
                        <th>Lần tải cuối</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($files as $file)
                    <tr>
                        <td>
                            <input type="checkbox" class="file-checkbox" value="{{ $file->id }}" onchange="updateBulkActions()">
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <i class="fas fa-{{ $file->getFileIcon() }} me-2 text-{{ $file->getFileColor() }}"></i>
                                <div>
                                    <strong>{{ Str::limit($file->original_name, 40) }}</strong>
                                    @if($file->file_size > 10 * 1024 * 1024)
                                        <span class="badge bg-warning text-dark ms-1">Lớn</span>
                                    @endif
                                    <br>
                                    <small class="text-muted">{{ $file->file_name }}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="avatar-sm me-2">
                                    <div class="avatar-initial bg-primary rounded-circle">
                                        {{ strtoupper(substr($file->user->name, 0, 1)) }}
                                    </div>
                                </div>
                                <div>
                                    <strong>{{ $file->user->name }}</strong>
                                    <br>
                                    <small class="text-muted">{{ $file->user->email }}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-{{ $file->getFileColor() }}">
                                {{ strtoupper($file->file_type) }}
                            </span>
                        </td>
                        <td>
                            <strong>{{ $file->getFormattedSize() }}</strong>
                            <br>
                            <small class="text-muted">{{ number_format($file->size) }} bytes</small>
                        </td>
                        <td>
                            <strong>{{ $file->created_at->format('d/m/Y') }}</strong>
                            <br>
                            <small class="text-muted">{{ $file->created_at->format('H:i') }}</small>
                        </td>
                        <td>
                            @if($file->last_downloaded_at)
                                <strong>{{ $file->last_downloaded_at->format('d/m/Y') }}</strong>
                                <br>
                                <small class="text-muted">{{ $file->last_downloaded_at->diffForHumans() }}</small>
                            @else
                                <span class="text-muted">Chưa tải</span>
                            @endif
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-info" 
                                        onclick="viewFile({{ $file->id }})" title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <a href="{{ route('admin.files.download', $file) }}" class="btn btn-sm btn-success" title="Tải xuống">
                                    <i class="fas fa-download"></i>
                                </a>
                                @if($file->isImage())
                                    <button type="button" class="btn btn-sm btn-primary" 
                                            onclick="previewImage('{{ $file->getUrl() }}', '{{ $file->original_name }}')" 
                                            title="Xem trước">
                                        <i class="fas fa-image"></i>
                                    </button>
                                @endif
                                <button type="button" class="btn btn-sm btn-danger" 
                                        onclick="confirmDeleteFile({{ $file->id }}, '{{ $file->original_name }}')" 
                                        title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                            <p class="text-muted mb-0">Chưa có file nào</p>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        @if($files->hasPages())
        <div class="d-flex justify-content-center">
            {{ $files->appends(request()->query())->links() }}
        </div>
        @endif
    </div>
</div>

<!-- File Details Modal -->
<div class="modal fade" id="fileDetailsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Chi tiết File</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="fileDetails">
                <!-- File details will be loaded here -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
        </div>
    </div>
</div>

<!-- Image Preview Modal -->
<div class="modal fade" id="imagePreviewModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="imagePreviewTitle">Xem trước hình ảnh</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
                <img id="previewImage" src="" alt="Preview" class="img-fluid" style="max-height: 70vh;">
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
function viewFile(id) {
    fetch(`/admin/files/${id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('fileDetails').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Thông tin File</h6>
                        <table class="table table-borderless">
                            <tr><td><strong>ID:</strong></td><td>${data.id}</td></tr>
                            <tr><td><strong>Tên gốc:</strong></td><td>${data.original_name}</td></tr>
                            <tr><td><strong>Tên file:</strong></td><td><code>${data.file_name}</code></td></tr>
                            <tr><td><strong>Loại:</strong></td><td><span class="badge bg-info">${data.file_type.toUpperCase()}</span></td></tr>
                            <tr><td><strong>MIME Type:</strong></td><td><code>${data.mime_type}</code></td></tr>
                            <tr><td><strong>Kích thước:</strong></td><td><strong>${formatFileSize(data.file_size)}</strong></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Thông tin Người dùng</h6>
                        <table class="table table-borderless">
                            <tr><td><strong>Người tạo:</strong></td><td>${data.user.name}</td></tr>
                            <tr><td><strong>Email:</strong></td><td>${data.user.email}</td></tr>
                            <tr><td><strong>Role:</strong></td><td><span class="badge bg-primary">${data.user.role}</span></td></tr>
                            <tr><td><strong>Ngày tạo:</strong></td><td>${new Date(data.created_at).toLocaleString('vi-VN')}</td></tr>
                            <tr><td><strong>Cập nhật:</strong></td><td>${new Date(data.updated_at).toLocaleString('vi-VN')}</td></tr>
                            <tr><td><strong>Lần tải cuối:</strong></td><td>${data.last_downloaded_at ? new Date(data.last_downloaded_at).toLocaleString('vi-VN') : 'Chưa tải'}</td></tr>
                        </table>
                    </div>
                </div>
                <div class="mt-3">
                    <h6>Đường dẫn</h6>
                    <div class="alert alert-info">
                        <code>${data.file_path}</code>
                    </div>
                </div>
            `;
            new bootstrap.Modal(document.getElementById('fileDetailsModal')).show();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi tải thông tin file!');
        });
}

function previewImage(url, name) {
    document.getElementById('imagePreviewTitle').textContent = name;
    document.getElementById('previewImage').src = url;
    new bootstrap.Modal(document.getElementById('imagePreviewModal')).show();
}

function confirmDeleteFile(id, name) {
    if (confirm(`Bạn có chắc chắn muốn xóa file "${name}"?\n\nLưu ý: Hành động này không thể hoàn tác!`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/files/${id}`;
        form.innerHTML = `
            @csrf
            @method('DELETE')
        `;
        document.body.appendChild(form);
        form.submit();
    }
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.file-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
    
    updateBulkActions();
}

function updateBulkActions() {
    const checkedBoxes = document.querySelectorAll('.file-checkbox:checked');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    
    if (checkedBoxes.length > 0) {
        bulkDeleteBtn.style.display = 'inline-block';
        bulkDeleteBtn.textContent = `Xóa ${checkedBoxes.length} file`;
    } else {
        bulkDeleteBtn.style.display = 'none';
    }
}

function bulkDelete() {
    const checkedBoxes = document.querySelectorAll('.file-checkbox:checked');
    const fileIds = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (fileIds.length === 0) {
        alert('Vui lòng chọn ít nhất một file để xóa!');
        return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa ${fileIds.length} file đã chọn?\n\nLưu ý: Hành động này không thể hoàn tác!`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/admin/files/bulk-delete';
        form.innerHTML = `
            @csrf
            <input type="hidden" name="file_ids" value="${fileIds.join(',')}">
        `;
        document.body.appendChild(form);
        form.submit();
    }
}

function searchFiles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#filesTable tbody tr');
    
    rows.forEach(row => {
        const fileName = row.cells[1].textContent.toLowerCase();
        const userName = row.cells[2].textContent.toLowerCase();
        
        if (fileName.includes(searchTerm) || userName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterFiles() {
    const userFilter = document.getElementById('userFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const sizeFilter = document.getElementById('sizeFilter').value;
    
    // Implement filtering logic here
    // For now, just reload with filters
    const params = new URLSearchParams();
    if (userFilter) params.append('user_id', userFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (sizeFilter) params.append('size', sizeFilter);
    
    window.location.href = window.location.pathname + '?' + params.toString();
}

function sortFiles() {
    const sortBy = document.getElementById('sortBy').value;
    const params = new URLSearchParams(window.location.search);
    params.set('sort', sortBy);
    window.location.href = window.location.pathname + '?' + params.toString();
}

function refreshTable() {
    location.reload();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
</script>

<style>
.avatar-sm {
    width: 32px;
    height: 32px;
}
.avatar-initial {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
}
.border-left-primary {
    border-left: 0.25rem solid #4e73df !important;
}
.border-left-success {
    border-left: 0.25rem solid #1cc88a !important;
}
.border-left-info {
    border-left: 0.25rem solid #36b9cc !important;
}
.border-left-warning {
    border-left: 0.25rem solid #f6c23e !important;
}
</style>
@endsection