@extends('layouts.admin')

@section('title', 'Bills Management')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="card-title">Bills Management</h3>
                        <a href="{{ route('admin.bills.create') }}" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Create New Bill
                        </a>
                    </div>
                </div>
                
                <div class="card-body">
                    <!-- Search and Filter Form -->
                    <form method="GET" action="{{ route('admin.bills.index') }}" class="mb-4">
                        <div class="row">
                            <div class="col-md-3">
                                <input type="text" name="search" class="form-control" 
                                       placeholder="Search by bill number, description, user..." 
                                       value="{{ request('search') }}">
                            </div>
                            <div class="col-md-2">
                                <select name="status" class="form-control">
                                    <option value="">All Status</option>
                                    <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                                    <option value="paid" {{ request('status') == 'paid' ? 'selected' : '' }}>Paid</option>
                                    <option value="failed" {{ request('status') == 'failed' ? 'selected' : '' }}>Failed</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="date" name="date_from" class="form-control" 
                                       placeholder="From Date" value="{{ request('date_from') }}">
                            </div>
                            <div class="col-md-2">
                                <input type="date" name="date_to" class="form-control" 
                                       placeholder="To Date" value="{{ request('date_to') }}">
                            </div>
                            <div class="col-md-3">
                                <button type="submit" class="btn btn-info mr-2">
                                    <i class="fas fa-search"></i> Search
                                </button>
                                <a href="{{ route('admin.bills.index') }}" class="btn btn-secondary">
                                    <i class="fas fa-times"></i> Clear
                                </a>
                            </div>
                        </div>
                    </form>

                    <!-- Bills Table -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead>
                                <tr>
                                    <th>Bill Number</th>
                                    <th>User</th>
                                    <th>Pricing Plan</th>
                                    <th>Amount</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Due Date</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($bills as $bill)
                                    <tr>
                                        <td>
                                            <strong>{{ $bill->bill_number }}</strong>
                                        </td>
                                        <td>
                                            <div>
                                                <strong>{{ $bill->user->name }}</strong><br>
                                                <small class="text-muted">{{ $bill->user->email }}</small>
                                            </div>
                                        </td>
                                        <td>
                                            @if($bill->pricingPlan)
                                                <div>
                                                    <strong>{{ $bill->pricingPlan->name }}</strong><br>
                                                    <small class="text-muted">{{ number_format($bill->pricingPlan->credits_included) }} credits</small>
                                                </div>
                                            @else
                                                <span class="text-muted">No plan</span>
                                            @endif
                                        </td>
                                        <td>
                                            <span class="font-weight-bold">${{ number_format($bill->amount, 2) }}</span>
                                        </td>
                                        <td>{{ Str::limit($bill->description, 50) }}</td>
                                        <td>
                                            @if($bill->status == 'paid')
                                                <span class="badge badge-success">Paid</span>
                                            @elseif($bill->status == 'pending')
                                                <span class="badge badge-warning">Pending</span>
                                            @else
                                                <span class="badge badge-danger">Failed</span>
                                            @endif
                                        </td>
                                        <td>
                                            @if($bill->due_date)
                                                {{ $bill->due_date->format('M d, Y') }}
                                                @if($bill->due_date->isPast() && $bill->status == 'pending')
                                                    <br><small class="text-danger">Overdue</small>
                                                @endif
                                            @else
                                                <span class="text-muted">No due date</span>
                                            @endif
                                        </td>
                                        <td>{{ $bill->created_at->format('M d, Y H:i') }}</td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <a href="{{ route('admin.bills.show', $bill) }}" 
                                                   class="btn btn-sm btn-info" title="View">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="{{ route('admin.bills.edit', $bill) }}" 
                                                   class="btn btn-sm btn-warning" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </a>
                                                @if($bill->status == 'pending')
                                                    <form method="POST" action="{{ route('admin.bills.mark-paid', $bill) }}" 
                                                          style="display: inline;">
                                                        @csrf
                                                        @method('PATCH')
                                                        <button type="submit" class="btn btn-sm btn-success" 
                                                                title="Mark as Paid" 
                                                                onclick="return confirm('Mark this bill as paid?')">
                                                            <i class="fas fa-check"></i>
                                                        </button>
                                                    </form>
                                                    <form method="POST" action="{{ route('admin.bills.mark-failed', $bill) }}" 
                                                          style="display: inline;">
                                                        @csrf
                                                        @method('PATCH')
                                                        <button type="submit" class="btn btn-sm btn-danger" 
                                                                title="Mark as Failed" 
                                                                onclick="return confirm('Mark this bill as failed?')">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </form>
                                                @endif
                                                <form method="POST" action="{{ route('admin.bills.destroy', $bill) }}" 
                                                      style="display: inline;">
                                                    @csrf
                                                    @method('DELETE')
                                                    <button type="submit" class="btn btn-sm btn-danger" 
                                                            title="Delete" 
                                                            onclick="return confirm('Are you sure you want to delete this bill?')">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="8" class="text-center">
                                            <div class="py-4">
                                                <i class="fas fa-file-invoice fa-3x text-muted mb-3"></i>
                                                <h5 class="text-muted">No bills found</h5>
                                                <p class="text-muted">There are no bills matching your criteria.</p>
                                                <a href="{{ route('admin.bills.create') }}" class="btn btn-primary">
                                                    <i class="fas fa-plus"></i> Create First Bill
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    @if($bills->hasPages())
                        <div class="d-flex justify-content-center">
                            {{ $bills->appends(request()->query())->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
    // Auto-submit form on status change
    $('select[name="status"]').on('change', function() {
        $(this).closest('form').submit();
    });
    
    // Show success messages
    @if(session('success'))
        toastr.success('{{ session('success') }}');
    @endif
</script>
@endpush