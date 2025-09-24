import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private openaiApiKey: string | null = null;

  constructor() {
    // Initialize Gemini AI
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }
    
    // Initialize OpenAI API key
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
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

  // Process text with OpenAI
  private async processWithOpenAI(text: string, action: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured.');
    }

    const prompt = this.getPrompt(text, action);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return this.cleanResponse(data.choices[0].message.content, action);
  }

  // Process text with AI using Gemini with OpenAI fallback
  async processText(text: string, action: string): Promise<string> {
    // Try Gemini first
    if (this.gemini) {
      try {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = this.getPrompt(text, action);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();
        
        // Clean up the response
        return this.cleanResponse(generatedText, action);
      } catch (error) {
        console.warn('Gemini API failed, trying OpenAI fallback:', error);
        
        // Try OpenAI as fallback
        if (this.openaiApiKey) {
          try {
            return await this.processWithOpenAI(text, action);
          } catch (openaiError) {
            console.error('OpenAI fallback also failed:', openaiError);
            throw new Error('Both Gemini and OpenAI failed. Please check your API configurations.');
          }
        }
        
        throw new Error('Gemini failed and no OpenAI fallback available.');
      }
    }
    
    // If no Gemini, try OpenAI
    if (this.openaiApiKey) {
      try {
        return await this.processWithOpenAI(text, action);
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error('Failed to process text with OpenAI. Please check your API key.');
      }
    }
    
    throw new Error('No AI service available. Please configure Gemini or OpenAI API keys.');
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

    const optimizationPrompt = `Optimize this image generation prompt to be more detailed and effective for AI image generation. Keep the core concept but enhance it with better descriptive words, artistic styles, and technical details. Return only the optimized prompt without any explanation:

Original prompt: "${prompt}"`;

    try {
      const result = await this.processText(optimizationPrompt, 'optimize');
      return result || prompt; // Return original if optimization fails
    } catch (error) {
      console.error('Failed to optimize prompt:', error);
      throw new Error('Failed to optimize prompt. Please try again.');
    }
  }

  // Check if AI service is available
  isAvailable(): boolean {
    return this.gemini !== null || this.openaiApiKey !== null;
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
}

// Export singleton instance
export default new AIService();