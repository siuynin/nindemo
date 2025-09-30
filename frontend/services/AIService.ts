import { GoogleGenerativeAI } from '@google/generative-ai';
import userCreditService from './userCreditService';

class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private openaiApiKey: string | null = null;
  private toastCallback: ((type: 'success' | 'error' | 'warning' | 'info', message: string) => void) | null = null;
  
  // Credit pricing: 10 tokens = 0.01 credit
  private readonly TOKENS_PER_CREDIT = 10;
  private readonly CREDIT_PER_TOKEN = 0.001; // 0.01 credit / 10 tokens

  constructor() {
    // Initialize Gemini AI
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }

    // Initialize OpenAI API key
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  }

  // Set toast callback for notifications
  setToastCallback(callback: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void) {
    this.toastCallback = callback;
  }

  // Show toast notification
  private showToast(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    if (this.toastCallback) {
      this.toastCallback(type, message);
    }
  }

  // Get service status for debugging
  getStatus(): { available: boolean; service: string } {
    const services = [];
    if (this.gemini) services.push('Gemini');
    if (this.openaiApiKey) services.push('OpenAI');
    
    return {
      available: this.isAvailable(),
      service: services.length > 0 ? services.join(' + ') : 'None'
    };
  }
    
    // Get the appropriate prompt for each action
    private getPrompt(text: string, action: string): string {
      // Language mapping for translation prompts
      const languageMap: Record<string, string> = {
        translate_en: 'English',
        translate_vi: 'Vietnamese (Tiếng Việt)',
        translate_zh: 'Chinese (中文)',
        translate_ja: 'Japanese (日本語)',
        translate_ko: 'Korean (한국어)',
        translate_fr: 'French (Français)',
        translate_de: 'German (Deutsch)',
        translate_es: 'Spanish (Español)',
        translate_it: 'Italian (Italiano)',
        translate_pt: 'Portuguese (Português)',
        translate_ru: 'Russian (Русский)',
        translate_ar: 'Arabic (العربية)',
        translate_hi: 'Hindi (हिन्दी)',
        translate_th: 'Thai (ไทย)',
        translate_id: 'Indonesian (Bahasa Indonesia)',
        translate_ms: 'Malay (Bahasa Melayu)',
        translate_nl: 'Dutch (Nederlands)',
        translate_sv: 'Swedish (Svenska)',
        translate_no: 'Norwegian (Norsk)',
        translate_da: 'Danish (Dansk)',
        translate_fi: 'Finnish (Suomi)',
        translate_pl: 'Polish (Polski)',
        translate_tr: 'Turkish (Türkçe)',
        translate_he: 'Hebrew (עברית)',
        translate_cs: 'Czech (Čeština)',
        translate_hu: 'Hungarian (Magyar)',
        translate_ro: 'Romanian (Română)',
        translate_bg: 'Bulgarian (Български)',
        translate_hr: 'Croatian (Hrvatski)',
        translate_sk: 'Slovak (Slovenčina)',
        translate_sl: 'Slovenian (Slovenščina)',
        translate_et: 'Estonian (Eesti)',
        translate_lv: 'Latvian (Latviešu)',
        translate_lt: 'Lithuanian (Lietuvių)',
        translate_uk: 'Ukrainian (Українська)',
        translate_be: 'Belarusian (Беларуская)',
        translate_mk: 'Macedonian (Македонски)',
        translate_sr: 'Serbian (Српски)',
        translate_bs: 'Bosnian (Bosanski)',
        translate_me: 'Montenegrin (Crnogorski)',
        translate_al: 'Albanian (Shqip)',
        translate_mt: 'Maltese (Malti)'
      };
  
      const prompts: Record<string, string> = {
        rewrite: `Rewrite the following text to make it clearer and more engaging while maintaining the original meaning. Return only the rewritten text without any labels or explanations:\n\n"${text}"`,
        
        summary: `Provide a concise summary of the following text. Return only the summary without any labels or explanations:\n\n"${text}"`,
        
        translate: `Translate the following text to English (if it's not already in English, otherwise translate to Vietnamese). Return only the translation without any labels or explanations:\n\n"${text}"`,
        
        make_longer: `Expand and elaborate on the following text, adding more details and context while maintaining the original message. Return only the expanded text without any labels or explanations:\n\n"${text}"`,
        
        make_shorter: `Make the following text more concise while preserving the key information. Return only the concise version without any labels or explanations:\n\n"${text}"`,
        
        change_tone_professional: `Rewrite the following text in a professional tone. Return only the rewritten text without any labels or explanations:\n\n"${text}"`,
        
        change_tone_casual: `Rewrite the following text in a casual, friendly tone. Return only the rewritten text without any labels or explanations:\n\n"${text}"`,
        
        change_tone_friendly: `Rewrite the following text in a warm and friendly tone. Return only the rewritten text without any labels or explanations:\n\n"${text}"`,
        
        fix_grammar: `Fix any grammar, spelling, and punctuation errors in the following text. Return only the corrected text without any labels or explanations:\n\n"${text}"`,
        
        improve_writing: `Improve the writing quality of the following text by enhancing clarity, flow, and style. Return only the improved text without any labels or explanations:\n\n"${text}"`,
        
        simplify: `Simplify the following text to make it easier to understand. Return only the simplified text without any labels or explanations:\n\n"${text}"`,
        
        formal_style: `Rewrite the following text in a formal, academic style. Return only the rewritten text without any labels or explanations:\n\n"${text}"`,
        
        creative_style: `Rewrite the following text in a more creative and engaging style. Return only the rewritten text without any labels or explanations:\n\n"${text}"`,
        
        generate_content: `Generate detailed content based on this request. Do not use placeholders like "**topic**", "**pro 1**", "**con 1**" etc. Provide actual, specific, real content. Be creative and informative. Return only the actual content without any introductions, explanations, or labels:\n\n"${text}"`
      };
  
      // Handle specific language translations
      if (action.startsWith('translate_')) {
        const targetLanguage = languageMap[action];
        if (targetLanguage) {
          return `Translate the following text accurately to ${targetLanguage}. Maintain the original meaning, tone, and context. Preserve any formatting, punctuation, and special characters. Return only the translated text without any labels, explanations, or additional commentary:\n\n"${text}"`;
        }
      }
  
      return prompts[action] || prompts.rewrite;
    }

    // Process text with OpenAI via backend
    private async processWithOpenAI(text: string, action: string): Promise<string> {
      const prompt = this.getPrompt(text, action);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await fetch('http://localhost:8001/api/ai/process-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'gpt-3.5-turbo',
          max_tokens: 1024,
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
      
      return this.cleanResponse(data.data.text, action);
    }

    // Process text with Gemini via backend
    private async processWithGemini(text: string, action: string): Promise<string> {
      const prompt = this.getPrompt(text, action);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const response = await fetch('http://localhost:8001/api/ai/process-text-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'gemini-pro',
          max_tokens: 2048,
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
      
      return this.cleanResponse(data.data.text, action);
    }

    // Process text with AI using Gemini with OpenAI fallback
    async processText(text: string, action: string): Promise<string> {
      // Check credits before processing
      const creditCheck = await this.checkAndDeductCredits(text, action);
      if (!creditCheck.success) {
        throw new Error(creditCheck.message);
      }
  
      const estimatedCost = creditCheck.estimatedCost || 0.01;
      const inputLength = text.length;
      let outputText = '';
  
      try {
        // Try Gemini first via backend
        try {
          outputText = await this.processWithGemini(text, action);
          
          // Calculate actual cost based on real output
          const actualCost = this.calculateCreditCost(text, outputText);
          
          // Deduct credits for successful operation
          await this.deductCreditsForOperation(actualCost, action, inputLength, outputText.length);
          
          return outputText;
        } catch (error) {
          // Gemini API failed, try OpenAI fallback silently without warning toast
          
          // Try OpenAI as fallback
          try {
            outputText = await this.processWithOpenAI(text, action);
            
            // Calculate actual cost based on real output
            const actualCost = this.calculateCreditCost(text, outputText);
            
            // Deduct credits for successful operation
            await this.deductCreditsForOperation(actualCost, action, inputLength, outputText.length);
            
            return outputText;
          } catch (openaiError) {
            // Both services failed - only show user-friendly message
            throw new Error('Both Gemini and OpenAI failed. Please check your API configurations.');
          }
        }
        
        // If no Gemini, try OpenAI
        if (this.openaiApiKey) {
          try {
            outputText = await this.processWithOpenAI(text, action);
            
            // Calculate actual cost based on real output
            const actualCost = this.calculateCreditCost(text, outputText);
            
            // Deduct credits for successful operation
            await this.deductCreditsForOperation(actualCost, action, inputLength, outputText.length);
            
            return outputText;
          } catch (error) {
            // OpenAI API error - only show user-friendly message
            throw new Error('Failed to process text with OpenAI. Please check your API key.');
          }
        }
        
        throw new Error('No AI service available. Please configure Gemini or OpenAI API keys.');
      } catch (error) {
        // If it's a credit-related error, re-throw it
        if (error instanceof Error && error.message.includes('Insufficient credits')) {
          throw error;
        }
        
        // For other errors, still deduct minimum cost since API was called
        await this.deductCreditsForOperation(estimatedCost, action, inputLength, 0);
        throw error;
      }
    }

    // Clean and format the AI response
    private cleanResponse(response: string, action: string): string {
      let cleaned = response.trim();
      
      // Remove common prefixes that AI might add
      const prefixesToRemove = [
        'Here is the rewritten text:',
        'Here\'s the rewritten text:',
        'Rewritten text:',
        'Here is the summary:',
        'Here\'s the summary:',
        'Summary:',
        'Here is the translation:',
        'Here\'s the translation:',
        'Translation:',
        'Translated text:',
        'The translation is:',
        'The translated text is:',
        'In English:',
        'In Vietnamese:',
        'In Chinese:',
        'In Japanese:',
        'In Korean:',
        'In French:',
        'In German:',
        'In Spanish:',
        'In Italian:',
        'In Portuguese:',
        'In Russian:',
        'In Arabic:',
        'In Hindi:',
        'In Thai:',
        'In Indonesian:',
        'In Malay:',
        'In Dutch:',
        'In Swedish:',
        'In Norwegian:',
        'In Danish:',
        'In Finnish:',
        'In Polish:',
        'In Turkish:',
        'In Hebrew:',
        'In Czech:',
        'In Hungarian:',
        'In Romanian:',
        'In Bulgarian:',
        'In Croatian:',
        'In Slovak:',
        'In Slovenian:',
        'In Estonian:',
        'In Latvian:',
        'In Lithuanian:',
        'In Ukrainian:',
        'In Belarusian:',
        'In Macedonian:',
        'In Serbian:',
        'In Bosnian:',
        'In Montenegrin:',
        'In Albanian:',
        'In Maltese:',
        'Here is the expanded text:',
        'Here\'s the expanded text:',
        'Expanded text:',
        'Here is the concise version:',
        'Here\'s the concise version:',
        'Concise version:',
        'Here is the professional version:',
        'Here\'s the professional version:',
        'Professional version:',
        'Here is the casual version:',
        'Here\'s the casual version:',
        'Casual version:',
        'Here is the friendly version:',
        'Here\'s the friendly version:',
        'Friendly version:',
        'Here is the corrected text:',
        'Here\'s the corrected text:',
        'Corrected text:',
        'Here is the improved text:',
        'Here\'s the improved text:',
        'Improved text:',
        'Here is the simplified text:',
        'Here\'s the simplified text:',
        'Simplified text:',
        'Here is the formal version:',
        'Here\'s the formal version:',
        'Formal version:',
        'Here is the creative version:',
        'Here\'s the creative version:',
        'Creative version:'
      ];
      
      for (const prefix of prefixesToRemove) {
        if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
          cleaned = cleaned.substring(prefix.length).trim();
          break;
        }
      }
      
      // Remove quotes if the entire response is wrapped in them
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
          (cleaned.startsWith('\'') && cleaned.endsWith('\''))) {
        cleaned = cleaned.slice(1, -1);
      }
      
      // Remove colons at the beginning if they remain after prefix removal
      if (cleaned.startsWith(':')) {
        cleaned = cleaned.substring(1).trim();
      }
      
      return cleaned;
    }

    // Optimize prompt for better image generation
    async optimizePrompt(prompt: string): Promise<string> {
      if (!prompt.trim()) {
        throw new Error('Prompt cannot be empty');
      }
  
      // Check credits before processing
      const creditCheck = await this.checkAndDeductCredits(prompt, 'optimize');
      if (!creditCheck.success) {
        throw new Error(creditCheck.message);
      }
  
      const optimizationPrompt = `Optimize this image generation prompt to be more detailed and effective for AI image generation. Keep the core concept but enhance it with better descriptive words, artistic styles, and technical details. Return only the optimized prompt without any explanation:
  
      Original prompt: "${prompt}"`;
  
      try {
        const result = await this.processText(optimizationPrompt, 'optimize');
        return result || prompt; // Return original if optimization fails
      } catch (error) {
        // Failed to optimize prompt - only show user-friendly message
        throw new Error('Failed to optimize prompt. Please try again.');
      }
    }

    // Check if AI service is available
    isAvailable(): boolean {
      return this.gemini !== null || this.openaiApiKey !== null;
    }

    // Estimate token count (rough approximation)
    private estimateTokenCount(text: string): number {
      // Simple estimation: ~4 characters per token for English
      // For Vietnamese/Asian languages, we use ~2.5 characters per token
      const avgCharsPerToken = 3.5;
      return Math.ceil(text.length / avgCharsPerToken);
    }

    // Calculate credit cost based on token count
    private calculateCreditCost(inputText: string, outputText: string): number {
      const totalTokens = inputText.length + outputText.length;
      const creditCost = totalTokens * this.CREDIT_PER_TOKEN;
      
      // Return decimal value with minimum of 0.01 credits
      return Math.max(creditCost, 0.01);
    }

    // Check and deduct credits before processing
    private async checkAndDeductCredits(text: string, action: string): Promise<{ success: boolean; message?: string; estimatedCost?: number }> {
      try {
        // Estimate output length based on action type
        let estimatedOutputLength = text.length;
        switch (action) {
          case 'summary':
            estimatedOutputLength = Math.min(text.length * 0.3, 500); // ~30% of input or 500 chars max
            break;
          case 'make_shorter':
            estimatedOutputLength = Math.min(text.length * 0.5, 800); // ~50% of input or 800 chars max
            break;
          case 'make_longer':
            estimatedOutputLength = text.length * 2; // ~200% of input
            break;
          case 'generate_content':
            estimatedOutputLength = Math.max(text.length * 3, 1000); // Longer content generation
            break;
          default:
            estimatedOutputLength = text.length; // Same length for rewrite, translate, etc.
        }
  
        // Create dummy output for cost estimation
        const dummyOutput = 'x'.repeat(Math.ceil(estimatedOutputLength));
        const estimatedCost = this.calculateCreditCost(text, dummyOutput);
  
        // Check if user has sufficient credits
        const hasSufficientCredits = await userCreditService.checkSufficientCredits(estimatedCost);
        if (!hasSufficientCredits) {
          const errorMessage = `Không đủ credit. Bạn cần khoảng ${estimatedCost.toFixed(2)} credit cho thao tác này. Vui lòng nạp thêm credit để tiếp tục.`;
          
          return {
            success: false,
            message: errorMessage
          };
        }
  
        return { success: true, estimatedCost };
      } catch (error) {
        // Error checking credits - only return user-friendly message
        const errorMessage = 'Lỗi khi kiểm tra credit. Vui lòng thử lại.';
        
        return {
          success: false,
          message: errorMessage
        };
      }
    }

    // Deduct credits after successful processing
    private async deductCreditsForOperation(cost: number, action: string, inputLength: number, outputLength: number): Promise<boolean> {
      try {
        console.log('Attempting to deduct credits:', { cost, action, inputLength, outputLength });
        
        const result = await userCreditService.deductCredits({
          amount: cost,
          description: `AI ${action} operation (${inputLength} → ${outputLength} chars)`,
          operation_type: action
        });
  
        console.log('Credit deduction result:', result);
        
        if (!result.success) {
          // Credit deduction failed - only show user-friendly message
          this.showToast('error', `Credit deduction failed: ${result.message}`);
          return false;
        }
  
        console.log('Credits deducted successfully');
        return true;
      } catch (error) {
        // Error deducting credits - only show user-friendly message
        this.showToast('error', 'Failed to deduct credits. Please try again.');
        return false;
      }
    }
}

// Export singleton instance
export default new AIService();