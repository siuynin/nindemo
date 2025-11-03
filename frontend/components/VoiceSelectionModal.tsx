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

  // Pagination for API-level pagination (starts from 0)
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreFromAPI, setHasMoreFromAPI] = useState(true);
  const [allVoices, setAllVoices] = useState<ElevenLabsVoice[]>([]);

  // Display all voices from API (no client-side pagination)
  const [hasMore, setHasMore] = useState(true);

  // Fetch voices from API
  const fetchVoices = useCallback(async (page: number = 0, resetVoices: boolean = true) => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await elevenLabsService.fetchSharedVoices({
        ...filters,
        page
      });
      
      if (resetVoices) {
        setAllVoices(response.voices || []);
      } else {
        setAllVoices(prev => [...prev, ...(response.voices || [])]);
      }
      
      setHasMoreFromAPI(response.has_more || false);
      setHasMore(response.has_more || false);
    } catch (err) {
      setError('Không thể tải danh sách giọng nói. Vui lòng thử lại.');
      console.error('Error fetching voices:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, filters]);

  // Load voices when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
      setAllVoices([]);
      fetchVoices(0, true);
    }
  }, [isOpen, filters.search, filters.language, filters.gender, filters.age, filters.category]);

  // Filter voices based on current filters (client-side filtering for search)
  const filteredVoices = useMemo(() => {
    if (!filters.search) {
      return allVoices;
    }
    
    return allVoices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        (voice.description && voice.description.toLowerCase().includes(filters.search!.toLowerCase()));
      return matchesSearch;
    });
  }, [allVoices, filters.search]);

  // Display all filtered voices (no client-side pagination)
  const displayedVoices = filteredVoices;

  // Load more voices from API
  const loadMore = useCallback(async () => {
    if (hasMoreFromAPI && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      await fetchVoices(nextPage, false);
    }
  }, [hasMoreFromAPI, loading, currentPage, fetchVoices]);



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
    setCurrentPage(0);
    setAllVoices([]);
  }, []);

  // Language mapping for display names
  const languageMap = {
    'en': 'English',
    'vi': 'Vietnamese',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'pl': 'Polish',
    'tr': 'Turkish',
    'ru': 'Russian',
    'nl': 'Dutch',
    'cs': 'Czech',
    'ar': 'Arabic',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'hi': 'Hindi',
    'ko': 'Korean',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'uk': 'Ukrainian',
    'el': 'Greek',
    'he': 'Hebrew',
    'th': 'Thai',
    'id': 'Indonesian',
    'ms': 'Malay',
    'tl': 'Filipino',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'te': 'Telugu',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'ur': 'Urdu',
    'fa': 'Persian',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'mt': 'Maltese',
    'is': 'Icelandic',
    'ga': 'Irish',
    'cy': 'Welsh',
    'eu': 'Basque',
    'ca': 'Catalan',
    'gl': 'Galician',
    'af': 'Afrikaans',
    'sw': 'Swahili',
    'am': 'Amharic',
    'yo': 'Yoruba',
    'zu': 'Zulu',
    'xh': 'Xhosa'
  };

  // Get unique values for filter options from all fetched voices
  const filterOptions = useMemo(() => {
    // Define popular languages to show first
    const popularLanguages = ['en', 'vi', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'hi'];
    
    // Get all language codes and sort them by display name
    const allLanguageCodes = Object.keys(languageMap);
    const otherLanguages = allLanguageCodes
      .filter(code => !popularLanguages.includes(code))
      .sort((a, b) => {
        const nameA = languageMap[a as keyof typeof languageMap] || a;
        const nameB = languageMap[b as keyof typeof languageMap] || b;
        return nameA.localeCompare(nameB);
      });
    
    // Combine popular languages first, then sorted others
    const languages = [...popularLanguages, ...otherLanguages];
    
    const categories = [...new Set(allVoices.map(v => v.category))].filter(Boolean).sort();
    
    return {
      languages,
      categories,
      genders: ['male', 'female', 'neutral'] as const,
      ages: ['young', 'middle_aged', 'old'] as const
    };
  }, [allVoices]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
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
            {/* Clear All Filters Button */}
            <div className="flex justify-between items-center"> 
              <button
                onClick={clearFilters}
                className="text-sm text-purple-500 hover:text-purple-600 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>

            {/* Search and Filter Dropdowns in flexible layout */}
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[180px] sm:min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tìm kiếm:
                </label>
                <Input
                  placeholder="Tên hoặc mô tả..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Language with Flag Icons */}
              <div className="min-w-[130px] sm:min-w-[140px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngôn ngữ:
                </label>
                <div className="relative">
                  <select
                    value={filters.language || ''}
                    onChange={(e) => handleFilterChange('language', e.target.value || undefined)}
                    className={`w-full px-3 py-2 pr-8 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300 text-sm appearance-none ${filters.language ? 'pl-9' : ''}`}
                  >
                    <option value="">🌐 Tất cả</option>
                    {filterOptions.languages.map(langCode => {
                      const langDisplay = languageMap[langCode as keyof typeof languageMap] || langCode?.toUpperCase() || 'N/A';
                      return (
                        <option key={langCode} value={langCode}>
                          {langDisplay}
                        </option>
                      );
                    })}
                  </select>
                  {/* Flag icon overlay */}
                  {filters.language && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <img 
                        src={`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${filters.language}.svg`}
                        alt={filters.language}
                        className="w-4 h-3 rounded-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="min-w-[100px] sm:min-w-[110px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giới tính:
                </label>
                <select
                  value={filters.gender || ''}
                  onChange={(e) => handleFilterChange('gender', e.target.value as any || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300 text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="neutral">Trung tính</option>
                </select>
              </div>

              {/* Age */}
              <div className="min-w-[100px] sm:min-w-[110px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Độ tuổi:
                </label>
                <select
                  value={filters.age || ''}
                  onChange={(e) => handleFilterChange('age', e.target.value as any || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300 text-sm"
                >
                  <option value="">Tất cả</option>
                  <option value="young">Trẻ</option>
                  <option value="middle_aged">Trung niên</option>
                  <option value="old">Lớn tuổi</option>
                </select>
              </div>

              {/* Category */}
              <div className="min-w-[110px] sm:min-w-[120px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục:
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="w-full px-3 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 dark:text-gray-300 text-sm"
                >
                  <option value="">Tất cả</option>
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
              <Button onClick={() => fetchVoices(0, true)} variant="outline">
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
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Đang tải...
                      </>
                    ) : (
                      'Tải thêm giọng nói'
                    )}
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