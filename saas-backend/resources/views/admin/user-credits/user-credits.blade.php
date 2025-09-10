@extends('admin.layouts.app')

@section('title', 'Credits của ' . $user->name)

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="card-title">Credits của {{ $user->name }}</h3>
                    <a href="{{ route('admin.users.show', $user) }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Quay lại
                    </a>
                </div>
                <div class="card-body">
                    <!-- Credit Summary -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="info-box bg-info">
                                <span class="info-box-icon"><i class="fas fa-coins"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Tổng Credits</span>
                                    <span class="info-box-number">{{ number_format($totalCredits) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="info-box bg-warning">
                                <span class="info-box-icon"><i class="fas fa-minus-circle"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Đã sử dụng</span>
                                    <span class="info-box-number">{{ number_format($usedCredits) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="info-box bg-success">
                                <span class="info-box-icon"><i class="fas fa-check-circle"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Còn lại</span>
                                    <span class="info-box-number">{{ number_format($remainingCredits) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="info-box bg-primary">
                                <span class="info-box-icon"><i class="fas fa-percentage"></i></span>
                                <div class="info-box-content">
                                    <span class="info-box-text">Tỷ lệ sử dụng</span>
                                    <span class="info-box-number">{{ $totalCredits > 0 ? round(($usedCredits / $totalCredits) * 100, 1) : 0 }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Credits Table -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Gói</th>
                                    <th>Tổng Credits</th>
                                    <th>Đã sử dụng</th>
                                    <th>Còn lại</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($userCredits as $credit)
                                <tr>
                                    <td>{{ $credit->id }}</td>
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
                                </tr>
                                @empty
                                <tr>
                                    <td colspan="8" class="text-center text-muted">
                                        <i class="fas fa-inbox fa-2x mb-2"></i>
                                        <p>Người dùng này chưa có credits nào.</p>
                                    </td>
                                </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    @if($userCredits->hasPages())
                        <div class="d-flex justify-content-center">
                            {{ $userCredits->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection