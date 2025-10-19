@extends('admin.layouts.app')

@section('title', 'Quản lý Bug Reports')

@section('page-actions')
<div class="btn-toolbar mb-2 mb-md-0">
    <div class="btn-group me-2">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#filterModal">
            <i class="fas fa-filter"></i> Lọc
        </button>
    </div>
</div>
<!-- Image Modal -->
<div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="imageModalLabel">Screenshot</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center">
                <img id="modalImage" src="" alt="" class="img-fluid" style="max-height: 70vh;">
            </div>
        </div>
    </div>
</div>

@endsection

@section('content')
<div class="card shadow">
    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
        <h6 class="m-0 font-weight-bold text-primary">Danh sách Bug Reports</h6>
        <div class="d-flex">
            <form class="d-flex me-3" method="GET" action="{{ route('admin.bug-reports.index') }}">
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
                        <th>Tiêu đề</th>
                        <th>Người báo cáo</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th>Ngày giải quyết</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($bugReports as $report)
                    <tr>
                        <td>{{ $report->id }}</td>
                        <td>
                            <strong>{{ Str::limit($report->title, 50) }}</strong>
                            <br>
                            <small class="text-muted">{{ Str::limit($report->description, 100) }}</small>
                        </td>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="avatar me-2">
                                    <div class="avatar-initial bg-primary rounded-circle">
                                        {{ strtoupper(substr($report->user->name, 0, 1)) }}
                                    </div>
                                </div>
                                <div>
                                    <strong>{{ $report->user->name }}</strong>
                                    <br>
                                    <small class="text-muted">{{ $report->user->email }}</small>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-{{ $report->status === 'completed' ? 'success' : 'warning' }}">
                                {{ $report->status === 'completed' ? 'Đã giải quyết' : 'Đang chờ' }}
                            </span>
                        </td>
                        <td>{{ $report->created_at->format('d/m/Y H:i') }}</td>
                        <td>
                            @if($report->resolved_at)
                                {{ $report->resolved_at->format('d/m/Y H:i') }}
                            @else
                                <span class="text-muted">Chưa giải quyết</span>
                            @endif
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-sm btn-info" 
                                        onclick="viewBugReport({{ $report->id }})" 
                                        title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-warning" 
                                        onclick="editBugReport({{ $report->id }})" 
                                        title="Chỉnh sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                @if($report->status === 'pending')
                                <button type="button" class="btn btn-sm btn-success" 
                                        onclick="markAsCompleted({{ $report->id }})" 
                                        title="Đánh dấu đã giải quyết">
                                    <i class="fas fa-check"></i>
                                </button>
                                @endif
                                <button type="button" class="btn btn-sm btn-danger" 
                                        onclick="deleteBugReport({{ $report->id }})" 
                                        title="Xóa">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <div class="text-muted">
                                <i class="fas fa-inbox fa-3x mb-3"></i>
                                <p>Không có bug report nào</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        @if($bugReports->hasPages())
        <div class="d-flex justify-content-center">
            {{ $bugReports->appends(request()->query())->links() }}
        </div>
        @endif
    </div>
</div>

<!-- Filter Modal -->
<div class="modal fade" id="filterModal" tabindex="-1" aria-labelledby="filterModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="filterModalLabel">Lọc Bug Reports</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form method="GET" action="{{ route('admin.bug-reports.index') }}">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="status" class="form-label">Trạng thái</label>
                        <select class="form-select" name="status" id="status">
                            <option value="">Tất cả</option>
                            <option value="pending" {{ request('status') === 'pending' ? 'selected' : '' }}>Đang chờ</option>
                            <option value="completed" {{ request('status') === 'completed' ? 'selected' : '' }}>Đã giải quyết</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="search" class="form-label">Tìm kiếm</label>
                        <input type="text" class="form-control" name="search" id="search" 
                               placeholder="Tìm theo tiêu đề hoặc mô tả..." value="{{ request('search') }}">
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

<!-- View Bug Report Modal -->
<div class="modal fade" id="viewBugReportModal" tabindex="-1" aria-labelledby="viewBugReportModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewBugReportModalLabel">Chi tiết Bug Report</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="bugReportDetails">
                <!-- Content will be loaded here -->
            </div>
        </div>
    </div>
</div>

<!-- Edit Bug Report Modal -->
<div class="modal fade" id="editBugReportModal" tabindex="-1" aria-labelledby="editBugReportModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editBugReportModalLabel">Chỉnh sửa Bug Report</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="editBugReportForm">
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="editStatus" class="form-label">Trạng thái</label>
                        <select class="form-select" name="status" id="editStatus" required>
                            <option value="pending">Đang chờ</option>
                            <option value="completed">Đã giải quyết</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="editAdminNotes" class="form-label">Ghi chú của Admin</label>
                        <textarea class="form-control" name="admin_notes" id="editAdminNotes" rows="4" 
                                  placeholder="Thêm ghi chú về cách giải quyết..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                    <button type="submit" class="btn btn-primary">Cập nhật</button>
                </div>
            </form>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script>
