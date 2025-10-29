@extends('admin.layouts.app')

@section('title', 'Chỉnh sửa gói')

@section('content')
<div class="container-fluid">
    <!-- Page Heading -->
    <div class="d-sm-flex align-items-center justify-content-between mb-4">
        <h1 class="h3 mb-0 text-gray-800">Chỉnh sửa gói: {{ $pricingPlan->name }}</h1>
        <a href="{{ route('admin.pricing-plans.index') }}" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> Quay lại
        </a>
    </div>

    <div class="row">
        <div class="col-lg-8">
            <div class="card shadow mb-4">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Thông tin gói</h6>
                </div>
                <div class="card-body">
                    <form action="{{ route('admin.pricing-plans.update', $pricingPlan) }}" method="POST">
                        @csrf
                        @method('PUT')
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="name">Tên gói <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control @error('name') is-invalid @enderror" 
                                           id="name" name="name" value="{{ old('name', $pricingPlan->name) }}" required>
                                    @error('name')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="credits">Số credits <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control @error('credits') is-invalid @enderror" 
                                           id="credits" name="credits" value="{{ old('credits', $pricingPlan->credits) }}" min="1" required>
                                    @error('credits')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="price">Giá (VNĐ) <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control @error('price') is-invalid @enderror" 
                                           id="price" name="price" value="{{ old('price', $pricingPlan->price) }}" min="0" step="0.01" required>
                                    @error('price')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="billing_cycle">Chu kỳ thanh toán <span class="text-danger">*</span></label>
                                    <select class="form-control @error('billing_cycle') is-invalid @enderror" id="billing_cycle" name="billing_cycle" required>
                                        <option value="">Chọn chu kỳ thanh toán</option>
                                        <option value="monthly" {{ old('billing_cycle', $pricingPlan->billing_cycle) == 'monthly' ? 'selected' : '' }}>Hàng tháng</option>
                                        <option value="yearly" {{ old('billing_cycle', $pricingPlan->billing_cycle) == 'yearly' ? 'selected' : '' }}>Hàng năm</option>
                                        <option value="one_time" {{ old('billing_cycle', $pricingPlan->billing_cycle) == 'one_time' ? 'selected' : '' }}>Một lần</option>
                                    </select>
                                    @error('billing_cycle')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="max_voice_clone">Số lượng voice clone tối đa <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control @error('max_voice_clone') is-invalid @enderror" 
                                           id="max_voice_clone" name="max_voice_clone" value="{{ old('max_voice_clone', $pricingPlan->max_voice_clone ?? 0) }}" min="0" required>
                                    @error('max_voice_clone')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="sort_order">Thứ tự sắp xếp <span class="text-danger">*</span></label>
                                    <input type="number" class="form-control @error('sort_order') is-invalid @enderror" 
                                           id="sort_order" name="sort_order" value="{{ old('sort_order', $pricingPlan->sort_order ?? 0) }}" min="0" required>
                                    @error('sort_order')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label for="status">Trạng thái</label>
                                    <select class="form-control @error('status') is-invalid @enderror" id="status" name="status">
                                        <option value="active" {{ old('status', $pricingPlan->status) == 'active' ? 'selected' : '' }}>Kích hoạt</option>
                                        <option value="inactive" {{ old('status', $pricingPlan->status) == 'inactive' ? 'selected' : '' }}>Vô hiệu hóa</option>
                                    </select>
                                    @error('status')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <div class="form-check mt-4">
                                        <input type="checkbox" class="form-check-input" id="features" name="features" value="1" 
                                               {{ old('features', $pricingPlan->features) ? 'checked' : '' }}>
                                        <label class="form-check-label" for="features">
                                            Tính năng đặc biệt
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="description">Mô tả</label>
                            <textarea class="form-control @error('description') is-invalid @enderror" 
                                      id="description" name="description" rows="4">{{ old('description', $pricingPlan->description) }}</textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="form-group">
                            <label for="feature_list">Danh sách tính năng nổi bật</label>
                            <textarea class="form-control @error('feature_list') is-invalid @enderror" 
                                      id="feature_list" name="feature_list" rows="3" 
                                      placeholder="Nhập các tính năng nổi bật, mỗi tính năng trên một dòng">{{ old('feature_list', is_array($pricingPlan->feature_list) ? implode("\n", $pricingPlan->feature_list) : $pricingPlan->feature_list) }}</textarea>
                            @error('feature_list')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <small class="form-text text-muted">Mỗi tính năng trên một dòng. Ví dụ: Hỗ trợ 24/7, Tính năng cao cấp, Ưu đãi đặc biệt</small>
                        </div>

                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="is_popular" name="is_popular" value="1" 
                                       {{ old('is_popular', $pricingPlan->is_popular) ? 'checked' : '' }}>
                                <label class="form-check-label" for="is_popular">
                                    Gói phổ biến
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Cập nhật gói
                            </button>
                            <a href="{{ route('admin.pricing-plans.index') }}" class="btn btn-secondary">
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
                    <h6 class="m-0 font-weight-bold text-info">Thông tin hiện tại</h6>
                </div>
                <div class="card-body">
                    <table class="table table-borderless">
                        <tr>
                            <td><strong>ID:</strong></td>
                            <td>{{ $pricingPlan->id }}</td>
                        </tr>
                        <tr>
                            <td><strong>Người dùng:</strong></td>
                            <td><span class="badge bg-primary">{{ $pricingPlan->users_count ?? 0 }}</span></td>
                        </tr>
                        <tr>
                            <td><strong>Giá/Credit:</strong></td>
                            <td>{{ $pricingPlan->credits > 0 ? number_format($pricingPlan->price / $pricingPlan->credits, 2) : 0 }}đ</td>
                        </tr>
                        <tr>
                            <td><strong>Ngày tạo:</strong></td>
                            <td>{{ $pricingPlan->created_at->format('d/m/Y H:i') }}</td>
                        </tr>
                        <tr>
                            <td><strong>Cập nhật:</strong></td>
                            <td>{{ $pricingPlan->updated_at->format('d/m/Y H:i') }}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="card shadow mb-4">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-warning">Lưu ý</h6>
                </div>
                <div class="card-body">
                    <ul class="list-unstyled text-sm">
                        <li><i class="fas fa-exclamation-triangle text-warning"></i> Thay đổi giá sẽ không ảnh hưởng đến các giao dịch đã hoàn thành</li>
                        <li><i class="fas fa-users text-info"></i> Hiện có {{ $pricingPlan->users_count ?? 0 }} người dùng sử dụng gói này</li>
                        <li><i class="fas fa-clock text-secondary"></i> Thay đổi sẽ có hiệu lực ngay lập tức</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection