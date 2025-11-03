import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ElevenLabsVoice, VoiceFilters } from '../types';
import elevenLabsService from '../services/elevenLabsService';
import { PlayIcon, PauseIcon, LoadingSpinner, XMarkIcon } from './icons';
import { Button, Input } from './ui';

interface VoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVoice: (voice: ElevenLabsVoice) => void;
  selectedVoiceId?: string;
}

const VoiceSelectionModal: React.FC<VoiceSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectVoice,
  selectedVoiceId
}) => {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<VoiceFilters>({
    search: '',
    language: '',
    gender: undefined,
    age: undefined,
    category: ''
  });

  // Pagination for lazy loading
  const [displayCount, setDisplayCount] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  // Fetch voices from API
  const fetchVoices = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await elevenLabsService.fetchSharedVoices();
      setVoices(response.voices || []);
    } catch (err) {
      setError('Không thể tải danh sách giọng nói. Vui lòng thử lại.');
      console.error('Error fetching voices:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  // Load voices when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVoices();
    }
  }, [isOpen, fetchVoices]);

  // Filter voices based on current filters
  const filteredVoices = useMemo(() => {
    return voices.filter(voice => {
      const matchesSearch = !filters.search || 
        voice.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (voice.description && voice.description.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesLanguage = !filters.language || 
        (Array.isArray(voice.language) 
          ? voice.language.some(lang => (typeof lang === 'object' ? lang.language : lang) === filters.language)
          : voice.language === filters.language);
      const matchesGender = !filters.gender || voice.gender === filters.gender;
      const matchesAge = !filters.age || voice.age === filters.age;
      const matchesCategory = !filters.category || voice.category === filters.category;
      
      return matchesSearch && matchesLanguage && matchesGender && matchesAge && matchesCategory;
    });
  }, [voices, filters]);

  // Get displayed voices with lazy loading
  const displayedVoices = useMemo(() => {
    const result = filteredVoices.slice(0, displayCount);
    setHasMore(result.length < filteredVoices.length);
    return result;
  }, [filteredVoices, displayCount]);

  // Load more voices
  const loadMore = useCallback(() => {
    if (hasMore) {
      setDisplayCount(prev => prev + 20);
    }
  }, [hasMore]);

  // Handle voice preview
  const handleVoicePreview = useCallback(async (voice: ElevenLabsVoice) => {
    if (playingVoiceId === voice.voice_id) {
      // Stop current audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    try {
      // Get preview URL from language array or direct property
      const previewUrl = Array.isArray(voice.language) && voice.language.length > 0
        ? voice.language[0].preview_url
        : voice.preview_url;
      
      if (!previewUrl) {
        console.error('No preview URL available for this voice');
        return;
      }
      
      const audio = new Audio(previewUrl);
      setCurrentAudio(audio);
      setPlayingVoiceId(voice.voice_id);
      
      audio.onended = () => {
        setPlayingVoiceId(null);
        setCurrentAudio(null);
      };
      
      audio.onerror = () => {
        setPlayingVoiceId(null);
        setCurrentAudio(null);
        console.error('Error playing audio preview');
      };
      
      await audio.play();
    } catch (error) {
      setPlayingVoiceId(null);
      setCurrentAudio(null);
      console.error('Error playing voice preview:', error);
    }
  }, [playingVoiceId, currentAudio]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof VoiceFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setDisplayCount(20); // Reset display count when filters change
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      language: '',
      gender: undefined,
      age: undefined,
      category: ''
    });
    setDisplayCount(20);
  }, []);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const languages = [...new Set(
      voices.flatMap(v => 
        Array.isArray(v.language) 
          ? v.language.map(lang => typeof lang === 'object' ? lang.language : lang)
          : [v.language]
      )
    )].filter(Boolean).sort();
    const categories = [...new Set(voices.map(v => v.category))].filter(Boolean).sort();
    
    return {
      languages,
      categories,
      genders: ['male', 'female', 'neutral'] as const,
      ages: ['young', 'middle_aged', 'old'] as const
    };
  }, [voices]);

  // Handle voice selection
  const handleSelectVoice = useCallback((voice: ElevenLabsVoice) => {
    onSelectVoice(voice);
    onClose();
  }, [onSelectVoice, onClose]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chọn Giọng Nói
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
              placeholder="Tìm theo tên hoặc mô tả..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />

            {/* Clear All Filters Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bộ lọc
              </h3>
              <button
                onClick={clearFilters}
                className="text-sm text-purple-500 hover:text-purple-600 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngôn ngữ:
                </label>
                <select
                  value={filters.language || ''}
                  onChange={(e) => handleFilterChange('language', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300"
                >
                  <option value="">Tất cả ngôn ngữ</option>
                  {filterOptions.languages.map(lang => {
                    const langValue = typeof lang === 'object' ? lang.language : lang;
                    const langDisplay = typeof langValue === 'string' ? langValue.toUpperCase() : 'N/A';
                    return (
                      <option key={langValue} value={langValue}>{langDisplay}</option>
                    );
                  })}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giới tính:
                </label>
                <select
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange('gender', e.target.value as any || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300"
                >
                  <option value="">Tất cả giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="neutral">Trung tính</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Độ tuổi:
                </label>
                <select
                  value={filters.age || ''}
                  onChange={(e) => handleFilterChange('age', e.target.value as any || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300"
                >
                  <option value="">Tất cả độ tuổi</option>
                  <option value="young">Trẻ</option>
                  <option value="middle_aged">Trung niên</option>
                  <option value="old">Lớn tuổi</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục:
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300"
                >
                  <option value="">Tất cả danh mục</option>
                  {filterOptions.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="w-8 h-8 text-purple-500" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải giọng nói...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchVoices} variant="outline">
                Thử lại
              </Button>
            </div>
          ) : !loading && !error && displayedVoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Không tìm thấy giọng nói nào phù hợp với bộ lọc.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayedVoices.map((voice) => (
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
                          {voice.name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {Array.isArray(voice.language) 
                            ? voice.language.map(lang => typeof lang === 'object' ? lang.language : lang).join(', ').toUpperCase()
                            : (typeof voice.language === 'string' ? voice.language.toUpperCase() : 'N/A')
                          } • {voice.gender === 'male' ? 'Nam' : voice.gender === 'female' ? 'Nữ' : voice.gender === 'neutral' ? 'Trung tính' : (voice.gender || 'N/A')} • {voice.age === 'young' ? 'Trẻ' : voice.age === 'middle_aged' ? 'Trung niên' : voice.age === 'old' ? 'Lớn tuổi' : (voice.age || 'N/A')}
                        </p>
                        {voice.description && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                            {voice.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Play button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoicePreview(voice);
                        }}
                        className="ml-2 p-2 text-purple-500 hover:text-purple-600 transition-colors"
                      >
                        {playingVoiceId === voice.voice_id ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : (
                          <PlayIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    onClick={loadMore}
                    className="px-6 py-2"
                  >
                    Tải thêm ({filteredVoices.length - displayCount} còn lại)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceSelectionModal;