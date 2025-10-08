import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, PauseIcon, LoadingSpinner } from './icons';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Available tags for filtering
  const availableTags = ['English', 'Male', 'Female', 'Young', 'Middle Age', 'Compelling', 'Persuasive', 'Gentle', 'Elegant'];

  useEffect(() => {
    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen]);

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.voice_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => voice.tag_list.includes(tag));
    return matchesSearch && matchesTags;
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

            {/* Tag Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by tags:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
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