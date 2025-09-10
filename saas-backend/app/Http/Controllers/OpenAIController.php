<?php

namespace App\Http\Controllers;

use App\Models\OpenAI;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OpenAIController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $openais = OpenAI::orderBy('created_at', 'desc')->paginate(10);
        return view('openai.index', compact('openais'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('openai.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:191',
            'description' => 'required|string',
            'slug' => 'nullable|string|max:191|unique:openai,slug',
            'active' => 'boolean',
            'questions' => 'nullable|string',
            'image' => 'nullable|string',
            'premium' => 'boolean',
            'type' => 'required|string|max:191',
            'prompt' => 'nullable|string',
            'custom_template' => 'boolean',
            'tone_of_voice' => 'boolean',
            'color' => 'nullable|string|max:191',
            'filters' => 'nullable|string',
            'package' => 'nullable|string',
        ]);

        // Auto-generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Convert JSON strings to arrays
        if (!empty($validated['questions'])) {
            $validated['questions'] = json_decode($validated['questions'], true);
        }
        if (!empty($validated['filters'])) {
            $validated['filters'] = explode(',', $validated['filters']);
        }
        if (!empty($validated['package'])) {
            $validated['package'] = explode(',', $validated['package']);
        }

        OpenAI::create($validated);

        return redirect()->route('openai.index')->with('success', 'OpenAI template created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(OpenAI $openai)
    {
        return view('openai.show', compact('openai'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OpenAI $openai)
    {
        return view('openai.edit', compact('openai'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OpenAI $openai)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:191',
            'description' => 'required|string',
            'slug' => 'nullable|string|max:191|unique:openai,slug,' . $openai->id,
            'active' => 'boolean',
            'questions' => 'nullable|string',
            'image' => 'nullable|string',
            'premium' => 'boolean',
            'type' => 'required|string|max:191',
            'prompt' => 'nullable|string',
            'custom_template' => 'boolean',
            'tone_of_voice' => 'boolean',
            'color' => 'nullable|string|max:191',
            'filters' => 'nullable|string',
            'package' => 'nullable|string',
        ]);

        // Auto-generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Convert JSON strings to arrays
        if (!empty($validated['questions'])) {
            $validated['questions'] = json_decode($validated['questions'], true);
        }
        if (!empty($validated['filters'])) {
            $validated['filters'] = explode(',', $validated['filters']);
        }
        if (!empty($validated['package'])) {
            $validated['package'] = explode(',', $validated['package']);
        }

        $openai->update($validated);

        return redirect()->route('openai.index')->with('success', 'OpenAI template updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OpenAI $openai)
    {
        $openai->delete();
        return redirect()->route('openai.index')->with('success', 'OpenAI template deleted successfully!');
    }
}
