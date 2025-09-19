@extends('admin.layouts.app')

@section('title', 'Add New Transaction')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">
                            <i class="fas fa-plus"></i> Add New Transaction
                        </h3>
                        <a href="{{ route('admin.transactions.index') }}" class="btn btn-secondary">
                            <i class="fas fa-arrow-left"></i> Back to Transactions
                        </a>
                    </div>
                </div>
                
                <div class="card-body">
                    <form method="POST" action="{{ route('admin.transactions.store') }}">
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
                                    <label for="pricing_plan_id" class="required">Pricing Plan <span class="text-danger">*</span></label>
                                    <select name="pricing_plan_id" id="pricing_plan_id" class="form-control @error('pricing_plan_id') is-invalid @enderror" required>
                                        <option value="">-- Select Plan --</option>
                                        @foreach($pricingPlans as $plan)
                                            <option value="{{ $plan->id }}" 
                                        data-price="{{ $plan->price }}" 
                                        data-credits="{{ $plan->credits }}"
                                        {{ old('pricing_plan_id') == $plan->id ? 'selected' : '' }}>
                                        {{ $plan->name }} - ${{ number_format($plan->price, 2) }} 
                                        ({{ number_format($plan->credits) }} credits)
                                    </option>
                                        @endforeach
                                    </select>
                                    @error('pricing_plan_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <!-- Payment Method -->
                                <div class="form-group">
                                    <label for="payment_method" class="required">Payment Method <span class="text-danger">*</span></label>
                                    <select name="payment_method" id="payment_method" class="form-control @error('payment_method') is-invalid @enderror" required>
                                        <option value="">Select Payment Method</option>
                                        <option value="paypal" {{ old('payment_method') == 'paypal' ? 'selected' : '' }}>
                                            <i class="fab fa-paypal"></i> PayPal
                                        </option>
                                        <option value="bank_transfer" {{ old('payment_method') == 'bank_transfer' ? 'selected' : '' }}>
                                            <i class="fas fa-university"></i> Bank Transfer (SePay)
                                        </option>
                                        <option value="credit_card" {{ old('payment_method') == 'credit_card' ? 'selected' : '' }}>
                                            <i class="fas fa-credit-card"></i> Credit Card
                                        </option>
                                    </select>
                                    @error('payment_method')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
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
                                    <small class="form-text text-muted">Describe what this transaction is for (e.g., Premium Plan Subscription, API Usage, etc.)</small>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <!-- Status -->
                                <div class="form-group">
                                    <label for="status" class="required">Status <span class="text-danger">*</span></label>
                                    <select name="status" id="status" class="form-control @error('status') is-invalid @enderror" required>
                                        <option value="pending" {{ old('status', 'pending') == 'pending' ? 'selected' : '' }}>
                                            <i class="fas fa-clock"></i> Pending
                                        </option>
                                        <option value="paid" {{ old('status') == 'paid' ? 'selected' : '' }}>
                                            <i class="fas fa-check"></i> Paid
                                        </option>
                                        <option value="failed" {{ old('status') == 'failed' ? 'selected' : '' }}>
                                            <i class="fas fa-times"></i> Failed
                                        </option>
                                    </select>
                                    @error('status')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>

                                <!-- Transaction ID -->
                                <div class="form-group">
                                    <label for="transaction_id">Transaction ID</label>
                                    <input type="text" name="transaction_id" id="transaction_id" 
                                           class="form-control @error('transaction_id') is-invalid @enderror" 
                                           value="{{ old('transaction_id') }}" 
                                           placeholder="External transaction ID (optional)">
                                    @error('transaction_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="form-text text-muted">Optional: External transaction ID from payment gateway</small>
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
                                    <small class="form-text text-muted">Optional: Set a due date for this transaction</small>
                                </div>

                                <!-- Amount Display -->
                                <div class="form-group">
                                    <label>Amount</label>
                                    <div class="form-control-plaintext">
                                        <span id="amount-display" class="h4 text-primary">$0.00</span>
                                        <small class="text-muted d-block">Amount will be set based on selected plan</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="row">
                            <div class="col-12">
                                <div class="form-group">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i> Create Transaction
                                    </button>
                                    <a href="{{ route('admin.transactions.index') }}" class="btn btn-secondary ml-2">
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

<!-- SePay Webhook Information Card -->
<div class="row mt-4">
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-info-circle"></i> SePay Webhook Information
                </h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <h6><i class="fas fa-link"></i> SePay Webhook URL:</h6>
                    <p class="mb-2">
                        <code>{{ config('app.url') }}/api/sepay/webhook</code>
                    </p>
                    <small class="text-muted">
                        Configure this URL in your SePay dashboard to receive payment notifications automatically.
                        <br>
                        <strong>Authentication:</strong> Use API Key or OAuth2 as configured in your SePay account.
                        <br>
                        <strong>Method:</strong> POST
                        <br>
                        <strong>Content-Type:</strong> application/json
                    </small>
                </div>
                
                <div class="alert alert-warning">
                    <h6><i class="fas fa-exclamation-triangle"></i> Important Notes:</h6>
                    <ul class="mb-0">
                        <li>Ensure your server can receive HTTPS requests from SePay</li>
                        <li>Webhook will automatically update transaction status when payment is received</li>
                        <li>Test webhook functionality in SePay dashboard before going live</li>
                        <li>Monitor webhook logs for any delivery failures</li>
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
    // Initialize Select2
    $('.select2').select2({
        theme: 'bootstrap4',
        placeholder: 'Select an option',
        allowClear: true
    });

    // Update amount display when plan is selected
    $('#pricing_plan_id').change(function() {
        var selectedOption = $(this).find('option:selected');
        var price = selectedOption.data('price');
        var credits = selectedOption.data('credits');
        
        if (price) {
            $('#amount-display').text('$' + parseFloat(price).toFixed(2));
        } else {
            $('#amount-display').text('$0.00');
        }
    });

    // Auto-generate description based on selected plan and payment method
    $('#pricing_plan_id, #payment_method').change(function() {
        var planName = $('#pricing_plan_id option:selected').text().split(' - ')[0];
        var paymentMethod = $('#payment_method option:selected').text();
        
        if (planName && paymentMethod && !$('#description').val()) {
            $('#description').val('Payment for ' + planName + ' via ' + paymentMethod);
        }
    });
});
</script>
@endsection