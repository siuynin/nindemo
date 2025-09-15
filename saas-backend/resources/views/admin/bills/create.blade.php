@extends('layouts.admin')

@section('title', 'Create New Bill')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">Create New Bill</h3>
                        <a href="{{ route('admin.bills.index') }}" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to Bills
                        </a>
                    </div>
                </div>
                
                <div class="card-body">
                    <form method="POST" action="{{ route('admin.bills.store') }}">
                        @csrf
                        
                        <div class="row">
                            <div class="col-md-6">
                                <!-- User Selection -->
                                <div class="form-group">
                                    <label for="user_id" class="required">User <span class="text-danger">*</span></label>
                                    <select name="user_id" id="user_id" class="form-control select2 @error('user_id') is-invalid @enderror" required>
                                        <option value="">Select User</option>
                                        @foreach($users as $user)
                                            <option value="{{ $user->id }}" {{ old('user_id') == $user->id ? 'selected' : '' }}>
                                                {{ $user->name }} ({{ $user->email }})
                                            </option>
                                        @endforeach
                                    </select>
                                    @error('user_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <!-- Pricing Plan Selection -->
                                <div class="form-group">
                                    <label for="pricing_plan_id" class="required">Chọn gói <span class="text-danger">*</span></label>
                                    <select name="pricing_plan_id" id="pricing_plan_id" class="form-control @error('pricing_plan_id') is-invalid @enderror" required>
                                        <option value="">-- Chọn gói --</option>
                                        @foreach($pricingPlans as $plan)
                                            <option value="{{ $plan->id }}" 
                                                    data-price="{{ $plan->price }}" 
                                                    data-credits="{{ $plan->credits ?? $plan->credits_included }}"
                                                    {{ old('pricing_plan_id') == $plan->id ? 'selected' : '' }}>
                                                {{ $plan->name }} - {{ number_format($plan->price) }}đ 
                                                ({{ number_format($plan->credits ?? $plan->credits_included) }} credits)
                                            </option>
                                        @endforeach
                                    </select>
                                    @error('pricing_plan_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <input type="hidden" name="amount" id="hidden_amount" value="{{ old('amount') }}">
                                </div>

                                <!-- Description -->
                                <div class="form-group">
                                    <label for="description" class="required">Description <span class="text-danger">*</span></label>
                                    <textarea name="description" id="description" 
                                              class="form-control @error('description') is-invalid @enderror" 
                                              rows="3" required>{{ old('description') }}</textarea>
                                    @error('description')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Describe what this bill is for (e.g., Premium Plan Subscription, API Usage, etc.)</small>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <!-- Status -->
                                <div class="form-group">
                                    <label for="status" class="required">Status <span class="text-danger">*</span></label>
                                    <select name="status" id="status" class="form-control @error('status') is-invalid @enderror" required>
                                        <option value="pending" {{ old('status', 'pending') == 'pending' ? 'selected' : '' }}>Pending</option>
                                        <option value="paid" {{ old('status') == 'paid' ? 'selected' : '' }}>Paid</option>
                                        <option value="failed" {{ old('status') == 'failed' ? 'selected' : '' }}>Failed</option>
                                    </select>
                                    @error('status')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <!-- Due Date -->
                                <div class="form-group">
                                    <label for="due_date">Due Date</label>
                                    <input type="date" name="due_date" id="due_date" 
                                           class="form-control @error('due_date') is-invalid @enderror" 
                                           value="{{ old('due_date') }}" 
                                           min="{{ date('Y-m-d', strtotime('+1 day')) }}">
                                    @error('due_date')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Optional: Set a due date for this bill</small>
                                </div>

                                <!-- Bill Preview -->
                                <div class="card bg-light">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Bill Preview</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6">
                                                <small class="text-muted">Bill Number:</small><br>
                                                <span id="preview-bill-number">Auto-generated</span>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted">Gói:</small><br>
                                                <span id="preview-plan">Chưa chọn</span>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted">Giá:</small><br>
                                                <span id="preview-amount">0đ</span>
                                            </div>
                                        </div>
                                        <hr>
                                        <div>
                                            <small class="text-muted">User:</small><br>
                                            <span id="preview-user">No user selected</span>
                                        </div>
                                        <div class="mt-2">
                                            <small class="text-muted">Description:</small><br>
                                            <span id="preview-description">No description</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="form-group">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Create Bill
                                    </button>
                                    <a href="{{ route('admin.bills.index') }}" class="btn btn-secondary ml-2">
                                        <i class="fas fa-times"></i> Cancel
                                    </a>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<style>
    .required {
        font-weight: 600;
    }
    .select2-container--default .select2-selection--single {
        height: 38px;
        border: 1px solid #ced4da;
    }
    .select2-container--default .select2-selection--single .select2-selection__rendered {
        line-height: 36px;
    }
</style>
@endpush

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
<script>
$(document).ready(function() {
    // Initialize Select2
    $('.select2').select2({
        placeholder: 'Select User',
        allowClear: true
    });
    
    // Real-time preview updates
    function updatePreview() {
        // Update pricing plan and amount
        const planId = $('#pricing_plan_id').val();
        const planOption = $('#pricing_plan_id option:selected');
        const planName = planId ? planOption.text() : 'Chưa chọn';
        const planPrice = planId ? planOption.data('price') : 0;
        
        $('#preview-plan').text(planName);
        $('#preview-amount').text(new Intl.NumberFormat('vi-VN').format(planPrice) + 'đ');
        
        // Update hidden amount field
        $('#hidden_amount').val(planPrice);
        
        // Update user
        const selectedUser = $('#user_id option:selected').text();
        $('#preview-user').text(selectedUser === 'Select User' ? 'No user selected' : selectedUser);
        
        // Update description
        const description = $('#description').val() || 'No description';
        $('#preview-description').text(description.length > 50 ? description.substring(0, 50) + '...' : description);
    }
    
    // Bind events for real-time preview
    $('#pricing_plan_id, #description').on('input change', updatePreview);
    $('#user_id').on('change', updatePreview);
    
    // Initial preview update
    updatePreview();
    
    // Form validation
    $('form').on('submit', function(e) {
        let isValid = true;
        
        // Check required fields
        const requiredFields = ['user_id', 'pricing_plan_id', 'description', 'status'];
        requiredFields.forEach(function(field) {
            const value = $(`#${field}`).val();
            if (!value || value.trim() === '') {
                isValid = false;
                $(`#${field}`).addClass('is-invalid');
            } else {
                $(`#${field}`).removeClass('is-invalid');
            }
        });
        
        // Check pricing plan is selected
        const planId = $('#pricing_plan_id').val();
        if (!planId) {
            isValid = false;
            $('#pricing_plan_id').addClass('is-invalid');
            toastr.error('Vui lòng chọn gói pricing plan');
        }
        
        if (!isValid) {
            e.preventDefault();
            toastr.error('Please fill in all required fields correctly');
        }
    });
});
</script>
@endpush