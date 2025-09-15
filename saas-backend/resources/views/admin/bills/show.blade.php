@extends('layouts.admin')

@section('title', 'Bill Details #' . $bill->bill_number)

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">Bill Details #{{ $bill->bill_number }}</h3>
                        <div>
                            <a href="{{ route('admin.bills.edit', $bill) }}" class="btn btn-warning mr-2">
                                <i class="fas fa-edit"></i> Edit Bill
                            </a>
                            <a href="{{ route('admin.bills.index') }}" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i> Back to Bills
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="row">
                        <!-- Bill Information -->
                        <div class="col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-file-invoice"></i> Bill Information
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="font-weight-bold">Bill Number:</label>
                                                <p class="mb-2">{{ $bill->bill_number }}</p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Amount:</label>
                                                <p class="mb-2">
                                                    <span class="h4 text-primary">${{ number_format($bill->amount, 2) }}</span>
                                                </p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Status:</label>
                                                <p class="mb-2">
                                                    @if($bill->status == 'paid')
                                                        <span class="badge badge-success badge-lg">
                                                            <i class="fas fa-check"></i> Paid
                                                        </span>
                                                    @elseif($bill->status == 'pending')
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
                                        </div>
                                        
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label class="font-weight-bold">Due Date:</label>
                                                <p class="mb-2">
                                                    @if($bill->due_date)
                                                        {{ $bill->due_date->format('F d, Y') }}
                                                        @if($bill->due_date->isPast() && $bill->status == 'pending')
                                                            <br><small class="text-danger">
                                                                <i class="fas fa-exclamation-triangle"></i> Overdue by {{ $bill->due_date->diffForHumans() }}
                                                            </small>
                                                        @endif
                                                    @else
                                                        <span class="text-muted">No due date set</span>
                                                    @endif
                                                </p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Created:</label>
                                                <p class="mb-2">{{ $bill->created_at->format('F d, Y H:i') }}</p>
                                            </div>
                                            
                                            <div class="form-group">
                                                <label class="font-weight-bold">Last Updated:</label>
                                                <p class="mb-2">{{ $bill->updated_at->format('F d, Y H:i') }}</p>
                                            </div>
                                            
                                            @if($bill->paid_at)
                                                <div class="form-group">
                                                    <label class="font-weight-bold">Paid At:</label>
                                                    <p class="mb-2 text-success">
                                                        <i class="fas fa-check-circle"></i> {{ $bill->paid_at->format('F d, Y H:i') }}
                                                    </p>
                                                </div>
                                            @endif
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="font-weight-bold">Description:</label>
                                        <div class="border p-3 bg-light rounded">
                                            {{ $bill->description }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                            
                            <!-- Pricing Plan Information -->
                            @if($bill->pricingPlan)
                            <div class="col-md-12 mb-3">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="card-title mb-0">
                                            <i class="fas fa-tags"></i> Pricing Plan Information
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row">
                                            <div class="col-md-3">
                                                <div class="form-group">
                                                    <label class="font-weight-bold">Plan Name:</label>
                                                    <p class="mb-2">{{ $bill->pricingPlan->name }}</p>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-group">
                                                    <label class="font-weight-bold">Plan Price:</label>
                                                    <p class="mb-2">${{ number_format($bill->pricingPlan->price, 2) }}</p>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-group">
                                                    <label class="font-weight-bold">Credits Included:</label>
                                                    <p class="mb-2">{{ number_format($bill->pricingPlan->credits_included) }} credits</p>
                                                </div>
                                            </div>
                                            <div class="col-md-3">
                                                <div class="form-group">
                                                    <label class="font-weight-bold">Billing Cycle:</label>
                                                    <p class="mb-2">{{ ucfirst($bill->pricingPlan->billing_cycle) }}</p>
                                                </div>
                                            </div>
                                        </div>
                                        @if($bill->pricingPlan->description)
                                        <div class="form-group">
                                            <label class="font-weight-bold">Plan Description:</label>
                                            <div class="border p-3 bg-light rounded">
                                                {{ $bill->pricingPlan->description }}
                                            </div>
                                        </div>
                                        @endif
                                    </div>
                                </div>
                            </div>
                            @endif
                            
                            <!-- User Information & Actions -->
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
                                        <div class="avatar-lg mx-auto mb-2">
                                            <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                                <i class="fas fa-user fa-2x text-white"></i>
                                            </div>
                                        </div>
                                        <h5 class="mb-1">{{ $bill->user->name }}</h5>
                                        <p class="text-muted mb-0">{{ $bill->user->email }}</p>
                                    </div>
                                    
                                    <div class="border-top pt-3">
                                        <div class="row text-center">
                                            <div class="col-6">
                                                <small class="text-muted">User ID</small>
                                                <div class="font-weight-bold">{{ $bill->user->id }}</div>
                                            </div>
                                            <div class="col-6">
                                                <small class="text-muted">Member Since</small>
                                                <div class="font-weight-bold">{{ $bill->user->created_at->format('M Y') }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="card-title mb-0">
                                        <i class="fas fa-cogs"></i> Quick Actions
                                    </h5>
                                </div>
                                <div class="card-body">
                                    <div class="d-grid gap-2">
                                        <a href="{{ route('admin.bills.edit', $bill) }}" class="btn btn-warning btn-block">
                                            <i class="fas fa-edit"></i> Edit Bill
                                        </a>
                                        
                                        @if($bill->status == 'pending')
                                            <form method="POST" action="{{ route('admin.bills.mark-paid', $bill) }}">
                                                @csrf
                                                @method('PATCH')
                                                <button type="submit" class="btn btn-success btn-block" 
                                                        onclick="return confirm('Mark this bill as paid?')">
                                                    <i class="fas fa-check"></i> Mark as Paid
                                                </button>
                                            </form>
                                            
                                            <form method="POST" action="{{ route('admin.bills.mark-failed', $bill) }}">
                                                @csrf
                                                @method('PATCH')
                                                <button type="submit" class="btn btn-danger btn-block" 
                                                        onclick="return confirm('Mark this bill as failed?')">
                                                    <i class="fas fa-times"></i> Mark as Failed
                                                </button>
                                            </form>
                                        @endif
                                        
                                        <div class="dropdown">
                                            <button class="btn btn-secondary btn-block dropdown-toggle" type="button" 
                                                    data-toggle="dropdown" aria-expanded="false">
                                                <i class="fas fa-ellipsis-h"></i> More Actions
                                            </button>
                                            <div class="dropdown-menu w-100">
                                                <a class="dropdown-item" href="{{ route('admin.bills.create') }}">
                                                    <i class="fas fa-plus"></i> Create New Bill
                                                </a>
                                                <a class="dropdown-item" href="{{ route('admin.bills.index', ['search' => $bill->user->email]) }}">
                                                    <i class="fas fa-search"></i> View User's Bills
                                                </a>
                                                <div class="dropdown-divider"></div>
                                                <form method="POST" action="{{ route('admin.bills.destroy', $bill) }}" 
                                                      style="display: inline;">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="dropdown-item text-danger" 
                                                            onclick="return confirm('Are you sure you want to delete this bill? This action cannot be undone.')">
                                                        <i class="fas fa-trash"></i> Delete Bill
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Bill Statistics -->
                            @if($bill->status == 'paid')
                                <div class="card mt-3">
                                    <div class="card-header bg-success text-white">
                                        <h5 class="card-title mb-0">
                                            <i class="fas fa-chart-line"></i> Payment Info
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="text-center">
                                            <div class="mb-2">
                                                <i class="fas fa-check-circle fa-3x text-success"></i>
                                            </div>
                                            <h6 class="text-success">Payment Completed</h6>
                                            <p class="text-muted mb-0">
                                                Paid {{ $bill->paid_at->diffForHumans() }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            @elseif($bill->status == 'pending' && $bill->due_date && $bill->due_date->isPast())
                                <div class="card mt-3">
                                    <div class="card-header bg-danger text-white">
                                        <h5 class="card-title mb-0">
                                            <i class="fas fa-exclamation-triangle"></i> Overdue
                                        </h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="text-center">
                                            <div class="mb-2">
                                                <i class="fas fa-clock fa-3x text-danger"></i>
                                            </div>
                                            <h6 class="text-danger">Payment Overdue</h6>
                                            <p class="text-muted mb-0">
                                                Due {{ $bill->due_date->diffForHumans() }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            @endif
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
    .badge-lg {
        font-size: 0.9rem;
        padding: 0.5rem 0.75rem;
    }
    .avatar-lg {
        width: 60px;
        height: 60px;
    }
    .d-grid {
        display: grid;
    }
    .gap-2 {
        gap: 0.5rem;
    }
</style>
@endpush

@push('scripts')
<script>
$(document).ready(function() {
    // Show success messages
    @if(session('success'))
        toastr.success('{{ session('success') }}');
    @endif
    
    // Auto-refresh page every 30 seconds if bill is pending
    @if($bill->status == 'pending')
        setTimeout(function() {
            location.reload();
        }, 30000);
    @endif
});
</script>
@endpush