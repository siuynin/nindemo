@extends('admin.layouts.app')

@section('title', 'Quản lý Gói Credit')

@section('page-actions')
<div class="btn-toolbar mb-2 mb-md-0">
    <div class="btn-group me-2">
        <a href="{{ route('admin.pricing-plans.create') }}" class="btn btn-sm btn-primary">
            <i class="fas fa-plus"></i> Thêm gói mới
        </a>
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="refreshTable()">
            <i class="fas fa-sync-alt"></i> Làm mới
        </button>
    </div>
</div>
@endsection

@section('content')
<div class="card shadow mb-4">
    <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Danh sách Gói Credit</h6>
    </div>
    <div class="card-body">
        <!-- Search and Filter -->
        <div class="row mb-3">
            <div class="col-md-6">
                <div class="input-group">
                    <input type="text" class="form-control" id="searchInput" placeholder="Tìm kiếm theo tên gói...">
                    <button class="btn btn-outline-secondary" type="button" onclick="searchPlans()">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="statusFilter" onchange="filterPlans()">
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="sortBy" onchange="sortPlans()">
                    <option value="name">Sắp xếp theo tên</option>
                    <option value="price">Sắp xếp theo giá</option>
                    <option value="credits">Sắp xếp theo credits</option>
                    <option value="created_at">Sắp xếp theo ngày tạo</option>
                </select>
            </div>
        </div>
        
        <!-- Plans Table -->
        <div class="table-responsive">
            <table class="table table-bordered" id="plansTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên gói</th>
                        <th>Mô tả</th>
                        <th>Credits</th>
                        <th>Giá (VND)</th>
                        <th>Chu kỳ</th>
                        <th>Voice Clone</th>
                        <th>Trạng thái</th>
                        <th>Người dùng</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($pricingPlans as $plan)
                    <tr>
                        <td>{{ $plan->id }}</td>
                        <td>
                            <strong>{{ $plan->name }}</strong>
                            @if($plan->is_popular)
                                <span class="badge bg-warning text-dark ms-1">Phổ biến</span>
                            @endif
                        </td>
                        <td>
                            <small class="text-muted">{{ Str::limit($plan->description, 50) }}</small>
                        </td>
                        <td>
                            <span class="badge bg-info">{{ number_format($plan->credits) }}</span>
                        </td>
                        <td>
                            <strong class="text-success">{{ number_format($plan->price) }}đ</strong>
                        </td>
                        <td>
                            <span class="badge bg-secondary">
                                @switch($plan->billing_cycle)
                                    @case('monthly')
                                        Hàng tháng
                                        @break
                                    @case('yearly')
                                        Hàng năm
                                        @break
                                    @case('one_time')
                                        Một lần
                                        @break
                                    @default
                                        N/A
                                @endswitch
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-info">{{ $plan->max_voice_clone ?? 0 }}</span>
                        </td>
                        <td>
                            <span class="badge bg-{{ $plan->status === 'active' ? 'success' : 'secondary' }}">
                                {{ ucfirst($plan->status) }}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-primary">{{ $plan->users_count ?? 0 }}</span>
                        </td>
                        <td>
                            <small>{{ $plan->created_at->format('d/m/Y') }}</small>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-info" 
                                        onclick="viewPlan({{ $plan->id }})" title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <a href="{{ route('admin.pricing-plans.edit', $plan) }}" class="btn btn-sm btn-warning" 
                                   title="Chỉnh sửa">
                                    <i class="fas fa-edit"></i>
                                </a>
                                <button type="button" class="btn btn-sm btn-{{ $plan->status === 'active' ? 'secondary' : 'success' }}" 
                                        onclick="togglePlanStatus({{ $plan->id }}, '{{ $plan->status }}')" 
                                        title="{{ $plan->status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt' }}">
                                    <i class="fas fa-{{ $plan->status === 'active' ? 'pause' : 'play' }}"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-danger" 
                                        onclick="confirmDeletePlan({{ $plan->id }}, '{{ addslashes($plan->name) }}')" 
                                        title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="11" class="text-center py-4">
                            <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                            <p class="text-muted mb-0">Chưa có gói credit nào</p>
                            <button type="button" class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#createPlanModal">
                                <i class="fas fa-plus"></i> Tạo gói đầu tiên
                            </button>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        @if($pricingPlans->hasPages())
        <div class="d-flex justify-content-center">
            {{ $pricingPlans->links() }}
        </div>
        @endif
    </div>
