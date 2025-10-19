import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon, LoadingSpinner, ChevronDownIcon } from './icons';
import { Button, Input } from './ui';

interface Voice {
  voice_id: string;
  voice_name: string;
  tag_list: string[];
  sample_audio: string;
  cover_url?: string;
  description?: string;
}

interface MinimaxVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voiceId: string, voiceName: string) => void;
  selectedVoiceId?: string;
}

const MinimaxVoiceModal: React.FC<MinimaxVoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  selectedVoiceId
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [selectedOtherTags, setSelectedOtherTags] = useState<string[]>([]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Dropdown states
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
  const [isOtherTagsDropdownOpen, setIsOtherTagsDropdownOpen] = useState(false);
  
  // Refs for dropdown
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const ageDropdownRef = useRef<HTMLDivElement>(null);
  const otherTagsDropdownRef = useRef<HTMLDivElement>(null);

  // Available filter options
  const availableLanguages = [
    'Vietnamese', 'English', 'Afrikaans', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani',
    'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian', 'Catalan', 'Cebuano', 'Chichewa',
    'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Estonian', 'Filipino', 'Finnish',
    'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati', 'Hausa', 'Hebrew',
    'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Korean',
    'Malay', 'Portuguese', 'Polish', 'Russian', 'Romanian', 'Spanish', 'Swedish',
    'Thai', 'Turkish', 'Ukrainian', 'Urdu'
  ];
  
  const availableGenders = ['Male', 'Female'];
  const availableAges = ['Young', 'Middle Age', 'Old', 'Child', 'Teen', 'Adult', 'Senior'];
  const availableOtherTags = ['Compelling', 'Persuasive', 'Gentle', 'Elegant', 'Warm', 'Cool', 'Energetic', 'Calm', 'Professional', 'Casual'];

  useEffect(() => {
    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setIsGenderDropdownOpen(false);
      }
      if (ageDropdownRef.current && !ageDropdownRef.current.contains(event.target as Node)) {
        setIsAgeDropdownOpen(false);
      }
      if (otherTagsDropdownRef.current && !otherTagsDropdownRef.current.contains(event.target as Node)) {
        setIsOtherTagsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/minimax/voices?page=1&page_size=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.voices) {
        setVoices(result.voices);
      } else {
        setError(result.error || 'Failed to fetch voices');
      }
    } catch (err) {
      console.error('Error fetching voices:', err);
      setError('Failed to load voices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = (voiceId: string, audioUrl: string) => {
    if (playingVoice === voiceId) {
      // Stop current audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingVoice(null);
      setAudioElement(null);
    } else {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      // Play new audio
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPlayingVoice(null);
        setAudioElement(null);
      };
      audio.onerror = () => {
        setPlayingVoice(null);
        setAudioElement(null);
        console.error('Error playing audio');
      };
      
      audio.play().catch(console.error);
      setPlayingVoice(voiceId);
      setAudioElement(audio);
    }
  };

  const handleSelectVoice = (voice: Voice) => {
    onSelectVoice(voice.voice_id, voice.voice_name);
    onClose();
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const toggleGender = (gender: string) => {
    setSelectedGenders(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  const toggleAge = (age: string) => {
    setSelectedAges(prev => 
      prev.includes(age) 
        ? prev.filter(a => a !== age)
        : [...prev, age]
    );
  };

  const toggleOtherTag = (tag: string) => {
    setSelectedOtherTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedLanguages([]);
    setSelectedGenders([]);
    setSelectedAges([]);
    setSelectedOtherTags([]);
    // Close all dropdowns
    setIsLanguageDropdownOpen(false);
    setIsGenderDropdownOpen(false);
    setIsAgeDropdownOpen(false);
    setIsOtherTagsDropdownOpen(false);
  };

  // Multi-select dropdown component
  const MultiSelectDropdown: React.FC<{
    label: string;
    options: string[];
    selectedValues: string[];
    onToggle: (value: string) => void;
    isOpen: boolean;
    onToggleOpen: () => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
    color: string;
  }> = ({ label, options, selectedValues, onToggle, isOpen, onToggleOpen, dropdownRef, color }) => {
    const getColorClasses = (color: string, isSelected: boolean) => {
      const colorMap = {
        blue: isSelected ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
        green: isSelected ? 'bg-green-500 text-white' : 'hover:bg-green-50 dark:hover:bg-green-900/20',
        orange: isSelected ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
        purple: isSelected ? 'bg-purple-500 text-white' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      };
      return colorMap[color as keyof typeof colorMap] || colorMap.blue;
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}:
        </label>
        <button
          onClick={onToggleOpen}
          className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between"
        >
          <span className="text-gray-700 dark:text-gray-300">
            {selectedValues.length > 0 
              ? `${selectedValues.length} selected` 
              : `Select ${label.toLowerCase()}`
            }
          </span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {options.map(option => {
              const isSelected = selectedValues.includes(option);
              return (
                <div
                  key={option}
                  onClick={() => onToggle(option)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${getColorClasses(color, isSelected)} ${
                    !isSelected ? 'text-gray-700 dark:text-gray-300' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent onClick
                      className="mr-2 rounded"
                    />
                    {option}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.voice_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = selectedLanguages.length === 0 || 
      selectedLanguages.some(lang => voice.tag_list.includes(lang));
    
    const matchesGender = selectedGenders.length === 0 || 
      selectedGenders.some(gender => voice.tag_list.includes(gender));
    
    const matchesAge = selectedAges.length === 0 || 
      selectedAges.some(age => voice.tag_list.includes(age));
    
    const matchesOtherTags = selectedOtherTags.length === 0 || 
      selectedOtherTags.some(tag => voice.tag_list.includes(tag));
    
    return matchesSearch && matchesLanguage && matchesGender && matchesAge && matchesOtherTags;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Select Voice
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            {/* Search */}
            <Input
              placeholder="Search voices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />

            {/* Clear All Filters Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters
              </h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-purple-500 hover:text-purple-600 transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Language Filter */}
              <MultiSelectDropdown
                label="Languages"
                options={availableLanguages}
                selectedValues={selectedLanguages}
                onToggle={toggleLanguage}
                isOpen={isLanguageDropdownOpen}
                onToggleOpen={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                dropdownRef={languageDropdownRef}
                color="blue"
              />

              {/* Gender Filter */}
              <MultiSelectDropdown
                label="Gender"
                options={availableGenders}
                selectedValues={selectedGenders}
                onToggle={toggleGender}
                isOpen={isGenderDropdownOpen}
                onToggleOpen={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                dropdownRef={genderDropdownRef}
                color="green"
              />

              {/* Age Filter */}
              <MultiSelectDropdown
                label="Age"
                options={availableAges}
                selectedValues={selectedAges}
                onToggle={toggleAge}
                isOpen={isAgeDropdownOpen}
                onToggleOpen={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                dropdownRef={ageDropdownRef}
                color="orange"
              />

              {/* Style & Tone Filter */}
              <MultiSelectDropdown
                label="Style & Tone"
                options={availableOtherTags}
                selectedValues={selectedOtherTags}
                onToggle={toggleOtherTag}
                isOpen={isOtherTagsDropdownOpen}
                onToggleOpen={() => setIsOtherTagsDropdownOpen(!isOtherTagsDropdownOpen)}
                dropdownRef={otherTagsDropdownRef}
                color="purple"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="w-8 h-8 text-purple-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading voices...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchVoices} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredVoices.map(voice => (
                <div
                  key={voice.voice_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedVoiceId === voice.voice_id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectVoice(voice)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {voice.voice_name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {voice.tag_list.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {voice.tag_list.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            +{voice.tag_list.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Play button */}
                    {voice.sample_audio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudio(voice.voice_id, voice.sample_audio);
                        }}
                        className="ml-2 p-2 text-purple-500 hover:text-purple-600 transition-colors"
                      >
                        {playingVoice === voice.voice_id ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredVoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No voices found matching your criteria.
              </p>
            </div>
          )}
        </div> 
      </div>
    </div>
  );
};

export default MinimaxVoiceModal;