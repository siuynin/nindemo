@extends('admin.layouts.app')

@section('title', 'Chi tiết User: ' . $user->name)

@section('page-actions')
<div class="btn-toolbar mb-2 mb-md-0">
    <div class="btn-group me-2">
        <a href="{{ route('admin.users.index') }}" class="btn btn-sm btn-outline-secondary">
            <i class="fas fa-arrow-left"></i> Quay lại
        </a>
        <button type="button" class="btn btn-sm btn-warning" 
                onclick="editUser({{ $user->id }}, '{{ $user->role }}', '{{ $user->status }}')"
                title="Chỉnh sửa">
            <i class="fas fa-edit"></i> Chỉnh sửa
        </button>
        <a href="{{ route('admin.users.credits', $user) }}" class="btn btn-sm btn-success">
            <i class="fas fa-coins"></i> Quản lý Credits
        </a>
    </div>
</div>
@endsection

@section('content')
<div class="row">
    <!-- User Info -->
    <div class="col-lg-4">
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Thông tin cơ bản</h6>
            </div>
            <div class="card-body text-center">
                <div class="avatar mx-auto mb-3">
                    <div class="avatar-initial bg-primary rounded-circle">
                        {{ strtoupper(substr($user->name, 0, 2)) }}
                    </div>
                </div>
                <h5 class="card-title">{{ $user->name }}</h5>
                <p class="card-text text-muted">{{ $user->email }}</p>
                
                <div class="row text-center">
                    <div class="col-6">
                        <span class="badge bg-{{ $user->role === 'admin' ? 'danger' : 'primary' }} mb-2">
                            {{ ucfirst($user->role) }}
                        </span>
                    </div>
                    <div class="col-6">
                        <span class="badge bg-{{ $user->status === 'active' ? 'success' : 'secondary' }} mb-2">
                            {{ ucfirst($user->status) }}
                        </span>
                    </div>
                </div>
                
                @if($user->email_verified_at)
                    <div class="alert alert-success mt-3">
                        <i class="fas fa-check-circle"></i> Email đã xác thực
                        <br><small>{{ $user->email_verified_at->format('d/m/Y H:i') }}</small>
                    </div>
                @else
                    <div class="alert alert-warning mt-3">
                        <i class="fas fa-exclamation-triangle"></i> Email chưa xác thực
                    </div>
                @endif
            </div>
        </div>
        
        <!-- User Stats -->
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Thống kê</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-12 mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Tổng Credits:</span>
                            <strong class="text-info">{{ number_format($totalCredits) }}</strong>
                        </div>
                    </div>
                    <div class="col-12 mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Credits đã sử dụng:</span>
                            <strong class="text-warning">{{ number_format($usedCredits) }}</strong>
                        </div>
                    </div>
                    <div class="col-12 mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Tổng Files:</span>
                            <strong class="text-success">{{ $totalFiles }}</strong>
                        </div>
                    </div>
                    <div class="col-12 mb-3">
                        <div class="d-flex justify-content-between">
                            <span>Dung lượng sử dụng:</span>
                            <strong class="text-danger">{{ number_format($totalStorage / (1024*1024), 2) }} MB</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- User Details -->
    <div class="col-lg-8">
        <!-- Account Details -->
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Chi tiết tài khoản</h6>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-borderless">
                            <tr>
                                <td><strong>ID:</strong></td>
                                <td>{{ $user->id }}</td>
                            </tr>
                            <tr>
                                <td><strong>Tên:</strong></td>
                                <td>{{ $user->name }}</td>
                            </tr>
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td>{{ $user->email }}</td>
                            </tr>
                            <tr>
                                <td><strong>Role:</strong></td>
                                <td>
                                    <span class="badge bg-{{ $user->role === 'admin' ? 'danger' : 'primary' }}">
                                        {{ ucfirst($user->role) }}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-borderless">
                            <tr>
                                <td><strong>Status:</strong></td>
                                <td>
                                    <span class="badge bg-{{ $user->status === 'active' ? 'success' : 'secondary' }}">
                                        {{ ucfirst($user->status) }}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Pricing Plan:</strong></td>
                                <td>
                                    @if($user->currentPricingPlan)
                                        <span class="badge bg-warning text-dark">
                                            {{ $user->currentPricingPlan->name }}
                                        </span>
                                    @else
                                        <span class="text-muted">Chưa có</span>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Ngày tạo:</strong></td>
                                <td>{{ $user->created_at->format('d/m/Y H:i') }}</td>
                            </tr>
                            <tr>
                                <td><strong>Cập nhật cuối:</strong></td>
                                <td>{{ $user->updated_at->format('d/m/Y H:i') }}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Files -->
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 class="m-0 font-weight-bold text-primary">Files gần đây</h6>
                <a href="{{ route('admin.files.index', ['user_id' => $user->id]) }}" class="btn btn-sm btn-primary">
                    Xem tất cả
                </a>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Tên File</th>
                                <th>Loại</th>
                                <th>Kích thước</th>
                                <th>Ngày tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($recentFiles as $file)
                            <tr>
                                <td>
                                    <i class="fas fa-file-alt me-2"></i>
                                    {{ Str::limit($file->original_name, 40) }}
                                </td>
                                <td>
                                    <span class="badge bg-info">{{ strtoupper($file->file_type) }}</span>
                                </td>
                                <td>{{ number_format($file->size / 1024, 2) }} KB</td>
                                <td>{{ $file->created_at->format('d/m/Y H:i') }}</td>
                                <td>
                                    <div class="btn-group" role="group">
                                        <a href="{{ route('admin.files.download', $file) }}" class="btn btn-sm btn-success" title="Tải xuống">
                                            <i class="fas fa-download"></i>
                                        </a>
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
                                <td colspan="5" class="text-center py-3">
                                    <i class="fas fa-file-alt fa-2x text-muted mb-2"></i>
                                    <p class="text-muted mb-0">Chưa có file nào</p>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Credit History -->
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 class="m-0 font-weight-bold text-primary">Lịch sử Credits</h6>
                <a href="{{ route('admin.users.credits', $user) }}" class="btn btn-sm btn-primary">
                    Xem chi tiết
                </a>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Credits</th>
                                <th>Loại</th>
                                <th>Ngày hết hạn</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($recentCredits as $credit)
                            <tr>
                                <td>
                                    <span class="badge bg-info">{{ number_format($credit->credits) }}</span>
                                </td>
                                <td>
                                    <span class="badge bg-{{ $credit->type === 'purchased' ? 'success' : 'warning' }}">
                                        {{ ucfirst($credit->type) }}
                                    </span>
                                </td>
                                <td>
                                    @if($credit->expires_at)
                                        {{ $credit->expires_at->format('d/m/Y') }}
                                        @if($credit->expires_at->isPast())
                                            <span class="badge bg-danger ms-1">Hết hạn</span>
                                        @endif
                                    @else
                                        <span class="text-muted">Không hết hạn</span>
                                    @endif
                                </td>
                                <td>
                                    <span class="badge bg-{{ $credit->status === 'active' ? 'success' : 'secondary' }}">
                                        {{ ucfirst($credit->status) }}
                                    </span>
                                </td>
                                <td>{{ $credit->created_at->format('d/m/Y H:i') }}</td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="5" class="text-center py-3">
                                    <i class="fas fa-coins fa-2x text-muted mb-2"></i>
                                    <p class="text-muted mb-0">Chưa có lịch sử credits</p>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit User Modal -->
<div class="modal fade" id="editUserModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Chỉnh sửa User</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="editUserForm" method="POST">
                @csrf
                @method('PATCH')
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="role" class="form-label">Role</label>
                        <select class="form-select" id="role" name="role" required>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status" required>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-primary">Cập nhật</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
function editUser(userId, role, status) {
    document.getElementById('editUserForm').action = `/admin/users/${userId}/role`;
    document.getElementById('role').value = role;
    document.getElementById('status').value = status;
    new bootstrap.Modal(document.getElementById('editUserModal')).show();
}

function confirmDeleteFile(fileId, fileName) {
    if (confirm(`Bạn có chắc chắn muốn xóa file "${fileName}"?`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/files/${fileId}`;
        form.innerHTML = `
            @csrf
            @method('DELETE')
        `;
        document.body.appendChild(form);
        form.submit();
    }
}
</script>

<style>
.avatar {
    width: 80px;
    height: 80px;
}
.avatar-initial {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
}
</style>
@endsection