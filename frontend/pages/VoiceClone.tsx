import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, Button, Input, TextArea, Select, Badge } from '../components/ui';
import { SpeakerIcon, UploadIcon, PlayIcon, DownloadIcon, TrashIcon } from '../components/icons';

interface VoiceClone {
  id: number;
  voice_name: string;
  voice_id: string;
  preview_text: string;
  language_tag: string;
  gender_tag: string;
  need_noise_reduction: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

const VoiceClone: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    voice_name: '',
    preview_text: 'Hello world, this is my cloned voice.',
    language_tag: 'English',
    gender_tag: 'male',
    need_noise_reduction: false
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userVoices, setUserVoices] = useState<VoiceClone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ 
    message: '', 
    type: 'success', 
    visible: false 
  });
  
  // Audio file constraints
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_AUDIO_DURATION = 300; // 5 minutes in seconds
  const ALLOWED_FILE_TYPES = ['audio/mpeg', 'audio/mp3'];
  
  const languageOptions = [ 
    { value: 'English', label: 'English' },
    { value: 'Vietnamese', label: 'Vietnamese' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'Armenian', label: 'Armenian' },
    { value: 'Assamese', label: 'Assamese' },
    { value: 'Azerbaijani', label: 'Azerbaijani' },
    { value: 'Belarusian', label: 'Belarusian' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Bosnian', label: 'Bosnian' },
    { value: 'Bulgarian', label: 'Bulgarian' },
    { value: 'Catalan', label: 'Catalan' },
    { value: 'Cebuano', label: 'Cebuano' },
    { value: 'Chichewa', label: 'Chichewa' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Croatian', label: 'Croatian' },
    { value: 'Czech', label: 'Czech' },
    { value: 'Danish', label: 'Danish' },
    { value: 'Dutch', label: 'Dutch' }, 
    { value: 'Estonian', label: 'Estonian' },
    { value: 'Filipino', label: 'Filipino' },
    { value: 'Finnish', label: 'Finnish' },
    { value: 'French', label: 'French' },
    { value: 'Galician', label: 'Galician' },
    { value: 'Georgian', label: 'Georgian' },
    { value: 'German', label: 'German' },
    { value: 'Greek', label: 'Greek' },
    { value: 'Gujarati', label: 'Gujarati' },
    { value: 'Hausa', label: 'Hausa' },
    { value: 'Hebrew', label: 'Hebrew' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Hungarian', label: 'Hungarian' },
    { value: 'Icelandic', label: 'Icelandic' },
    { value: 'Indonesian', label: 'Indonesian' }, 
    { value: 'Italian', label: 'Italian' },
    { value: 'Japanese', label: 'Japanese' }, 
    { value: 'Korean', label: 'Korean' },
    { value: 'Malay', label: 'Malay' },
    { value: 'Portuguese', label: 'Portuguese' }, 
    { value: 'Polish', label: 'Polish' },
    { value: 'Russian', label: 'Russian' },  
    { value: 'Romanian', label: 'Romanian' },
    { value: 'Spanish', label: 'Spanish' }, 
    { value: 'Swedish', label: 'Swedish' },
    { value: 'Thai', label: 'Thai' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Ukrainian', label: 'Ukrainian' },
    { value: 'Urdu', label: 'Urdu' },
    
  ];
  
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];
  
  useEffect(() => {
    document.title = 'Voice Clone - AI App';
    if (isAuthenticated) {
      fetchUserVoices();
    }
  }, [isAuthenticated]);
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  const validateAudioFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast('Only MP3 files are allowed', 'error');
        resolve(false);
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        showToast('File size must not exceed 20MB', 'error');
        resolve(false);
        return;
      }
      
      // Check audio duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(audio.src);
        
        if (duration > MAX_AUDIO_DURATION) {
          showToast('Audio duration must not exceed 5 minutes', 'error');
          resolve(false);
        } else {
          resolve(true);
        }
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(audio.src);
        showToast('Unable to validate audio file', 'error');
        resolve(false);
      });
    });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isValid = await validateAudioFile(file);
    if (isValid) {
      setSelectedFile(file);
      showToast('Audio file selected successfully', 'success');
    } else {
      e.target.value = '';
      setSelectedFile(null);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const fetchUserVoices = async () => {
    try {
      const response = await fetch('/api/voice-clones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserVoices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user voices:', error);
      showToast('Error loading voice list', 'error');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('Please sign in to clone voices', 'warning');
      return;
    }
    
    if (!selectedFile) {
      showToast('Please select an audio file', 'error');
      return;
    }
    
    if (!formData.voice_name.trim()) {
      showToast('Please enter a voice name', 'error');
      return;
    }
    
    if (!formData.preview_text.trim()) {
      showToast('Please enter preview text', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create FormData for multipart upload
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('voice_name', formData.voice_name);
      formDataToSend.append('preview_text', formData.preview_text);
      formDataToSend.append('language_tag', formData.language_tag);
      formDataToSend.append('gender_tag', formData.gender_tag);
      formDataToSend.append('need_noise_reduction', String(formData.need_noise_reduction));
      formDataToSend.append('platform', 'minimax');
      
      const response = await fetch('/api/voice-clones', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showToast('Voice clone request submitted successfully', 'success');
        
        // Reset form
        setFormData({
          voice_name: '',
          preview_text: 'Hello world, this is my cloned voice.',
          language_tag: 'English',
          gender_tag: 'male',
          need_noise_reduction: false
        });
        setSelectedFile(null);
        
        // Refresh voice list
        fetchUserVoices();
      } else {
        showToast(result.message || 'Error submitting voice clone request', 'error');
      }
    } catch (error) {
      console.error('Error submitting voice clone:', error);
      showToast('Error submitting voice clone request', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteVoice = async (voiceId: number) => {
    if (!confirm('Are you sure you want to delete this voice clone?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/voice-clones/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        showToast('Voice clone deleted successfully', 'success');
        fetchUserVoices();
      } else {
        showToast('Error deleting voice clone', 'error');
      }
    } catch (error) {
      console.error('Error deleting voice clone:', error);
      showToast('Error deleting voice clone', 'error');
    }
  };
  
  const handleTestVoice = (voice: VoiceClone) => {
    if (voice.status === 'completed' && voice.voice_id) {
      // Test voice with preview text
      console.log('Testing voice:', voice.voice_name, 'with text:', voice.preview_text);
      showToast('Voice test functionality will be implemented soon', 'info');
    } else {
      showToast('Voice clone is not ready for testing', 'warning');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'light';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Voice Clone
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Clone your voice using advanced AI technology
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voice Clone Form */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Create Voice Clone
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Audio File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audio File (MP3, Max 20MB, 5 minutes)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <div className="space-y-1 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".mp3,audio/mpeg"
                            onChange={handleFileChange}
                            disabled={isLoading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        MP3 up to 20MB and 5 minutes
                      </p>
                      {selectedFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Voice Name */}
                <Input
                  label="Voice Name"
                  name="voice_name"
                  value={formData.voice_name}
                  onChange={handleInputChange}
                  placeholder="e.g., My Voice"
                  required
                  disabled={isLoading}
                />
                
                {/* Preview Text */}
                <TextArea
                  label="Preview Text"
                  name="preview_text"
                  value={formData.preview_text}
                  onChange={handleInputChange}
                  placeholder="Enter text to test the cloned voice"
                  rows={3}
                  required
                  disabled={isLoading}
                />
                
                {/* Language Tag */}
                <Select
                  label="Language"
                  name="language_tag"
                  value={formData.language_tag}
                  onChange={handleInputChange}
                  options={languageOptions}
                  required
                  disabled={isLoading}
                />
                
                {/* Gender Tag */}
                <Select
                  label="Gender"
                  name="gender_tag"
                  value={formData.gender_tag}
                  onChange={handleInputChange}
                  options={genderOptions}
                  required
                  disabled={isLoading}
                />
                
                {/* Noise Reduction */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="need_noise_reduction"
                    name="need_noise_reduction"
                    checked={formData.need_noise_reduction}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="need_noise_reduction" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Enable noise reduction
                  </label>
                </div>
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFile || !formData.voice_name.trim() || !formData.preview_text.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Clone Voice'
                  )}
                </Button>
              </form>
            </Card>
          </div>
          
          {/* User Voice Clones List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  My Voice Clones
                </h2>
                <Badge variant="light" size="sm">
                  {userVoices.length} voices
                </Badge>
              </div>
              
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <SpeakerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please sign in to view your voice clones
                  </p>
                </div>
              ) : userVoices.length === 0 ? (
                <div className="text-center py-8">
                  <SpeakerIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No voice clones yet. Create your first voice clone!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {userVoices.map((voice) => (
                    <div key={voice.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {voice.voice_name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {voice.language_tag} • {voice.gender_tag}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(voice.status)} size="sm">
                          {voice.status}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {voice.preview_text}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>
                          {new Date(voice.created_at).toLocaleDateString()}
                        </span>
                        {voice.need_noise_reduction && (
                          <Badge variant="info" size="xs">
                            Noise Reduced
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestVoice(voice)}
                          disabled={voice.status !== 'completed'}
                          className="flex-1"
                        >
                          <PlayIcon className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteVoice(voice.id)}
                          className="px-2"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
        
        {/* Toast Notification */}
        {toast.visible && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">{toast.message}</span>
              <button
                onClick={() => setToast(prev => ({ ...prev, visible: false }))}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceClone;