<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OpenAI;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminOpenAIController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $openais = OpenAI::latest()->paginate(15);
        return view('admin.openai.index', compact('openais'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('admin.openai.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'slug' => 'nullable|string|unique:openai,slug',
            'active' => 'boolean',
            'questions' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'premium' => 'boolean',
            'type' => 'nullable|string|max:100',
            'prompt' => 'nullable|string',
            'custom_template' => 'nullable|string',
            'tone_of_voice' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:7',
            'filters' => 'nullable|string',
            'package' => 'nullable|string|max:100',
        ]);

        // Auto-generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Set default values
        $validated['active'] = $request->has('active');
        $validated['premium'] = $request->has('premium');
        $validated['user_id'] = auth()->id();

        OpenAI::create($validated);

        return redirect()->route('admin.openai.index')
            ->with('success', 'OpenAI template created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(OpenAI $openai)
    {
        return view('admin.openai.show', compact('openai'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OpenAI $openai)
    {
        return view('admin.openai.edit', compact('openai'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OpenAI $openai)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'slug' => 'nullable|string|unique:openai,slug,' . $openai->id,
            'active' => 'boolean',
            'questions' => 'nullable|string',
            'image' => 'nullable|string|max:255',
            'premium' => 'boolean',
            'type' => 'nullable|string|max:100',
            'prompt' => 'nullable|string',
            'custom_template' => 'nullable|string',
            'tone_of_voice' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:7',
            'filters' => 'nullable|string',
            'package' => 'nullable|string|max:100',
        ]);

        // Auto-generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Set boolean values
        $validated['active'] = $request->has('active');
        $validated['premium'] = $request->has('premium');

        $openai->update($validated);

        return redirect()->route('admin.openai.index')
            ->with('success', 'OpenAI template updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OpenAI $openai)
    {
        $openai->delete();

        return redirect()->route('admin.openai.index')
            ->with('success', 'OpenAI template deleted successfully!');
    }
}