let currentBugReportId = null;

// View bug report details
function viewBugReport(id) {
    fetch(`/admin/bug-reports/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const report = data.data;
                const screenshotsHtml = report.screenshots && report.screenshots.length > 0 ? `
                    <div class="col-12 mt-3">
                        <h6>Screenshots</h6>
                        <div class="row">
                            ${report.screenshots.map((screenshot, index) => `
                                <div class="col-md-3 col-sm-6 mb-3">
                                    <div class="card">
                                        <img src="${screenshot}" class="card-img-top" alt="Screenshot ${index + 1}" 
                                             style="height: 150px; object-fit: cover; cursor: pointer;" 
                                             onclick="showImageModal('${screenshot}', 'Screenshot ${index + 1}')">
                                        <div class="card-body p-2">
                                            <small class="text-muted">Screenshot ${index + 1}</small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : '';

                const detailsHtml = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Thông tin cơ bản</h6>
                            <p><strong>ID:</strong> ${report.id}</p>
                            <p><strong>Tiêu đề:</strong> ${report.title}</p>
                            <p><strong>Người báo cáo:</strong> ${report.user.name} (${report.user.email})</p>
                            <p><strong>Trạng thái:</strong> 
                                <span class="badge bg-${report.status === 'completed' ? 'success' : 'warning'}">
                                    ${report.status === 'completed' ? 'Đã giải quyết' : 'Đang chờ'}
                                </span>
                            </p>
                            <p><strong>Ngày tạo:</strong> ${new Date(report.created_at).toLocaleString('vi-VN')}</p>
                            ${report.resolved_at ? `<p><strong>Ngày giải quyết:</strong> ${new Date(report.resolved_at).toLocaleString('vi-VN')}</p>` : ''}
                        </div>
                        <div class="col-md-6">
                            <h6>Mô tả chi tiết</h6>
                            <p>${report.description}</p>
                            ${report.admin_notes ? `
                                <h6>Ghi chú của Admin</h6>
                                <p class="text-muted">${report.admin_notes}</p>
                            ` : ''}
                        </div>
                        ${screenshotsHtml}
                    </div>
                `;
                document.getElementById('bugReportDetails').innerHTML = detailsHtml;
                new bootstrap.Modal(document.getElementById('viewBugReportModal')).show();
            } else {
                alert('Không thể tải thông tin bug report');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu');
        });
}

// Edit bug report
function editBugReport(id) {
    currentBugReportId = id;
    
    fetch(`/admin/bug-reports/${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const report = data.data;
                document.getElementById('editStatus').value = report.status;
                document.getElementById('editAdminNotes').value = report.admin_notes || '';
                new bootstrap.Modal(document.getElementById('editBugReportModal')).show();
            } else {
                alert('Không thể tải thông tin bug report');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi tải dữ liệu');
        });
}

// Save bug report changes
document.getElementById('editBugReportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    
    fetch(`/admin/bug-reports/${currentBugReportId}`, {
        method: 'PUT',
        body: formData,
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Cập nhật thành công!');
            bootstrap.Modal.getInstance(document.getElementById('editBugReportModal')).hide();
            location.reload();
        } else {
            alert('Có lỗi xảy ra: ' + (data.message || 'Không thể cập nhật'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi cập nhật');
    });
});

// Mark as completed
function markAsCompleted(id) {
    if (confirm('Đánh dấu bug report này là đã giải quyết?')) {
        const formData = new FormData();
        formData.append('status', 'completed');
        
        fetch(`/admin/bug-reports/${id}`, {
            method: 'PUT',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Đã đánh dấu là hoàn thành!');
                location.reload();
            } else {
                alert('Có lỗi xảy ra: ' + (data.message || 'Không thể cập nhật'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi cập nhật');
        });
    }
}

// Show image in modal
function showImageModal(imageSrc, imageTitle) {
    document.getElementById('modalImage').src = imageSrc;
    document.getElementById('imageModalLabel').textContent = imageTitle;
    new bootstrap.Modal(document.getElementById('imageModal')).show();
}

// Delete bug report
function deleteBugReport(id) {
    if (confirm('Bạn có chắc chắn muốn xóa bug report này? Hành động này không thể hoàn tác.')) {
        fetch(`/admin/bug-reports/${id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Xóa thành công!');
                location.reload();
            } else {
                alert('Có lỗi xảy ra: ' + (data.message || 'Không thể xóa'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi xóa');
        });
    }
}
</script>
@endsection