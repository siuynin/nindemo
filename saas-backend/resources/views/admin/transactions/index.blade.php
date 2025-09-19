@extends('layouts.admin')

@section('title', 'Transaction Management')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">
                            <i class="fas fa-exchange-alt"></i> Transaction Management
                        </h3>
                        <a href="{{ route('admin.transactions.create') }}" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Add New Transaction
                        </a>
                    </div>
                </div>
                
                <div class="card-body">
                    <!-- Search and Filter Form -->
                    <form method="GET" action="{{ route('admin.transactions.index') }}" class="mb-4">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="search">Search</label>
                                    <input type="text" name="search" id="search" class="form-control" 
                                           placeholder="Bill number, transaction ID, user..." 
                                           value="{{ request('search') }}">
                                </div>
                            </div>
                            
                            <div class="col-md-2">
                                <div class="form-group">
                                    <label for="status">Status</label>
                                    <select name="status" id="status" class="form-control">
                                        <option value="">All Status</option>
                                        <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                                        <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>Paid</option>
                                        <option value="failed" {{ request('status') == 'failed' ? 'selected' : '' }}>Failed</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="col-md-2">
                                <div class="form-group">
                                    <label for="payment_method">Payment Method</label>
                                    <select name="payment_method" id="payment_method" class="form-control">
                                        <option value="">All Methods</option>
                                        <option value="paypal" {{ request('payment_method') == 'paypal' ? 'selected' : '' }}>PayPal</option>
                                        <option value="bank_transfer" {{ request('payment_method') == 'bank_transfer' ? 'selected' : '' }}>Bank Transfer</option>
                                        <option value="credit_card" {{ request('payment_method') == 'credit_card' ? 'selected' : '' }}>Credit Card</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="col-md-2">
                                <div class="form-group">
                                    <label for="date_from">From Date</label>
                                    <input type="date" name="date_from" id="date_from" class="form-control" 
                                           value="{{ request('date_from') }}">
                                </div>
                            </div>
                            
                            <div class="col-md-2">
                                <div class="form-group">
                                    <label for="date_to">To Date</label>
                                    <input type="date" name="date_to" id="date_to" class="form-control" 
                                           value="{{ request('date_to') }}">
                                </div>
                            </div>
                            
                            <div class="col-md-1">
                                <div class="form-group">
                                    <label>&nbsp;</label>
                                    <div>
                                        <button type="submit" class="btn btn-info btn-block">
                                            <i class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    <!-- Transactions Table -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Bill Number</th>
                                    <th>User</th>
                                    <th>Plan</th>
                                    <th>Amount</th>
                                    <th>Payment Method</th>
                                    <th>Status</th>
                                    <th>Transaction ID</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($transactions as $transaction)
                                    <tr>
                                        <td>{{ $transaction->id }}</td>
                                        <td>
                                            <strong>{{ $transaction->bill_number }}</strong>
                                        </td>
                                        <td>
                                            <div>
                                                <strong>{{ $transaction->user->name }}</strong>
                                                <br>
                                                <small class="text-muted">{{ $transaction->user->email }}</small>
                                            </div>
                                        </td>
                                        <td>
                                            @if($transaction->pricingPlan)
                                                <span class="badge badge-info">{{ $transaction->pricingPlan->name }}</span>
                                            @else
                                                <span class="text-muted">No Plan</span>
                                            @endif
                                        </td>
                                        <td>
                                            <strong>${{ number_format($transaction->amount, 2) }}</strong>
                                            <br>
                                            <small class="text-muted">{{ strtoupper($transaction->currency ?? 'USD') }}</small>
                                        </td>
                                        <td>
                                            @if($transaction->payment_method == 'paypal')
                                                <span class="badge badge-primary">
                                                    <i class="fab fa-paypal"></i> PayPal
                                                </span>
                                            @elseif($transaction->payment_method == 'bank_transfer')
                                                <span class="badge badge-success">
                                                    <i class="fas fa-university"></i> Bank Transfer
                                                </span>
                                            @elseif($transaction->payment_method == 'credit_card')
                                                <span class="badge badge-warning">
                                                    <i class="fas fa-credit-card"></i> Credit Card
                                                </span>
                                            @else
                                                <span class="badge badge-secondary">{{ ucfirst($transaction->payment_method ?? 'Unknown') }}</span>
                                            @endif
                                        </td>
                                        <td>
                                            @if($transaction->status == 'paid')
                                                <span class="badge badge-success">
                                                    <i class="fas fa-check"></i> Paid
                                                </span>
                                            @elseif($transaction->status == 'pending')
                                                <span class="badge badge-warning">
                                                    <i class="fas fa-clock"></i> Pending
                                                </span>
                                            @else
                                                <span class="badge badge-danger">
                                                    <i class="fas fa-times"></i> Failed
                                                </span>
                                            @endif
                                        </td>
                                        <td>
                                            @if($transaction->transaction_id)
                                                <code>{{ Str::limit($transaction->transaction_id, 15) }}</code>
                                            @elseif($transaction->paypal_capture_id)
                                                <code>{{ Str::limit($transaction->paypal_capture_id, 15) }}</code>
                                            @else
                                                <span class="text-muted">-</span>
                                            @endif
                                        </td>
                                        <td>
                                            <div>
                                                {{ $transaction->created_at->format('M d, Y') }}
                                                <br>
                                                <small class="text-muted">{{ $transaction->created_at->format('H:i') }}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <a href="{{ route('admin.transactions.show', $transaction->id) }}" 
                                                   class="btn btn-sm btn-info" title="View Details">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                
                                                @if($transaction->status == 'pending')
                                                    <form method="POST" action="{{ route('admin.bills.mark-paid', $transaction) }}" 
                                                          style="display: inline;">
                                                        @csrf
                                                        @method('PATCH')
                                                        <button type="submit" class="btn btn-sm btn-success" 
                                                                title="Mark as Paid"
                                                                onclick="return confirm('Mark this transaction as paid?')">
                                                            <i class="fas fa-check"></i>
                                                        </button>
                                                    </form>
                                                    
                                                    <form method="POST" action="{{ route('admin.bills.mark-failed', $transaction) }}" 
                                                          style="display: inline;">
                                                        @csrf
                                                        @method('PATCH')
                                                        <button type="submit" class="btn btn-sm btn-danger" 
                                                                title="Mark as Failed"
                                                                onclick="return confirm('Mark this transaction as failed?')">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </form>
                                                @endif
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="10" class="text-center text-muted py-4">
                                            <i class="fas fa-inbox fa-3x mb-3"></i>
                                            <br>
                                            No transactions found.
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    @if($transactions->hasPages())
                        <div class="d-flex justify-content-center">
                            {{ $transactions->appends(request()->query())->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Transaction Summary Cards -->
<div class="row mt-4">
    <div class="col-md-3">
        <div class="card bg-info">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="text-white">{{ $transactions->where('status', 'paid')->count() }}</h4>
                        <p class="text-white mb-0">Paid Transactions</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-check-circle fa-2x text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="card bg-warning">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="text-white">{{ $transactions->where('status', 'pending')->count() }}</h4>
                        <p class="text-white mb-0">Pending Transactions</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-clock fa-2x text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="card bg-danger">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="text-white">{{ $transactions->where('status', 'failed')->count() }}</h4>
                        <p class="text-white mb-0">Failed Transactions</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-times-circle fa-2x text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-md-3">
        <div class="card bg-success">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h4 class="text-white">${{ number_format($transactions->where('status', 'paid')->sum('amount'), 2) }}</h4>
                        <p class="text-white mb-0">Total Revenue</p>
                    </div>
                    <div class="align-self-center">
                        <i class="fas fa-dollar-sign fa-2x text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
$(document).ready(function() {
    // Auto-submit form when filters change
    $('#status, #payment_method').change(function() {
        $(this).closest('form').submit();
    });
});
</script>
@endsection