</div>

<!-- Create Plan Modal -->
<div class="modal fade" id="createPlanModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Tạo gói credit mới</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form action="{{ route('admin.pricing-plans.store') }}" method="POST">
                @csrf
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="name" class="form-label">Tên gói <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="name" name="name" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="credits" class="form-label">Số Credits <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="credits" name="credits" min="1" required>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="price" class="form-label">Giá (VND) <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="price" name="price" min="0" step="1000" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="status" class="form-label">Trạng thái</label>
                                <select class="form-select" id="status" name="status">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">Mô tả</label>
                        <textarea class="form-control" id="description" name="description" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="is_popular" name="is_popular" value="1">
                            <label class="form-check-label" for="is_popular">
                                Đánh dấu là gói phổ biến
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                    <button type="submit" class="btn btn-primary">Tạo gói</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Plan Modal -->
<div class="modal fade" id="editPlanModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Chỉnh sửa gói credit</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="editPlanForm" method="POST">
                @csrf
                @method('PATCH')
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="edit_name" class="form-label">Tên gói <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="edit_name" name="name" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="edit_credits" class="form-label">Số Credits <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="edit_credits" name="credits" min="1" required>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="edit_price" class="form-label">Giá (VND) <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="edit_price" name="price" min="0" step="1000" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="edit_status" class="form-label">Trạng thái</label>
                                <select class="form-select" id="edit_status" name="status">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="edit_description" class="form-label">Mô tả</label>
                        <textarea class="form-control" id="edit_description" name="description" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="edit_is_popular" name="is_popular" value="1">
                            <label class="form-check-label" for="edit_is_popular">
                                Đánh dấu là gói phổ biến
                            </label>
                        </div>
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

<!-- View Plan Modal -->
<div class="modal fade" id="viewPlanModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Chi tiết gói credit</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="planDetails">
                <!-- Plan details will be loaded here -->
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
function editPlan(id, name, description, credits, price, status, isPopular) {
    document.getElementById('editPlanForm').action = `/admin/pricing-plans/${id}`;
    document.getElementById('edit_name').value = name;
    document.getElementById('edit_description').value = description;
    document.getElementById('edit_credits').value = credits;
    document.getElementById('edit_price').value = price;
    document.getElementById('edit_status').value = status;
    document.getElementById('edit_is_popular').checked = isPopular === 'true';
    new bootstrap.Modal(document.getElementById('editPlanModal')).show();
}

