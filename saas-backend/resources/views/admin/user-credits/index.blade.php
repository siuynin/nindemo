@extends('admin.layouts.app')

@section('title', 'Quản lý Credit')

@section('breadcrumb')
    <li class="breadcrumb-item"><a href="{{ route('admin.dashboard') }}">Dashboard</a></li>
    <li class="breadcrumb-item active">Quản lý Credit</li>
@endsection

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách Credit</h3>
                    <div class="card-tools">
                        <a href="{{ route('admin.user-credits.create') }}" class="btn btn-primary btn-sm">
                            <i class="fas fa-plus"></i> Thêm Credit
                        </a>
                    </div>
                </div>
                <div class="card-body">
                    <!-- Search and Filter Form -->
                    <form method="GET" action="{{ route('admin.user-credits.index') }}" class="mb-3">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-group">
                                    <label for="search">Tìm kiếm người dùng:</label>
                                    <input type="text" name="search" id="search" class="form-control" 
                                           value="{{ request('search') }}" placeholder="Tên hoặc email...">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="pricing_plan_id">Gói dịch vụ:</label>
                                    <select name="pricing_plan_id" id="pricing_plan_id" class="form-control">
                                        <option value="">Tất cả gói</option>
                                        @foreach($pricingPlans as $plan)
                                            <option value="{{ $plan->id }}" 
                                                {{ request('pricing_plan_id') == $plan->id ? 'selected' : '' }}>
                                                {{ $plan->name }}
                                            </option>
                                        @endforeach
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="form-group">
                                    <label>&nbsp;</label>
                                    <div>
                                        <button type="submit" class="btn btn-primary">
                                            <i class="fas fa-search"></i> Tìm kiếm
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label>&nbsp;</label>
                                    <div>
                                        <a href="{{ route('admin.user-credits.index') }}" class="btn btn-secondary">
                                            <i class="fas fa-times"></i> Xóa bộ lọc
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    <!-- Credits Table -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Người dùng</th>
                                    <th>Gói dịch vụ</th>
                                    <th>Tổng Credits</th>
                                    <th>Đã sử dụng</th>
                                    <th>Còn lại</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($userCredits as $credit)
                                <tr>
                                    <td>{{ $credit->id }}</td>
                                    <td>
                                        <div>
                                            <strong>{{ $credit->user->name }}</strong><br>
                                            <small class="text-muted">{{ $credit->user->email }}</small>
                                        </div>
                                    </td>
                                    <td>
                                        @if($credit->pricingPlan)
                                            <span class="badge bg-primary">{{ $credit->pricingPlan->name }}</span>
                                        @else
                                            <span class="text-muted">N/A</span>
                                        @endif
                                    </td>
                                    <td>
                                        <span class="badge bg-info">{{ number_format($credit->total_credits) }}</span>
                                    </td>
                                    <td>
                                        <span class="badge bg-warning">{{ number_format($credit->used_credits) }}</span>
                                    </td>
                                    <td>
                                        <span class="badge bg-success">{{ number_format($credit->remaining_credits) }}</span>
                                    </td>
                                    <td>
                                        @if($credit->expires_at)
                                            {{ $credit->expires_at->format('d/m/Y H:i') }}
                                            @if($credit->expires_at->isPast())
                                                <span class="badge bg-danger ms-1">Hết hạn</span>
                                            @endif
                                        @else
                                            <span class="text-muted">Không hết hạn</span>
                                        @endif
                                    </td>
                                    <td>
                                        @if($credit->remaining_credits > 0 && (!$credit->expires_at || !$credit->expires_at->isPast()))
                                            <span class="badge bg-success">Hoạt động</span>
                                        @else
                                            <span class="badge bg-secondary">Không hoạt động</span>
                                        @endif
                                    </td>
                                    <td>{{ $credit->created_at->format('d/m/Y H:i') }}</td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <a href="{{ route('admin.users.credits', $credit->user) }}" 
                                               class="btn btn-sm btn-info" title="Xem chi tiết">
                                                <i class="fas fa-eye"></i>
                                            </a>
                                            <a href="{{ route('admin.users.show', $credit->user) }}" 
                                               class="btn btn-sm btn-primary" title="Xem người dùng">
                                                <i class="fas fa-user"></i>
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                                @empty
                                <tr>
                                    <td colspan="10" class="text-center text-muted">
                                        <i class="fas fa-inbox fa-2x mb-2"></i>
                                        <p>Không có dữ liệu credit nào.</p>
                                    </td>
                                </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    @if($userCredits->hasPages())
                        <div class="d-flex justify-content-center">
                            {{ $userCredits->appends(request()->query())->links() }}
                        </div>
                    @endif
                </div>
                <div class="card-footer">
                    <div class="row">
                        <div class="col-sm-12 col-md-5">
                            <div class="dataTables_info">
                                Hiển thị {{ $userCredits->firstItem() ?? 0 }} đến {{ $userCredits->lastItem() ?? 0 }} 
                                trong tổng số {{ $userCredits->total() }} bản ghi
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
<style>
.badge {
    font-size: 0.75em;
}
.btn-group .btn {
    margin-right: 2px;
}
.btn-group .btn:last-child {
    margin-right: 0;
}
</style>
@endpush