@extends('admin.layouts.app')

@section('title', 'Thêm Credit cho Người dùng')

@section('breadcrumb')
    <li class="breadcrumb-item"><a href="{{ route('admin.dashboard') }}">Dashboard</a></li>
    <li class="breadcrumb-item"><a href="{{ route('admin.user-credits.index') }}">Quản lý Credit</a></li>
    <li class="breadcrumb-item active">Thêm Credit</li>
@endsection

@section('scripts')
<script>
$(document).ready(function() {
    // Khởi tạo Select2 cho pricing plan
    $('#pricing_plan_id').select2({
        placeholder: 'Chọn gói dịch vụ (tùy chọn)',
        allowClear: true,
        width: '100%'
    });

    // Khởi tạo Select2 Ajax cho user selection
    $('#user_id').select2({
        placeholder: 'Tìm kiếm và chọn người dùng...',
        allowClear: false,
        width: '100%',
        minimumInputLength: 2,
        ajax: {
            url: '{{ route("admin.users.search") }}',
            dataType: 'json',
            delay: 300,
            data: function (params) {
                return {
                    q: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.users.map(function(user) {
                        return {
                            id: user.id,
                            text: user.name + ' (' + user.email + ')'
                        };
                    })
                };
            },
            cache: true
        },
        language: {
            inputTooShort: function () {
                return 'Nhập ít nhất 2 ký tự để tìm kiếm...';
            },
            noResults: function () {
                return 'Không tìm thấy người dùng nào';
            },
            searching: function () {
                return 'Đang tìm kiếm...';
            }
        }
    });

    // Auto-fill credits when selecting a pricing plan
    $('#pricing_plan_id').change(function() {
        var selectedOption = $(this).find('option:selected');
        if (selectedOption.val()) {
            // You can add logic here to auto-fill credits based on plan
            // For now, we'll just focus the credits field
            $('#total_credits').focus();
        }
    });
});
</script>
@endsection

@section('content')
<div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 class="h3 mb-0 text-gray-800">Thêm Credit cho Người dùng</h1>
        <a href="{{ route('admin.user-credits.index') }}" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> Quay lại
        </a>
    </div>

    <div class="row">
        <div class="col-lg-8">
            <div class="card shadow mb-4">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Thông tin Credit</h6>
                </div>
                <div class="card-body">
                    @if ($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form action="{{ route('admin.user-credits.store') }}" method="POST">
                        @csrf
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="user_id">Người dùng <span class="text-danger">*</span></label>
                                    <select class="form-control select2-ajax @error('user_id') is-invalid @enderror" 
                                            id="user_id" name="user_id" required>
                                        @if(old('user_id'))
                                            @php
                                                $selectedUser = \App\Models\User::find(old('user_id'));
                                            @endphp
                                            @if($selectedUser)
                                                <option value="{{ $selectedUser->id }}" selected>
                                                    {{ $selectedUser->name }} ({{ $selectedUser->email }})
                                                </option>
                                            @endif
                                        @endif
                                    </select>
                                    @error('user_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Tìm kiếm và chọn người dùng</small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="pricing_plan_id">Gói dịch vụ</label>
                                    <select class="form-control select2 @error('pricing_plan_id') is-invalid @enderror" 
                                            id="pricing_plan_id" name="pricing_plan_id">
                                        <option value="">Chọn gói dịch vụ (tùy chọn)</option>
                                        @foreach($pricingPlans as $plan)
                                            <option value="{{ $plan->id }}" 
                                                {{ old('pricing_plan_id') == $plan->id ? 'selected' : '' }}>
                                                {{ $plan->name }} - {{ number_format($plan->credits) }} credits
                                            </option>
                                        @endforeach
                                    </select>
                                    @error('pricing_plan_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Chọn gói để tự động điền số credit và ngày hết hạn</small>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="total_credits">Số lượng Credit <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control @error('total_credits') is-invalid @enderror" 
                                           id="total_credits" name="total_credits" value="{{ old('total_credits') }}" 
                                           min="1" required>
                                    @error('total_credits')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="credit_type">Loại Credit <span class="text-danger">*</span></label>
                                    <select class="form-control @error('credit_type') is-invalid @enderror" 
                                            id="credit_type" name="credit_type" required>
                                        <option value="">Chọn loại credit</option>
                                        <option value="free" {{ old('credit_type') == 'free' ? 'selected' : '' }}>
                                            Free Credit
                                        </option>
                                        <option value="purchased" {{ old('credit_type') == 'purchased' ? 'selected' : '' }}>
                                            Purchased Credit
                                        </option>
                                        <option value="bonus" {{ old('credit_type') == 'bonus' ? 'selected' : '' }}>
                                            Bonus Credit
                                        </option>
                                        <option value="refund" {{ old('credit_type') == 'refund' ? 'selected' : '' }}>
                                            Refund Credit
                                        </option>
                                    </select>
                                    @error('credit_type')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="expires_at">Ngày hết hạn</label>
                                    <input type="date" 
                                           class="form-control @error('expires_at') is-invalid @enderror" 
                                           id="expires_at" 
                                           name="expires_at" 
                                           value="{{ old('expires_at', date('Y-m-d', strtotime('+1 month'))) }}">
                                    @error('expires_at')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Để trống nếu không có ngày hết hạn. Mặc định: 1 tháng từ ngày hiện tại</small>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="notes">Ghi chú</label>
                            <textarea class="form-control @error('notes') is-invalid @enderror" 
                                      id="notes" name="notes" rows="3" 
                                      placeholder="Ghi chú về việc thêm credit này...">{{ old('notes') }}</textarea>
                            @error('notes')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Thêm Credit
                            </button>
                            <a href="{{ route('admin.user-credits.index') }}" class="btn btn-secondary">
                                <i class="fas fa-times"></i> Hủy
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card shadow mb-4">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-info">Hướng dẫn</h6>
                </div>
                <div class="card-body">
                    <h6>Loại Credit:</h6>
                    <ul class="small">
                        <li><strong>Free Credit:</strong> Credit miễn phí từ hệ thống</li>
                        <li><strong>Purchased Credit:</strong> Credit mua từ gói dịch vụ</li>
                        <li><strong>Bonus Credit:</strong> Credit thưởng từ admin</li>
                        <li><strong>Refund Credit:</strong> Credit hoàn trả</li>
                    </ul>
                    
                    <h6 class="mt-3">Lưu ý:</h6>
                    <ul class="small">
                        <li>Credit sẽ được thêm vào tài khoản người dùng ngay lập tức</li>
                        <li>Nếu không chọn ngày hết hạn, credit sẽ không bao giờ hết hạn</li>
                        <li>Gói dịch vụ là tùy chọn, có thể để trống</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
$(document).ready(function() {
    // Auto-fill credits when selecting a pricing plan
    $('#pricing_plan_id').change(function() {
        var selectedOption = $(this).find('option:selected');
        if (selectedOption.val()) {
            // You can add logic here to auto-fill credits based on plan
            // For now, we'll just focus the credits field
            $('#total_credits').focus();
        }
    });
});
</script>
@endsection