@extends('admin.layouts.app')

@section('title', 'Quản lý Users')

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
        <h6 class="m-0 font-weight-bold text-primary">Danh sách Users</h6>
        <div class="d-flex">
            <form class="d-flex me-3" method="GET" action="{{ route('admin.users.index') }}">
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
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Credits</th>
                        <th>Pricing Plan</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($users as $user)
                    <tr>
                        <td>{{ $user->id }}</td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="avatar me-2">
                                    <div class="avatar-initial bg-primary rounded-circle">
                                        {{ strtoupper(substr($user->name, 0, 1)) }}
                                    </div>
                                </div>
                                <div>
                                    <strong>{{ $user->name }}</strong>
                                    @if($user->email_verified_at)
                                        <i class="fas fa-check-circle text-success ms-1" title="Email verified"></i>
                                    @endif
                                </div>
                            </div>
                        </td>
                        <td>{{ $user->email }}</td>
                        <td>
                            <span class="badge bg-{{ $user->role === 'admin' ? 'danger' : 'primary' }}">
                                {{ ucfirst($user->role) }}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-{{ $user->status === 'active' ? 'success' : 'secondary' }}">
                                {{ ucfirst($user->status) }}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-info">
                                {{ number_format($user->userCredits ? $user->userCredits->sum('credits') : 0) }} credits
                            </span>
                        </td>
                        <td>
                            @if($user->currentPricingPlan)
                                <span class="badge bg-warning text-dark">
                                    {{ $user->currentPricingPlan->name }}
                                </span>
                            @else
                                <span class="text-muted">Chưa có</span>
                            @endif
                        </td>
                        <td>{{ $user->created_at->format('d/m/Y H:i') }}</td>
                        <td>
                            <div class="btn-group" role="group">
                                <a href="{{ route('admin.users.show', $user) }}" class="btn btn-sm btn-info" title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </a>
                                <button type="button" class="btn btn-sm btn-warning" 
                                        onclick="editUser({{ $user->id }}, '{{ $user->role }}', '{{ $user->status }}')" 
                                        title="Chỉnh sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <a href="{{ route('admin.users.credits', $user) }}" class="btn btn-sm btn-success" title="Quản lý credits">
                                    <i class="fas fa-coins"></i>
                                </a>
                                @if($user->role !== 'admin')
                                <button type="button" class="btn btn-sm btn-danger" 
                                        onclick="confirmDelete({{ $user->id }}, '{{ $user->name }}')" 
                                        title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                                @endif
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" class="text-center py-4">
                            <i class="fas fa-users fa-3x text-muted mb-3"></i>
                            <p class="text-muted">Không tìm thấy user nào</p>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
                Hiển thị {{ $users->firstItem() ?? 0 }} đến {{ $users->lastItem() ?? 0 }} 
                trong tổng số {{ $users->total() }} kết quả
            </div>
            {{ $users->links() }}
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

<!-- Filter Modal -->
<div class="modal fade" id="filterModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Lọc Users</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form method="GET" action="{{ route('admin.users.index') }}">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="filter_role" class="form-label">Role</label>
                        <select class="form-select" id="filter_role" name="role">
                            <option value="">Tất cả</option>
                            <option value="user" {{ request('role') === 'user' ? 'selected' : '' }}>User</option>
                            <option value="admin" {{ request('role') === 'admin' ? 'selected' : '' }}>Admin</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="filter_status" class="form-label">Status</label>
                        <select class="form-select" id="filter_status" name="status">
                            <option value="">Tất cả</option>
                            <option value="active" {{ request('status') === 'active' ? 'selected' : '' }}>Active</option>
                            <option value="inactive" {{ request('status') === 'inactive' ? 'selected' : '' }}>Inactive</option>
                            <option value="suspended" {{ request('status') === 'suspended' ? 'selected' : '' }}>Suspended</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="filter_verified" class="form-label">Email Verified</label>
                        <select class="form-select" id="filter_verified" name="verified">
                            <option value="">Tất cả</option>
                            <option value="1" {{ request('verified') === '1' ? 'selected' : '' }}>Đã xác thực</option>
                            <option value="0" {{ request('verified') === '0' ? 'selected' : '' }}>Chưa xác thực</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-primary">Áp dụng</button>
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

function confirmDelete(userId, userName) {
    if (confirm(`Bạn có chắc chắn muốn xóa user "${userName}"?`)) {
        // Create and submit delete form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/users/${userId}`;
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
    width: 32px;
    height: 32px;
}
.avatar-initial {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
}
</style>
@endsection