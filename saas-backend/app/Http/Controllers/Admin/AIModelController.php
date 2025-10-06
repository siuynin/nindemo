<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AIModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AIModelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $models = AIModel::latest()->paginate(15);
        return view('admin.models.index', compact('models'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('admin.models.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:models,slug',
            'platform' => 'required|string|max:255',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'type' => 'required|string|max:255',
            'credit_price' => 'required|numeric|min:0',
            'short_description' => 'nullable|string|max:1000'
        ]);

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            $validated['thumbnail'] = $request->file('thumbnail')->store('models/thumbnails', 's3');
        }

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        AIModel::create($validated);

        return redirect()->route('admin.models.index')
            ->with('success', 'Model created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(AIModel $model)
    {
        return view('admin.models.show', compact('model'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AIModel $model)
    {
        return view('admin.models.edit', compact('model'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AIModel $model)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:models,slug,' . $model->id,
            'platform' => 'required|string|max:255',
            'thumbnail' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'type' => 'required|string|max:255',
            'credit_price' => 'required|numeric|min:0',
            'short_description' => 'nullable|string|max:1000'
        ]);

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            // Delete old thumbnail
            if ($model->thumbnail) {
                Storage::disk('s3')->delete($model->thumbnail);
            }
            $validated['thumbnail'] = $request->file('thumbnail')->store('models/thumbnails', 's3');
        }

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $model->update($validated);

        return redirect()->route('admin.models.index')
            ->with('success', 'Model updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AIModel $model)
    {
        // Delete thumbnail if exists
        if ($model->thumbnail) {
            Storage::disk('public')->delete($model->thumbnail);
        }

        $model->delete();

        return redirect()->route('admin.models.index')
            ->with('success', 'Model deleted successfully.');
    }
}
