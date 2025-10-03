import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { PagesTimeline } from 'polotno/pages-timeline';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { createStore } from 'polotno/model/store';
import { setTranslations, setAPI } from 'polotno/config';
import SidePanel from 'polotno/side-panel/side-panel';
import AdminTopBar from '../components/AdminTopBar';
import aiService from '../services/AIService';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { observer } from 'mobx-react-lite';
import { Button, Menu, MenuItem, Popover, Position } from '@blueprintjs/core';

// Configure AI Write to use our AIService
setTranslations({
  text: {
    aiWrite: 'AI Write',
    aiWriteTooltip: 'Use AI to improve your text',
  }
}, { validate: false });

// Fallback AI Write function using direct Gemini API
const fallbackAIWrite = async (text: string, prompt: string): Promise<string> => {
  try {
    console.log(`[Fallback AI Write] Using direct Gemini API for text: "${text}" and prompt: "${prompt}"`);
    
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Extract the action from the prompt
    let action = 'rewrite';
    
    if (prompt.toLowerCase().includes('summary')) {
      action = 'summary';
    } else if (prompt.toLowerCase().includes('translate')) {
      action = 'translate';
    } else if (prompt.toLowerCase().includes('longer')) {
      action = 'make_longer';
    } else if (prompt.toLowerCase().includes('shorter')) {
      action = 'make_shorter';
    } else if (prompt.toLowerCase().includes('professional')) {
      action = 'change_tone_professional';
    } else if (prompt.toLowerCase().includes('casual')) {
      action = 'change_tone_casual';
    } else if (prompt.toLowerCase().includes('friendly')) {
      action = 'change_tone_friendly';
    } else if (prompt.toLowerCase().includes('grammar')) {
      action = 'fix_grammar';
    } else if (prompt.toLowerCase().includes('improve')) {
      action = 'improve_writing';
    } else if (prompt.toLowerCase().includes('simplify')) {
      action = 'simplify';
    } else if (prompt.toLowerCase().includes('formal')) {
      action = 'formal_style';
    } else if (prompt.toLowerCase().includes('creative')) {
      action = 'creative_style';
    }
    
    console.log(`[Fallback AI Write] Detected action: ${action}`);
    
    // Get the appropriate prompt for the action
    const aiPrompt = getPromptForAction(text, action);
    
    console.log(`[Fallback AI Write] Generated prompt: ${aiPrompt}`);
    
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const processedText = response.text();
    
    console.log(`[Fallback AI Write] Gemini response:`, processedText);
    
    return processedText.trim();
  } catch (error) {
    console.error('[Fallback AI Write] Error:', error);
    throw new Error(`Fallback AI failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get prompts for different actions
const getPromptForAction = (text: string, action: string): string => {
  const prompts: Record<string, string> = {
    rewrite: `Rewrite the following text to make it clearer and more engaging while maintaining the original meaning. Return only the rewritten text without any labels or explanations:

"${text}"`,
    
    summary: `Provide a concise summary of the following text. Return only the summary without any labels or explanations:

"${text}"`,
    
    translate: `Translate the following text to English (if it's not already in English, otherwise translate to Vietnamese). Return only the translation without any labels or explanations:

"${text}"`,
    
    make_longer: `Expand and elaborate on the following text, adding more details and context while maintaining the original message. Return only the expanded text without any labels or explanations:

"${text}"`,
    
    make_shorter: `Make the following text more concise while preserving the key information. Return only the concise version without any labels or explanations:

"${text}"`,
    
    change_tone_professional: `Rewrite the following text in a professional tone. Return only the rewritten text without any labels or explanations:

"${text}"`,
    
    change_tone_casual: `Rewrite the following text in a casual, friendly tone. Return only the rewritten text without any labels or explanations:

"${text}"`,
    
    change_tone_friendly: `Rewrite the following text in a warm and friendly tone. Return only the rewritten text without any labels or explanations:

"${text}"`,
    
    fix_grammar: `Fix any grammar, spelling, and punctuation errors in the following text. Return only the corrected text without any labels or explanations:

"${text}"`,
    
    improve_writing: `Improve the writing quality of the following text by enhancing clarity, flow, and style. Return only the improved text without any labels or explanations:

"${text}"`,
    
    simplify: `Simplify the following text to make it easier to understand. Return only the simplified text without any labels or explanations:

"${text}"`,
    
    formal_style: `Rewrite the following text in a formal, academic style. Return only the rewritten text without any labels or explanations:

"${text}"`,
    
    creative_style: `Rewrite the following text in a more creative and engaging style. Return only the rewritten text without any labels or explanations:

"${text}"`
  };
  
  return prompts[action] || prompts.rewrite;
};

// Custom AI Write function that uses our AIService with fallback
const customAIWrite = async (text: string, prompt: string) => {
  try {
    console.log(`[AI Write] Starting AI Write with text: "${text}" and prompt: "${prompt}"`);
    
    // Extract the action from the prompt
    let action = 'rewrite';
    
    if (prompt.toLowerCase().includes('summary')) {
      action = 'summary';
    } else if (prompt.toLowerCase().includes('translate')) {
      action = 'translate';
    } else if (prompt.toLowerCase().includes('longer')) {
      action = 'make_longer';
    } else if (prompt.toLowerCase().includes('shorter')) {
      action = 'make_shorter';
    } else if (prompt.toLowerCase().includes('professional')) {
      action = 'change_tone_professional';
    } else if (prompt.toLowerCase().includes('casual')) {
      action = 'change_tone_casual';
    } else if (prompt.toLowerCase().includes('friendly')) {
      action = 'change_tone_friendly';
    } else if (prompt.toLowerCase().includes('grammar')) {
      action = 'fix_grammar';
    } else if (prompt.toLowerCase().includes('improve')) {
      action = 'improve_writing';
    } else if (prompt.toLowerCase().includes('simplify')) {
      action = 'simplify';
    } else if (prompt.toLowerCase().includes('formal')) {
      action = 'formal_style';
    } else if (prompt.toLowerCase().includes('creative')) {
      action = 'creative_style';
    }
    
    console.log(`[AI Write] Detected action: ${action}`);
    
    // Try AIService first
    try {
      // Check if AIService is available
      const status = aiService.getStatus();
      console.log(`[AI Write] AIService status:`, status);
      
      if (status.available) {
        console.log(`[AI Write] Using AIService for processing`);
        const result = await aiService.processText(text, action);
        console.log(`[AI Write] AIService result:`, result);
        return result;
      } else {
        console.log(`[AI Write] AIService not available, trying fallback`);
      }
    } catch (aiserviceError) {
      console.error(`[AI Write] AIService failed:`, aiserviceError);
      console.log(`[AI Write] Trying fallback Gemini API`);
    }
    
    // Fallback to direct Gemini API
    console.log(`[AI Write] Using fallback Gemini API`);
    const fallbackResult = await fallbackAIWrite(text, prompt);
    console.log(`[AI Write] Fallback result:`, fallbackResult);
    return fallbackResult;
    
  } catch (error) {
    console.error('AI Write final error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process text with AI';
    throw new Error(`AI Write failed: ${errorMessage}`);
  }
};

// Configure Polotno to use our custom AI function
console.log('[CreativeEditor] Configuring Polotno AI Write with custom function');

// Override any existing configurations by setting up AI before store creation
import { setTranslations } from 'polotno/config';

// Set translations first to enable AI Write
setTranslations({
  text: {
    aiWrite: 'AI Write',
    aiWriteTooltip: 'Generate text using AI',
  }
}, { validate: false });

// Configure AI Write with a function that completely bypasses the default API
setAPI({
  aiWrite: async (text: string, prompt: string) => {
    console.log('[Polotno AI Write] Function called with:', { text, prompt });
    console.log('[Polotno AI Write] Using custom implementation, not api.polotno.com');
    try {
      const result = await customAIWrite(text, prompt);
      console.log('[Polotno AI Write] Result:', result);
      return result;
    } catch (error) {
      console.error('[Polotno AI Write] Error:', error);
      throw error;
    }
  }
});

// Also try to intercept any fetch calls to the default API
const originalFetch = window.fetch;
window.fetch = async (url, options) => {
  if (typeof url === 'string' && url.includes('api.polotno.com/api/ai/text')) {
    console.log('[Fetch Interceptor] Blocked call to api.polotno.com, using custom AI instead');
    throw new Error('Blocked: Using custom AI implementation instead of api.polotno.com');
  }
  return originalFetch(url, options);
};

// Custom TextAiWrite component that uses our AIService
const CustomTextAiWrite = observer(({ store }: { store: any }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const selectedElements = store.selectedElements;
  const textElement = selectedElements.length === 1 && selectedElements[0].type === 'text' ? selectedElements[0] : null;

  const aiActions = [
    { id: 'rewrite', label: '✏️ Rewrite Text', description: 'Make it clearer and more engaging' },
    { id: 'summary', label: '📝 Summarize', description: 'Create a concise summary' },
    { id: 'make_longer', label: '📏 Expand', description: 'Add more details and context' },
    { id: 'make_shorter', label: '🎯 Make Shorter', description: 'Make it more concise' },
    { id: 'fix_grammar', label: '✅ Fix Grammar', description: 'Correct grammar and spelling' },
    { id: 'improve_writing', label: '⭐ Improve Writing', description: 'Enhance clarity and style' },
    { id: 'simplify', label: '🎯 Simplify', description: 'Make it easier to understand' },
    { id: 'change_tone_professional', label: '💼 Professional Tone', description: 'Make it more professional' },
    { id: 'change_tone_casual', label: '😊 Casual Tone', description: 'Make it more casual' },
    { id: 'change_tone_friendly', label: '🤝 Friendly Tone', description: 'Make it more friendly' },
    { id: 'formal_style', label: '🎩 Formal Style', description: 'Make it more formal' },
    { id: 'creative_style', label: '🎨 Creative Style', description: 'Make it more creative' }
  ];

  const handleAIAction = async (actionId: string) => {
    if (!textElement || isProcessing) return;

    setIsProcessing(true);
    setIsOpen(false);

    try {
      const originalText = textElement.text;
      console.log(`[CustomTextAiWrite] Processing action: ${actionId} for text: "${originalText}"`);

      // Use AIService for processing
      const result = await aiService.processText(originalText, actionId);
      console.log(`[CustomTextAiWrite] AI result: ${result}`);

      // Update the text element with the AI result
      textElement.set({ text: result });

      // Show success notification
      if (Notification.permission === 'granted') {
        new Notification('AI Text Processing Complete!', {
          body: `Text has been ${actionId.replace('_', ' ')} successfully`,
        });
      }

    } catch (error) {
      console.error(`[CustomTextAiWrite] Error processing text:`, error);
      
      // Fallback to direct Gemini API
      try {
        console.log(`[CustomTextAiWrite] Trying fallback Gemini API`);
        const result = await fallbackAIWrite(textElement.text, actionId);
        textElement.set({ text: result });
      } catch (fallbackError) {
        console.error(`[CustomTextAiWrite] Fallback also failed:`, fallbackError);
        alert(`AI processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!textElement) {
    return null;
  }

  return (
    <Popover
      isOpen={isOpen}
      onInteraction={(nextOpenState) => setIsOpen(nextOpenState)}
      position={Position.BOTTOM}
      content={
        <Menu>
          {aiActions.map((action) => (
            <MenuItem
              key={action.id}
              text={action.label}
              label={action.description}
              onClick={() => handleAIAction(action.id)}
              disabled={isProcessing}
            />
          ))}
        </Menu>
      }
    >
      <Button
        icon="predictive-analysis"  // BlueprintJS icon for AI/writing
        text={isProcessing ? "Processing..." : "AI Write"}
        loading={isProcessing} 
      />
    </Popover>
  );
});

const CreativeEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Set up toast callback for AIService
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    aiService.setToastCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
      // Simple console-based notification
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] AI Service ${type.toUpperCase()}: ${message}`);
      
      // You can also use browser notifications if needed
      if (Notification.permission === 'granted') {
        new Notification(`AI ${type.toUpperCase()}`, {
          body: message,
          icon: '/favicon.ico'
        });
      }
    });
    
    // Debug: Check service status on component mount
    const status = aiService.getStatus();
    console.log('[CreativeEditor] AIService status on mount:', status);
    console.log('[CreativeEditor] Environment variables:');
    console.log('- VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? 'Set' : 'Not set');
    console.log('- VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not set');
    console.log('- VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'Not set (using default)');
    
    // Check auth token
    const authToken = localStorage.getItem('auth_token');
    console.log('[CreativeEditor] Auth token:', authToken ? 'Present' : 'Missing');
    
    // Test the AI Write configuration
    console.log('[CreativeEditor] Testing AI Write configuration...');
    setTimeout(() => {
      console.log('[CreativeEditor] Polotno AI Write should be configured now');
    }, 2000);
  }, []);
  
  // Load BlueprintJS CSS chỉ cho trang này
  useEffect(() => {
    // Tạo link elements cho BlueprintJS CSS
    const coreLink = document.createElement('link');
    coreLink.rel = 'stylesheet';
    coreLink.href = 'https://unpkg.com/@blueprintjs/core@5.x/lib/css/blueprint.css';
    
    const iconsLink = document.createElement('link');
    iconsLink.rel = 'stylesheet';
    iconsLink.href = 'https://unpkg.com/@blueprintjs/icons@5.x/lib/css/blueprint-icons.css';
    
    // Thêm vào head
    document.head.appendChild(coreLink);
    document.head.appendChild(iconsLink);
    
    // Cleanup function để xóa CSS khi component unmount
    return () => {
      if (document.head.contains(coreLink)) {
        document.head.removeChild(coreLink);
      }
      if (document.head.contains(iconsLink)) {
        document.head.removeChild(iconsLink);
      }
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const [store] = React.useState(() => {
    console.log('[CreativeEditor] Creating store with API key');
    console.log('[CreativeEditor] API Key:', import.meta.env.VITE_POLOTNO_API_KEY || 'nFA5H9elEytDyPyvKL7T');
    
    const newStore = createStore({
      key: import.meta.env.VITE_POLOTNO_API_KEY || 'nFA5H9elEytDyPyvKL7T', // Default key for development
      // you can hide back-link on a paid license
      // but it will be good if you can keep it for Polotno project support
      showCredit: false,
    });
    newStore.addPage();
    return newStore;
  });

  return (
    <div className="creative-editor-container" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* AdminTopBar với đầy đủ controls */}
      <AdminTopBar 
        onToggleSidebar={handleToggleSidebar}
        isSidebarOpen={isSidebarOpen}
        currentPage="creative-editor"
        onBackToDocument={() => navigate('/app/document')}
      /> 
       <style>{` 
        body {
         font-family: Outfit, Inter, sans-serif !important;
        }
       `}</style>
      {/* Polotno Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <PolotnoContainer style={{ width: '100%', height: '100%' }}>
          <SidePanelWrap>
            <SidePanel store={store} />
          </SidePanelWrap>
          <WorkspaceWrap>
            <Toolbar store={store} downloadButtonEnabled />
            <Workspace store={store} />
            <ZoomButtons store={store} />
            <PagesTimeline store={store} />
            {/* Custom AI Write Button for Text Elements */}
            <div style={{ position: 'absolute', top: '80px', right: '20px', zIndex: 1000 }}>
              <CustomTextAiWrite store={store} />
            </div>
          </WorkspaceWrap>
        </PolotnoContainer>
      </div>
    </div>
  );
};

export default CreativeEditorPage;