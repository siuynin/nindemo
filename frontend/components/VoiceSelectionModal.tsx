import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ElevenLabsVoice, VoiceFilters } from '../types';
import elevenLabsService from '../services/elevenLabsService';
import { PlayIcon, PauseIcon, LoadingSpinner } from './icons';

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
  const { theme } = useTheme();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Chọn Giọng Nói</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tìm kiếm
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Tìm theo tên hoặc mô tả..."
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Language */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Ngôn ngữ
              </label>
              <select
                value={filters.language || ''}
                onChange={(e) => handleFilterChange('language', e.target.value || undefined)}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
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
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Giới tính
              </label>
              <select
                value={filters.gender || ''}
                onChange={(e) => handleFilterChange('gender', e.target.value as any || undefined)}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tất cả giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="neutral">Trung tính</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Độ tuổi
              </label>
              <select
                value={filters.age || ''}
                onChange={(e) => handleFilterChange('age', e.target.value as any || undefined)}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tất cả độ tuổi</option>
                <option value="young">Trẻ</option>
                <option value="middle_aged">Trung niên</option>
                <option value="old">Lớn tuổi</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Danh mục
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Tất cả danh mục</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear filters button */}
          <button
            onClick={clearFilters}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner className="w-8 h-8 mr-3" />
              <span>Đang tải giọng nói...</span>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-lg mb-4 ${
              theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
            }`}>
              {error}
              <button
                onClick={fetchVoices}
                className="ml-2 underline hover:no-underline"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && displayedVoices.length === 0 && (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Không tìm thấy giọng nói nào phù hợp với bộ lọc.
            </div>
          )}

          {!loading && !error && displayedVoices.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedVoices.map((voice) => (
                  <div
                    key={voice.voice_id}
                    onClick={() => handleSelectVoice(voice)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedVoiceId === voice.voice_id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 truncate">{voice.name}</h4>
                        <p className={`text-xs mb-2 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {Array.isArray(voice.language) 
                            ? voice.language.map(lang => typeof lang === 'object' ? lang.language : lang).join(', ').toUpperCase()
                            : (typeof voice.language === 'string' ? voice.language.toUpperCase() : 'N/A')
                          } • {voice.gender === 'male' ? 'Nam' : voice.gender === 'female' ? 'Nữ' : voice.gender === 'neutral' ? 'Trung tính' : (voice.gender || 'N/A')} • {voice.age === 'young' ? 'Trẻ' : voice.age === 'middle_aged' ? 'Trung niên' : voice.age === 'old' ? 'Lớn tuổi' : (voice.age || 'N/A')}
                        </p>
                        <p className={`text-xs line-clamp-2 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {voice.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoicePreview(voice);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            theme === 'dark'
                              ? 'hover:bg-gray-600 text-gray-300'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {playingVoiceId === voice.voice_id ? (
                            <PauseIcon className="w-4 h-4" />
                          ) : (
                            <PlayIcon className="w-4 h-4" />
                          )}
                        </button>
                        {selectedVoiceId === voice.voice_id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load more button */}
              {hasMore && (
                <div className="text-center mt-6">
                  <button
                    onClick={loadMore}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Tải thêm ({filteredVoices.length - displayCount} còn lại)
                  </button>
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