import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatbotResponse {
  success: boolean;
  message: string;
  error?: string;
}

class ChatbotService {
  private geminiClient: GoogleGenAI | null = null;
  private openaiApiKey: string | null = null;
  private geminiApiKey: string | null = null;

  constructor() {
    this.geminiApiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    this.openaiApiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    
    if (this.geminiApiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: this.geminiApiKey });
    }
  }

  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private detectLanguage(message: string): 'vi' | 'en' | 'auto' {
    // Simple language detection based on common patterns
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const englishPattern = /^[a-zA-Z\s\d\.,!?'"()-]+$/;
    
    if (vietnamesePattern.test(message)) {
      return 'vi';
    } else if (englishPattern.test(message) && !vietnamesePattern.test(message)) {
      return 'en';
    }
    
    // Try to detect by common words
    const vietnameseWords = ['là', 'của', 'và', 'có', 'được', 'này', 'cho', 'với', 'từ', 'tôi', 'bạn', 'gì', 'như', 'thế', 'nào'];
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'how', 'when', 'where', 'why'];
    
    const lowerMessage = message.toLowerCase();
    const hasVietnamese = vietnameseWords.some(word => lowerMessage.includes(word));
    const hasEnglish = englishWords.some(word => lowerMessage.includes(word));
    
    if (hasVietnamese && !hasEnglish) return 'vi';
    if (hasEnglish && !hasVietnamese) return 'en';
    
    return 'auto';
  }

  private getSystemPrompt(detectedLang: 'vi' | 'en' | 'auto'): string {
    switch (detectedLang) {
      case 'vi':
        return `Bạn là một trợ lý AI thông minh và hữu ích. Hãy trả lời câu hỏi của người dùng một cách ngắn gọn, chính xác và thân thiện bằng tiếng Việt.`;
      case 'en':
        return `You are an intelligent and helpful AI assistant. Please answer the user's questions concisely, accurately, and in a friendly manner in English.`;
      default:
        return `You are an intelligent and helpful AI assistant. Please detect the language of the user's message and respond in the same language. If the message is in Vietnamese, respond in Vietnamese. If it's in English, respond in English. Be concise, accurate, and friendly.`;
    }
  }

  private async callGemini(message: string): Promise<string> {
    try {
      const detectedLang = this.detectLanguage(message);
      const systemPrompt = this.getSystemPrompt(detectedLang);
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Use backend proxy instead of direct Gemini API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/ai/process-text-gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: 'gemini-2.5-flash',
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to process text');
      }

      return data.data.text || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private async callOpenAI(message: string): Promise<string> {
    try {
      const detectedLang = this.detectLanguage(message);
      const systemPrompt = this.getSystemPrompt(detectedLang);
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      // Use backend proxy instead of direct OpenAI API call
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'}/ai/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: 'gpt-4.1-mini',
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to process text');
      }

      return data.data.text || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async sendMessage(message: string, provider?: 'gemini' | 'openai'): Promise<ChatbotResponse> {
    if (!message.trim()) {
      return {
        success: false,
        message: '',
        error: 'Tin nhắn không được để trống'
      };
    }

    try {
      // If provider is explicitly selected, use it
      if (provider === 'gemini') {
        try {
          const responseText = await this.callGemini(message);
          return { success: true, message: responseText };
        } catch (error) {
          if (error instanceof Error && error.message.includes('Authentication required')) {
            return {
              success: false,
              message: '',
              error: 'Vui lòng đăng nhập để sử dụng tính năng AI chatbot.'
            };
          }
          throw error;
        }
      }

      if (provider === 'openai') {
        try {
          const responseText = await this.callOpenAI(message);
          return { success: true, message: responseText };
        } catch (error) {
          if (error instanceof Error && error.message.includes('Authentication required')) {
            return {
              success: false,
              message: '',
              error: 'Vui lòng đăng nhập để sử dụng tính năng AI chatbot.'
            };
          }
          throw error;
        }
      }

      // Default: try Gemini first, then fallback to OpenAI
      try {
        const responseText = await this.callGemini(message);
        return { success: true, message: responseText };
      } catch (geminiError) {
        // Check if it's an authentication error
        if (geminiError instanceof Error && geminiError.message.includes('Authentication required')) {
          return {
            success: false,
            message: '',
            error: 'Vui lòng đăng nhập để sử dụng tính năng AI chatbot.'
          };
        }

        console.warn('Gemini failed, falling back to OpenAI:', geminiError);
        
        try {
          const responseText = await this.callOpenAI(message);
          return { success: true, message: responseText };
        } catch (openaiError) {
          // Check if it's an authentication error
          if (openaiError instanceof Error && openaiError.message.includes('Authentication required')) {
            return {
              success: false,
              message: '',
              error: 'Vui lòng đăng nhập để sử dụng tính năng AI chatbot.'
            };
          }

          console.error('Both Gemini and OpenAI failed:', { geminiError, openaiError });
          return {
            success: false,
            message: '',
            error: 'Cả Gemini và OpenAI đều gặp lỗi. Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.'
          };
        }
      }
    } catch (error) {
      console.error('Chatbot service error:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('Authentication required')) {
        return {
          success: false,
          message: '',
          error: 'Vui lòng đăng nhập để sử dụng tính năng AI chatbot.'
        };
      }

      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'
      };
    }
  }

  createUserMessage(content: string): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date()
    };
  }

  createAssistantMessage(content: string): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date()
    };
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;