import { ElevenLabsVoicesResponse, VoiceFilters } from '../types';

class ElevenLabsService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_ELEVENLABS_BASE_URL || 'https://api.ai33.pro/v1';
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  }

  async textToSpeech(params: {
    voiceId: string;
    text: string;
    modelId?: string;
    outputFormat?: string;
    withTranscript?: boolean;
    receiveUrl?: string;
  }) {
    const {
      voiceId,
      text,
      modelId = 'eleven_multilingual_v2',
      outputFormat = 'mp3_44100_128',
      withTranscript = false,
      receiveUrl = 'https://ndhubs.com/api/getaudio'
    } = params;

    const url = `${this.baseUrl}/text-to-speech/${voiceId}?output_format=${outputFormat}`;

    const requestBody = {
      text,
      model_id: modelId,
      with_transcript: withTranscript,
      receive_url: receiveUrl
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw error;
    }
  }

  async getVoices() {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  async fetchSharedVoices(filters?: VoiceFilters): Promise<ElevenLabsVoicesResponse> {
    try {
      // Use Laravel backend API for public voices
      const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      
      // Fetch all voices with pagination
      let allVoices: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const url = new URL(`${backendUrl}/public-voices`);
        url.searchParams.append('page', currentPage.toString());
        url.searchParams.append('per_page', '100'); // Get more voices per request
        
        // Add query parameters for filtering if provided
        if (filters) {
          if (filters.language) url.searchParams.append('language', filters.language);
          if (filters.gender) url.searchParams.append('gender', filters.gender);
          if (filters.age) url.searchParams.append('age', filters.age);
          if (filters.category) url.searchParams.append('category', filters.category);
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse = await response.json();
        
        if (apiResponse.success && apiResponse.data) {
          allVoices.push(...apiResponse.data.voices);
          hasMorePages = apiResponse.data.pagination.current_page < apiResponse.data.pagination.last_page;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      }
      
      // Transform Laravel API response to match expected format
      const transformedVoices = allVoices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        gender: voice.gender,
        age: voice.age,
        language: voice.language, // Keep the full language array
        preview_url: voice.language[0]?.preview_url || '',
        description: voice.description || ''
      }));

      return {
        voices: transformedVoices,
        has_more: false // We've loaded all voices
      };
      
    } catch (error) {
      console.error('Error fetching shared voices:', error);
      throw error;
    }
  }
}

export default new ElevenLabsService();