function viewPlan(id) {
    fetch(`/admin/pricing-plans/${id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('planDetails').innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Thông tin cơ bản</h6>
                        <table class="table table-borderless">
                            <tr><td><strong>ID:</strong></td><td>${data.id}</td></tr>
                            <tr><td><strong>Tên:</strong></td><td>${data.name}</td></tr>
                            <tr><td><strong>Credits:</strong></td><td><span class="badge bg-info">${data.credits.toLocaleString()}</span></td></tr>
                            <tr><td><strong>Giá:</strong></td><td><strong class="text-success">${data.price.toLocaleString()}đ</strong></td></tr>
                            <tr><td><strong>Giá/Credit:</strong></td><td>${(data.price/data.credits).toFixed(2)}đ</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Trạng thái & Thống kê</h6>
                        <table class="table table-borderless">
                            <tr><td><strong>Trạng thái:</strong></td><td><span class="badge bg-${data.status === 'active' ? 'success' : 'secondary'}">${data.status}</span></td></tr>
                            <tr><td><strong>Phổ biến:</strong></td><td>${data.is_popular ? '<span class="badge bg-warning text-dark">Có</span>' : '<span class="text-muted">Không</span>'}</td></tr>
                            <tr><td><strong>Người dùng:</strong></td><td><span class="badge bg-primary">${data.users_count || 0}</span></td></tr>
                            <tr><td><strong>Ngày tạo:</strong></td><td>${new Date(data.created_at).toLocaleDateString('vi-VN')}</td></tr>
                            <tr><td><strong>Cập nhật:</strong></td><td>${new Date(data.updated_at).toLocaleDateString('vi-VN')}</td></tr>
                        </table>
                    </div>
                </div>
                ${data.description ? `<div class="mt-3"><h6>Mô tả</h6><p class="text-muted">${data.description}</p></div>` : ''}
                ${data.feature_list && Array.isArray(data.feature_list) && data.feature_list.length > 0 ? 
                    `<div class="mt-3"><h6>Danh sách tính năng nổi bật</h6><ul class="list-unstyled">${data.feature_list.map(feature => `<li><i class="fas fa-check text-success me-2"></i>${feature}</li>`).join('')}</ul></div>` : ''}
            `;
            new bootstrap.Modal(document.getElementById('viewPlanModal')).show();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi tải thông tin gói!');
        });
}

function togglePlanStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa';
    
    if (confirm(`Bạn có chắc chắn muốn ${action} gói này?`)) {
        fetch(`/admin/pricing-plans/${id}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('Có lỗi xảy ra!');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra!');
        });
    }
}

function confirmDeletePlan(id, name) {
    if (confirm(`Bạn có chắc chắn muốn xóa gói "${name}"?\n\nLưu ý: Hành động này không thể hoàn tác!`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/admin/pricing-plans/${id}`;
        
        const csrfToken = document.createElement('input');
        csrfToken.type = 'hidden';
        csrfToken.name = '_token';
        csrfToken.value = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        
        const methodField = document.createElement('input');
        methodField.type = 'hidden';
        methodField.name = '_method';
        methodField.value = 'DELETE';
        
        form.appendChild(csrfToken);
        form.appendChild(methodField);
        document.body.appendChild(form);
        form.submit();
    }
}

function searchPlans() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#plansTable tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const description = row.cells[2].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || description.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterPlans() {
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#plansTable tbody tr');
    
    rows.forEach(row => {
        if (statusFilter === '') {
            row.style.display = '';
        } else {
            const status = row.cells[6].textContent.toLowerCase().trim();
            if (status.includes(statusFilter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

function sortPlans() {
    const sortBy = document.getElementById('sortBy').value;
    const tbody = document.querySelector('#plansTable tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        let aVal, bVal;
        
        switch(sortBy) {
            case 'name':
                aVal = a.cells[1].textContent.trim();
                bVal = b.cells[1].textContent.trim();
                return aVal.localeCompare(bVal);
            case 'price':
                aVal = parseInt(a.cells[4].textContent.replace(/[^0-9]/g, ''));
                bVal = parseInt(b.cells[4].textContent.replace(/[^0-9]/g, ''));
                return aVal - bVal;
            case 'credits':
                aVal = parseInt(a.cells[3].textContent.replace(/[^0-9]/g, ''));
                bVal = parseInt(b.cells[3].textContent.replace(/[^0-9]/g, ''));
                return aVal - bVal;
            case 'created_at':
                aVal = new Date(a.cells[8].textContent.trim());
                bVal = new Date(b.cells[8].textContent.trim());
                return bVal - aVal;
            default:
                return 0;
        }
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

function refreshTable() {
    location.reload();
}

// Auto-calculate price per credit
document.getElementById('credits').addEventListener('input', calculatePricePerCredit);
document.getElementById('price').addEventListener('input', calculatePricePerCredit);

function calculatePricePerCredit() {
    const credits = document.getElementById('credits').value;
    const price = document.getElementById('price').value;
    
    if (credits && price && credits > 0) {
        const pricePerCredit = (price / credits).toFixed(2);
        // You can display this somewhere if needed
    }
}
</script>
@endsection