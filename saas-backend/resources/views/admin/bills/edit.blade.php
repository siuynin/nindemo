@extends('layouts.admin')

@section('title', 'Edit Bill #' . $bill->bill_number)

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">Edit Bill #{{ $bill->bill_number }}</h3>
                        <div>
                            <a href="{{ route('admin.bills.show', $bill) }}" class="btn btn-info mr-2">
                                <i class="fas fa-eye"></i> View Bill
                            </a>
                            <a href="{{ route('admin.bills.index') }}" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i> Back to Bills
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <form method="POST" action="{{ route('admin.bills.update', $bill) }}">
                        @csrf
                        @method('PUT')
                        
                        <div class="row">
                            <div class="col-md-6">
                                <!-- Bill Number (Read-only) -->
                                <div class="form-group">
                                    <label for="bill_number">Bill Number</label>
                                    <input type="text" id="bill_number" class="form-control" 
                                           value="{{ $bill->bill_number }}" readonly>
                                    <small class="form-text text-muted">Bill number cannot be changed</small>
                                </div>

                                <!-- User Selection -->
                                <div class="form-group">
                                    <label for="user_id" class="required">User <span class="text-danger">*</span></label>
                                    <select name="user_id" id="user_id" class="form-control select2 @error('user_id') is-invalid @enderror" required>
                                        <option value="">Select User</option>
                                        @foreach($users as $user)
                                            <option value="{{ $user->id }}" 
                                                {{ (old('user_id', $bill->user_id) == $user->id) ? 'selected' : '' }}>
                                                {{ $user->name }} ({{ $user->email }})
                                            </option>
                                        @endforeach
                                    </select>
                                    @error('user_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <!-- Pricing Plan -->
                                <div class="form-group">
                                    <label for="pricing_plan_id" class="required">Chọn gói <span class="text-danger">*</span></label>
                                    <select name="pricing_plan_id" id="pricing_plan_id" class="form-control select2 @error('pricing_plan_id') is-invalid @enderror" required>
                                        <option value="">-- Chọn gói --</option>
                                        @foreach($pricingPlans as $plan)
                                            @php
                                                $isSelected = old('pricing_plan_id') ? old('pricing_plan_id') == $plan->id : $bill->amount == $plan->price;
                                            @endphp
                                            <option value="{{ $plan->id }}" 
                                                    data-price="{{ $plan->price }}" 
                                                    data-credits="{{ $plan->credits ?? $plan->credits_included }}"
                                                    {{ $isSelected ? 'selected' : '' }}>
                                                {{ $plan->name }} - {{ number_format($plan->price) }}đ 
                                                ({{ number_format($plan->credits ?? $plan->credits_included) }} credits)
                                            </option>
                                        @endforeach
                                    </select>
                                    @error('pricing_plan_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <input type="hidden" name="amount" id="hidden_amount" value="{{ old('amount', $bill->amount) }}">
                                </div>

                                <!-- Description -->
                                <div class="form-group">
                                    <label for="description" class="required">Description <span class="text-danger">*</span></label>
                                    <textarea name="description" id="description" 
                                              class="form-control @error('description') is-invalid @enderror" 
                                              rows="3" required>{{ old('description', $bill->description) }}</textarea>
                                    @error('description')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <!-- Status -->
                                <div class="form-group">
                                    <label for="status" class="required">Status <span class="text-danger">*</span></label>
                                    <select name="status" id="status" class="form-control @error('status') is-invalid @enderror" required>
                                        <option value="pending" {{ old('status', $bill->status) == 'pending' ? 'selected' : '' }}>Pending</option>
                                        <option value="paid" {{ old('status', $bill->status) == 'paid' ? 'selected' : '' }}>Paid</option>
                                        <option value="failed" {{ old('status', $bill->status) == 'failed' ? 'selected' : '' }}>Failed</option>
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
                                           value="{{ old('due_date', $bill->due_date ? $bill->due_date->format('Y-m-d') : '') }}">
                                    @error('due_date')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Optional: Set a due date for this bill</small>
                                </div>

                                <!-- Bill Info -->
                                <div class="card bg-light">
                                    <div class="card-header">
                                        <h6 class="card-title mb-0">Bill Information</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-6">
                                                <small class="text-muted">Created:</small><br>
                                                <span>{{ $bill->created_at->format('M d, Y H:i') }}</span>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted">Updated:</small><br>
                                                <span>{{ $bill->updated_at->format('M d, Y H:i') }}</span>
                                            </div>
                                        </div>
                                        @if($bill->paid_at)
                                            <hr>
                                            <div>
                                                <small class="text-muted">Paid At:</small><br>
                                                <span class="text-success">{{ $bill->paid_at->format('M d, Y H:i') }}</span>
                                            </div>
                                        @endif
                                    </div>
                                </div>

                                <!-- Quick Actions -->
                                @if($bill->status == 'pending')
                                    <div class="card bg-warning">
                                        <div class="card-header">
                                            <h6 class="card-title mb-0">Quick Actions</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="btn-group-vertical w-100">
                                                <form method="POST" action="{{ route('admin.bills.mark-paid', $bill) }}" style="display: inline;">
                                                    @csrf
                                                    @method('PATCH')
                                                    <button type="submit" class="btn btn-success btn-sm mb-2" 
                                                            onclick="return confirm('Mark this bill as paid?')">
                                                        <i class="fas fa-check"></i> Mark as Paid
                                                    </button>
                                                </form>
                                                <form method="POST" action="{{ route('admin.bills.mark-failed', $bill) }}" style="display: inline;">
                                                    @csrf
                                                    @method('PATCH')
                                                    <button type="submit" class="btn btn-danger btn-sm" 
                                                            onclick="return confirm('Mark this bill as failed?')">
                                                        <i class="fas fa-times"></i> Mark as Failed
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                @endif
                            </div>
                        </div>

                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="form-group">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Update Bill
                                    </button>
                                    <a href="{{ route('admin.bills.show', $bill) }}" class="btn btn-info ml-2">
                                        <i class="fas fa-eye"></i> View Bill
                                    </a>
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
    
    // Update amount when pricing plan changes
    $('#pricing_plan_id').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const price = selectedOption.data('price') || 0;
        $('#hidden_amount').val(price);
    });
    
    // Initialize amount on page load
    const initialPlan = $('#pricing_plan_id').find('option:selected');
    if (initialPlan.length) {
        const initialPrice = initialPlan.data('price') || 0;
        $('#hidden_amount').val(initialPrice);
    }
    
    // Form validation
    $('form').on('submit', function(e) {
        let isValid = true;
        
        // Check required fields
        const requiredFields = ['user_id', 'amount', 'description', 'status'];
        requiredFields.forEach(function(field) {
            const value = $(`#${field}`).val();
            if (!value || value.trim() === '') {
                isValid = false;
                $(`#${field}`).addClass('is-invalid');
            } else {
                $(`#${field}`).removeClass('is-invalid');
            }
        });
        
        // Check amount is positive
        const amount = parseFloat($('#amount').val());
        if (amount <= 0) {
            isValid = false;
            $('#amount').addClass('is-invalid');
            toastr.error('Amount must be greater than 0');
        }
        
        if (!isValid) {
            e.preventDefault();
            toastr.error('Please fill in all required fields correctly');
        }
    });
    
    // Show success messages
    @if(session('success'))
        toastr.success('{{ session('success') }}');
    @endif
});
</script>
@endpush