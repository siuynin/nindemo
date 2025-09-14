@extends('admin.layouts.app')

@section('content')
<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-microphone me-2"></i>Chỉnh sửa Voice</h2>
                <div>
                    <a href="{{ route('admin.voices.show', $voice) }}" class="btn btn-info me-2">
                        <i class="fas fa-eye me-2"></i>Xem
                    </a>
                    <a href="{{ route('admin.voices.index') }}" class="btn btn-secondary">
                        <i class="fas fa-arrow-left me-2"></i>Quay lại
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Thông tin Voice</h5>
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

                    <form action="{{ route('admin.voices.update', $voice) }}" method="POST">
                        @csrf
                        @method('PUT')

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Voice Name <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control @error('name') is-invalid @enderror" 
                                           id="name" name="name" value="{{ old('name', $voice->name) }}" required>
                                    @error('name')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="voice_id" class="form-label">Voice ID <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control @error('voice_id') is-invalid @enderror" 
                                           id="voice_id" name="voice_id" value="{{ old('voice_id', $voice->voice_id) }}" required>
                                    @error('voice_id')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="language" class="form-label">Language <span class="text-danger">*</span></label>
                                    <select class="form-select @error('language') is-invalid @enderror" 
                                            id="language" name="language" required>
                                        <option value="">Select Language</option>
                                        <option value="en" {{ old('language', $voice->language) == 'en' ? 'selected' : '' }}>English</option>
                                        <option value="fr" {{ old('language', $voice->language) == 'fr' ? 'selected' : '' }}>French</option>
                                        <option value="es" {{ old('language', $voice->language) == 'es' ? 'selected' : '' }}>Spanish</option>
                                        <option value="de" {{ old('language', $voice->language) == 'de' ? 'selected' : '' }}>German</option>
                                        <option value="zh" {{ old('language', $voice->language) == 'zh' ? 'selected' : '' }}>Chinese</option>
                                        <option value="ja" {{ old('language', $voice->language) == 'ja' ? 'selected' : '' }}>Japanese</option>
                                        <option value="ko" {{ old('language', $voice->language) == 'ko' ? 'selected' : '' }}>Korean</option>
                                        <option value="pt" {{ old('language', $voice->language) == 'pt' ? 'selected' : '' }}>Portuguese</option>
                                        <option value="it" {{ old('language', $voice->language) == 'it' ? 'selected' : '' }}>Italian</option>
                                        <option value="ru" {{ old('language', $voice->language) == 'ru' ? 'selected' : '' }}>Russian</option>
                                    </select>
                                    @error('language')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="category" class="form-label">Category <span class="text-danger">*</span></label>
                                    <select class="form-select @error('category') is-invalid @enderror" 
                                            id="category" name="category" required>
                                        <option value="">Select Category</option>
                                        <option value="premade" {{ old('category', $voice->category) == 'premade' ? 'selected' : '' }}>Premade</option>
                                        <option value="custom" {{ old('category', $voice->category) == 'custom' ? 'selected' : '' }}>Custom</option>
                                        <option value="cloned" {{ old('category', $voice->category) == 'cloned' ? 'selected' : '' }}>Cloned</option>
                                    </select>
                                    @error('category')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="col-md-4">
                                <div class="mb-3">
                                    <label for="gender" class="form-label">Gender</label>
                                    <select class="form-select @error('gender') is-invalid @enderror" 
                                            id="gender" name="gender">
                                        <option value="">Select Gender</option>
                                        <option value="male" {{ old('gender', $voice->gender) == 'male' ? 'selected' : '' }}>Male</option>
                                        <option value="female" {{ old('gender', $voice->gender) == 'female' ? 'selected' : '' }}>Female</option>
                                        <option value="other" {{ old('gender', $voice->gender) == 'other' ? 'selected' : '' }}>Other</option>
                                    </select>
                                    @error('gender')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="age" class="form-label">Age</label>
                                    <select class="form-select @error('age') is-invalid @enderror" 
                                            id="age" name="age">
                                        <option value="">Select Age</option>
                                        <option value="young" {{ old('age', $voice->age) == 'young' ? 'selected' : '' }}>Young</option>
                                        <option value="middle_aged" {{ old('age', $voice->age) == 'middle_aged' ? 'selected' : '' }}>Middle Aged</option>
                                        <option value="old" {{ old('age', $voice->age) == 'old' ? 'selected' : '' }}>Old</option>
                                    </select>
                                    @error('age')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="platforms" class="form-label">Platform</label>
                                    <input type="text" class="form-control @error('platforms') is-invalid @enderror" 
                                           id="platforms" name="platforms" value="{{ old('platforms', $voice->platforms) }}" readonly>
                                    @error('platforms')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="preview_url" class="form-label">Preview URL</label>
                            <input type="url" class="form-control @error('preview_url') is-invalid @enderror" 
                                   id="preview_url" name="preview_url" value="{{ old('preview_url', $voice->preview_url) }}" 
                                   placeholder="https://example.com/audio.mp3">
                            @error('preview_url')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            @if($voice->preview_url)
                                <div class="mt-2">
                                    <small class="text-muted">Current preview:</small><br>
                                    <audio controls style="width: 100%; max-width: 300px;">
                                        <source src="{{ $voice->preview_url }}" type="audio/mpeg">
                                        Your browser does not support the audio element.
                                    </audio>
                                </div>
                            @endif
                        </div>

                        <div class="mb-3">
                            <label for="description" class="form-label">Description</label>
                            <textarea class="form-control @error('description') is-invalid @enderror" 
                                      id="description" name="description" rows="3" 
                                      placeholder="Enter voice description...">{{ old('description', $voice->description) }}</textarea>
                            @error('description')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="mb-3">
                            <label for="fine_data" class="form-label">Fine Data (JSON)</label>
                            <textarea class="form-control @error('fine_data') is-invalid @enderror" 
                                      id="fine_data" name="fine_data" rows="4" 
                                      placeholder='Enter JSON data... e.g., {"key": "value"}'>{{ old('fine_data', is_array($voice->fine_data) ? json_encode($voice->fine_data, JSON_PRETTY_PRINT) : $voice->fine_data) }}</textarea>
                            @error('fine_data')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <div class="form-text">Enter valid JSON format for additional voice configuration.</div>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="status" name="status" value="1" 
                                       {{ old('status', $voice->status) ? 'checked' : '' }}>
                                <label class="form-check-label" for="status">
                                    Active Status
                                </label>
                            </div>
                        </div>

                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                            <a href="{{ route('admin.voices.index') }}" class="btn btn-secondary me-md-2">
                                <i class="fas fa-times"></i> Cancel
                            </a>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Update Voice
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
@endpush