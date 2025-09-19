@extends('layouts.admin')

@section('title', 'Transaction Details #' . $transaction->bill_number)

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">Transaction Details #{{ $transaction->bill_number }}</h3>
                        <div>
                            @if($transaction->status == 'pending')
                                <form method="POST" action="{{ route('admin.bills.mark-paid', $transaction) }}" style="display: inline;">
                                    @csrf
                                    @method('PATCH')
                                    <button type="submit" class="btn btn-success mr-2" 
                                            onclick="return confirm('Mark this transaction as paid?')">
                                        <i class="fas fa-check"></i> Mark as Paid
                                    </button>
                                </form>
                                
                                <form method="POST" action="{{ route('admin.bills.mark-failed', $transaction) }}" style="display: inline;">
                                    @csrf
                                    @method('PATCH')
                                    <button type="submit" class="btn btn-danger mr-2" 
                                            onclick="return confirm('Mark this transaction as failed?')">
                                        <i class="fas fa-times"></i> Mark as Failed
                                    </button>
                                </form>
                            @endif
                            
                            <a href="{{ route('admin.transactions.index') }}" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i> Back to Transactions
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="row">
                        <!-- Transaction Information -->
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-exchange-alt"></i> Transaction Information
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="font-weight-bold">Transaction Number:</label>
                                                <p class="mb-2">{{ $transaction->bill_number }}</p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Amount:</label>
                                                <p class="mb-2">
                                                    <span class="h4 text-primary">${{ number_format($transaction->amount, 2) }}</span>
                                                    <small class="text-muted">{{ strtoupper($transaction->currency ?? 'USD') }}</small>
                                                </p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Status:</label>
                                                <p class="mb-2">
                                                    @if($transaction->status == 'paid')
                                                        <span class="badge badge-success badge-lg">
                                                            <i class="fas fa-check"></i> Paid
                                                        </span>
                                                    @elseif($transaction->status == 'pending')
                                                        <span class="badge badge-warning badge-lg">
                                                            <i class="fas fa-clock"></i> Pending
                                                        </span>
                                                    @else
                                                        <span class="badge badge-danger badge-lg">
                                                            <i class="fas fa-times"></i> Failed
                                                        </span>
                                                    @endif
                                                </p>
                                            </div>

                                            <div class="form-group">
                                                <label class="font-weight-bold">Payment Method:</label>
                                                <p class="mb-2">
                                                    @if($transaction->payment_method == 'paypal')
                                                        <span class="badge badge-primary">
                                                            <i class="fab fa-paypal"></i> PayPal
                                                        </span>
                                                    @elseif($transaction->payment_method == 'bank_transfer')
                                                        <span class="badge badge-success">
                                                            <i class="fas fa-university"></i> Bank Transfer (SePay)
                                                        </span>
                                                    @elseif($transaction->payment_method == 'credit_card')
                                                        <span class="badge badge-warning">
                                                            <i class="fas fa-credit-card"></i> Credit Card
                                                        </span>
                                                    @else
                                                        <span class="badge badge-secondary">{{ ucfirst($transaction->payment_method ?? 'Unknown') }}</span>
                                                    @endif
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="font-weight-bold">Due Date:</label>
                                                <p class="mb-2">
                                                    @if($transaction->due_date)
                                                        {{ $transaction->due_date->format('F d, Y') }}
                                                        @if($transaction->due_date->isPast() && $transaction->status == 'pending')
                                                            <br><small class="text-danger">
                                                                <i class="fas fa-exclamation-triangle"></i> Overdue by {{ $transaction->due_date->diffForHumans() }}
                                                            </small>
                                                        @endif
                                                    @else
                                                        <span class="text-muted">No due date set</span>
                                                    @endif
                                                </p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Created:</label>
                                                <p class="mb-2">{{ $transaction->created_at->format('F d, Y H:i') }}</p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Last Updated:</label>
                                                <p class="mb-2">{{ $transaction->updated_at->format('F d, Y H:i') }}</p>
                                            </div>
                                            
                                            @if($transaction->paid_at)
                                                <div class="form-group">
                                                    <label class="font-weight-bold">Paid At:</label>
                                                    <p class="mb-2 text-success">
                                                        <i class="fas fa-check-circle"></i> {{ $transaction->paid_at->format('F d, Y H:i') }}
                                                    </p>
                                                </div>
                                            @endif
                                        </div>
                                    </div>

                                    <!-- Description -->
                                    <div class="form-group">
                                        <label class="font-weight-bold">Description:</label>
                                        <p class="mb-2">{{ $transaction->description ?? 'No description provided' }}</p>
                                    </div>

                                    <!-- Transaction IDs -->
                                    @if($transaction->transaction_id || $transaction->paypal_order_id || $transaction->paypal_capture_id)
                                        <div class="form-group">
                                            <label class="font-weight-bold">Transaction IDs:</label>
                                            <div class="row">
                                                @if($transaction->transaction_id)
                                                    <div class="col-md-4">
                                                        <small class="text-muted">Transaction ID:</small>
                                                        <br>
                                                        <code>{{ $transaction->transaction_id }}</code>
                                                    </div>
                                                @endif
                                                @if($transaction->paypal_order_id)
                                                    <div class="col-md-4">
                                                        <small class="text-muted">PayPal Order ID:</small>
                                                        <br>
                                                        <code>{{ $transaction->paypal_order_id }}</code>
                                                    </div>
                                                @endif
                                                @if($transaction->paypal_capture_id)
                                                    <div class="col-md-4">
                                                        <small class="text-muted">PayPal Capture ID:</small>
                                                        <br>
                                                        <code>{{ $transaction->paypal_capture_id }}</code>
                                                    </div>
                                                @endif
                                            </div>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        </div>

                        <!-- User & Plan Information -->
                        <div class="col-md-4">
                            <!-- User Information -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-user"></i> User Information
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="text-center mb-3">
                                        <div class="avatar-circle bg-primary text-white mx-auto mb-2" style="width: 60px; height: 60px; line-height: 60px; border-radius: 50%; font-size: 24px;">
                                            {{ strtoupper(substr($transaction->user->name, 0, 1)) }}
                                        </div>
                                        <h6 class="mb-1">{{ $transaction->user->name }}</h6>
                                        <small class="text-muted">{{ $transaction->user->email }}</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="font-weight-bold">User ID:</label>
                                        <p class="mb-2">{{ $transaction->user->id }}</p>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="font-weight-bold">Role:</label>
                                        <p class="mb-2">
                                            <span class="badge badge-info">{{ ucfirst($transaction->user->role) }}</span>
                                        </p>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="font-weight-bold">Current Credits:</label>
                                        <p class="mb-2">
                                            <span class="badge badge-success">{{ number_format($transaction->user->credits ?? 0) }} credits</span>
                                        </p>
                                    </div>
                                    
                                    <a href="{{ route('admin.users.show', $transaction->user) }}" class="btn btn-sm btn-outline-primary btn-block">
                                        <i class="fas fa-eye"></i> View User Details
                                    </a>
                                </div>
                            </div>

                            <!-- Plan Information -->
                            @if($transaction->pricingPlan)
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">
                                            <i class="fas fa-box"></i> Plan Information
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="form-group">
                                            <label class="font-weight-bold">Plan Name:</label>
                                            <p class="mb-2">{{ $transaction->pricingPlan->name }}</p>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="font-weight-bold">Plan Price:</label>
                                            <p class="mb-2">${{ number_format($transaction->pricingPlan->price, 2) }}</p>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="font-weight-bold">Credits Included:</label>
                                            <p class="mb-2">{{ number_format($transaction->pricingPlan->credits ?? $transaction->pricingPlan->credits_included ?? 0) }} credits</p>
                                        </div>
                                        
                                        @if($transaction->pricingPlan->description)
                                            <div class="form-group">
                                                <label class="font-weight-bold">Description:</label>
                                                <p class="mb-2 small">{{ $transaction->pricingPlan->description }}</p>
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            @endif
                        </div>
                    </div>

                    <!-- PayPal Response Data -->
                    @if($transaction->paypal_response)
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">
                                            <i class="fab fa-paypal"></i> PayPal Response Data
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <pre class="bg-light p-3 rounded"><code>{{ json_encode($transaction->paypal_response, JSON_PRETTY_PRINT) }}</code></pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif

                    <!-- SePay Webhook Information -->
                    @if($transaction->payment_method == 'bank_transfer')
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">
                                            <i class="fas fa-university"></i> SePay Integration Information
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="alert alert-info">
                                            <h6><i class="fas fa-link"></i> SePay Webhook URL:</h6>
                                            <p class="mb-2">
                                                <code>{{ config('app.url') }}/api/sepay/webhook</code>
                                            </p>
                                            <small class="text-muted">
                                                This URL should be configured in your SePay dashboard to receive payment notifications.
                                            </small>
                                        </div>
                                        
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6>Bank Transfer Details:</h6>
                                                <ul class="list-unstyled">
                                                    <li><strong>Bank:</strong> Vietcombank</li>
                                                    <li><strong>Account Number:</strong> 1234567890</li>
                                                    <li><strong>Account Name:</strong> CONG TY AI APP</li>
                                                    <li><strong>Transfer Content:</strong> SE{{ $transaction->id }}</li>
                                                </ul>
                                            </div>
                                            <div class="col-md-6">
                                                <h6>Webhook Configuration:</h6>
                                                <ul class="list-unstyled">
                                                    <li><strong>Method:</strong> POST</li>
                                                    <li><strong>Content-Type:</strong> application/json</li>
                                                    <li><strong>Authentication:</strong> API Key / OAuth2</li>
                                                    <li><strong>Timeout:</strong> 30 seconds</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
$(document).ready(function() {
    // Auto-refresh page every 30 seconds for pending transactions
    @if($transaction->status == 'pending')
        setInterval(function() {
            location.reload();
        }, 30000);
    @endif
});
</script>
@endsection