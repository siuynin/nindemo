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
    if (!this.geminiClient || !this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.geminiClient.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp" // Using Gemini 2.0 Flash as it's the latest available
      });

      const detectedLang = this.detectLanguage(message);
      const systemPrompt = this.getSystemPrompt(detectedLang);

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: message }
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private async callOpenAI(message: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const detectedLang = this.detectLanguage(message);
      const systemPrompt = this.getSystemPrompt(detectedLang);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<ChatbotResponse> {
    if (!message.trim()) {
      return {
        success: false,
        message: '',
        error: 'Tin nhắn không được để trống'
      };
    }

    try {
      // Try Gemini first
      let responseText: string;
      try {
        responseText = await this.callGemini(message);
      } catch (geminiError) {
        console.warn('Gemini failed, falling back to OpenAI:', geminiError);
        // Fallback to OpenAI
        responseText = await this.callOpenAI(message);
      }

      return {
        success: true,
        message: responseText
      };
    } catch (error) {
      console.error('Both AI services failed:', error);
      return {
        success: false,
        message: '',
        error: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
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