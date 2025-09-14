<?php

namespace App\Http\Controllers;

use App\Models\Voice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class VoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Voice::with('user');
        
        // Filter by language
        if ($request->filled('language')) {
            $query->byLanguage($request->language);
        }
        
        // Filter by category
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }
        
        // Filter by gender
        if ($request->filled('gender')) {
            $query->byGender($request->gender);
        }
        
        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        // Search by name or voice_id
        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('voice_id', 'like', '%' . $request->search . '%');
            });
        }
        
        $voices = $query->orderBy('created_at', 'desc')->paginate(15);
        
        return view('admin.voices.index', compact('voices'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $users = User::all();
        return view('admin.voices.create', compact('users'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'voice_id' => 'required|string|unique:voices,voice_id',
            'language' => 'required|string|max:10',
            'category' => 'required|string|max:50',
            'preview_url' => 'nullable|url',
            'fine_data' => 'nullable|json',
            'gender' => 'nullable|in:male,female,other',
            'age' => 'nullable|in:young,middle_aged,old',
            'description' => 'nullable|string',
            'platforms' => 'required|string|max:255',
            'status' => 'boolean'
        ]);
        
        // Parse fine_data if it's a JSON string
        if ($validated['fine_data']) {
            $validated['fine_data'] = json_decode($validated['fine_data'], true);
        }
        
        Voice::create($validated);
        
        return redirect()->route('admin.voices.index')
                        ->with('success', 'Voice created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Voice $voice)
    {
        $voice->load('user');
        return view('admin.voices.show', compact('voice'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Voice $voice)
    {
        $users = User::all();
        return view('admin.voices.edit', compact('voice', 'users'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Voice $voice)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'voice_id' => ['required', 'string', Rule::unique('voices')->ignore($voice->id)],
            'language' => 'required|string|max:10',
            'category' => 'required|string|max:50',
            'preview_url' => 'nullable|url',
            'fine_data' => 'nullable|json',
            'gender' => 'nullable|in:male,female,other',
            'age' => 'nullable|in:young,middle_aged,old',
            'description' => 'nullable|string',
            'platforms' => 'required|string|max:255',
            'status' => 'boolean'
        ]);
        
        // Parse fine_data if it's a JSON string
        if ($validated['fine_data']) {
            $validated['fine_data'] = json_decode($validated['fine_data'], true);
        }
        
        $voice->update($validated);
        
        return redirect()->route('admin.voices.index')
                        ->with('success', 'Voice updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Voice $voice)
    {
        $voice->delete();
        
        return redirect()->route('admin.voices.index')
                        ->with('success', 'Voice deleted successfully.');
    }
}
