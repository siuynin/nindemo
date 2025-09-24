import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AIContextMenu from './AIContextMenu';
import MagicContextMenu from './MagicContextMenu';
import AIService from '../services/AIService';
import { generateService } from '../services/generateService';
import { LoadingSpinner } from './icons';

const WriteAssistant: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [selectedText, setSelectedText] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [magicContextMenu, setMagicContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [contentRequest, setContentRequest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const keydownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (keydownTimeoutRef.current) {
        clearTimeout(keydownTimeoutRef.current);
      }
    };
  }, []);

  // Load content from generate ID if available
  useEffect(() => {
    const loadGeneratedContent = async () => {
      const generateId = localStorage.getItem('currentGenerateId');
      if (generateId && editorRef.current) {
        try {
          setIsLoading(true);
          const response = await generateService.getGenerate(parseInt(generateId));
          
          if (response.success && response.data.content) {
            // Set the content in the editor
            editorRef.current.setContent(response.data.content);
            
            // Clear the localStorage to prevent reloading on refresh
            localStorage.removeItem('currentGenerateId');
            
            // Show success toast
            setToast({
              message: 'Nội dung đã được tải thành công!',
              type: 'success',
              visible: true
            });
            
            // Hide toast after 3 seconds
            setTimeout(() => {
              setToast(prev => ({ ...prev, visible: false }));
            }, 3000);
          }
        } catch (error) {
          console.error('Error loading generated content:', error);
          setToast({
            message: 'Có lỗi xảy ra khi tải nội dung',
            type: 'error',
            visible: true
          });
          
          // Hide toast after 3 seconds
          setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
          }, 3000);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGeneratedContent();
  }, []); // Run once on mount

  const handleEditorInit = (evt: any, editor: any) => {
    editorRef.current = editor;
    
    // Load content after editor is initialized
    const loadGeneratedContent = async () => {
      const generateId = localStorage.getItem('currentGenerateId');
      if (generateId) {
        try {
          setIsLoading(true);
          const response = await generateService.getGenerate(parseInt(generateId));
          
          if (response.success && response.data.content) {
            // Set the content in the editor
            editor.setContent(response.data.content);
            
            // Clear the localStorage to prevent reloading on refresh
            localStorage.removeItem('currentGenerateId');
            
            // Show success toast
            setToast({
              message: 'Nội dung đã được tải thành công!',
              type: 'success',
              visible: true
            });
            
            // Hide toast after 3 seconds
            setTimeout(() => {
              setToast(prev => ({ ...prev, visible: false }));
            }, 3000);
          }
        } catch (error) {
          console.error('Error loading generated content:', error);
          setToast({
            message: 'Có lỗi xảy ra khi tải nội dung',
            type: 'error',
            visible: true
          });
          
          // Hide toast after 3 seconds
          setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
          }, 3000);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadGeneratedContent();
    
    // Add click event listener to show magic context menu with 3 second delay
    editor.on('click', (e: any) => {
      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      // Hide existing context menus immediately
      setContextMenu({ visible: false, x: 0, y: 0 });
      
      // Set 3 second delay for showing magic context menu
      clickTimeoutRef.current = setTimeout(() => {
        // Get click position
        const iframe = editor.getContainer().querySelector('iframe');
        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          const absoluteX = e.clientX + iframeRect.left;
          const absoluteY = e.clientY + iframeRect.top;
          
          setMagicContextMenu({
            visible: true,
            x: absoluteX,
            y: absoluteY
          });
        }
      }, 2500);
    });
    
    // Hide magic context menu when typing and show again after 3 seconds of inactivity
    editor.on('keydown', () => {
      // Clear existing timeouts
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (keydownTimeoutRef.current) {
        clearTimeout(keydownTimeoutRef.current);
      }
      
      // Hide menu immediately when typing
      setMagicContextMenu({ visible: false, x: 0, y: 0 });
      
      // Set 3 second delay to show menu after stopping typing
      keydownTimeoutRef.current = setTimeout(() => {
        const selection = editor.selection;
        if (selection) {
          const rect = selection.getRng().getBoundingClientRect();
          const iframe = editor.getContainer().querySelector('iframe');
          if (iframe) {
            const iframeRect = iframe.getBoundingClientRect();
            const absoluteX = rect.left + iframeRect.left;
            const absoluteY = rect.bottom + iframeRect.top;
            
            setMagicContextMenu({
              visible: true,
              x: absoluteX,
              y: absoluteY
            });
          }
        }
      }, 2500);
    });
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    
    if (editorRef.current) {
      const selection = editorRef.current.selection.getContent({ format: 'text' });
      if (selection.trim()) {
        setSelectedText(selection);
        
        // Get the TinyMCE iframe element to calculate correct coordinates
        const iframe = editorRef.current.getContainer().querySelector('iframe');
        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          // Calculate absolute position by adding iframe offset to event coordinates
          const absoluteX = e.clientX + iframeRect.left;
          const absoluteY = e.clientY + iframeRect.top;
          
          setContextMenu({
            visible: true,
            x: absoluteX,
            y: absoluteY
          });
        } else {
          // Fallback to original coordinates if iframe not found
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY
          });
        }
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleAIAction = useCallback(async (action: string) => {
    if (!editorRef.current) return;
    
    // Get current selection from editor
    const currentSelection = editorRef.current.selection.getContent({ format: 'text' });
    const textToProcess = currentSelection || selectedText;
    
    if (!textToProcess.trim()) {
      showToast(t.writeAssistant.selectTextFirst, 'warning');
      return;
    }
    
    setIsLoading(true);
    setContextMenu({ visible: false, x: 0, y: 0 });
    
    try {
      const result = await AIService.processText(textToProcess, action);
      
      // Format the AI result before inserting
      const formattedResult = formatAIResponse(result);
      
      // Replace selected text with formatted AI result
      editorRef.current.selection.setContent(formattedResult);
      
      showToast(t.writeAssistant.success[action as keyof typeof t.writeAssistant.success] || `${action} completed successfully!`, 'success');
    } catch (error) {
      console.error('AI processing error:', error);
      showToast(t.writeAssistant.aiProcessingError, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedText]);

  const hideContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const hideMagicContextMenu = () => {
    setMagicContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleInsertText = (text: string) => {
    if (editorRef.current) {
      // Insert text at current cursor position
      editorRef.current.insertContent(formatAIResponse(text));
      showToast('Text inserted successfully!', 'success');
    }
  };

  const handleInsertImage = (imageUrl: string) => {
    if (editorRef.current) {
      // Insert image at current cursor position
      const imageHtml = `<img src="${imageUrl}" alt="Generated image" style="max-width: 100%; height: auto;" />`;
      editorRef.current.insertContent(imageHtml);
      showToast('Image inserted successfully!', 'success');
    }
  };

  // Format AI response with automatic formatting
  const formatAIResponse = (text: string): string => {
    let formatted = text;
    
    // Convert lines starting with - to bullet points
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive bullet points in ul tags
    formatted = formatted.replace(/(<li>.*<\/li>\s*)+/gs, (match) => {
      return '<ul>' + match + '</ul>';
    });
    
    // Convert headlines (lines that are all caps or start with #)
    formatted = formatted.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Convert lines that are all uppercase (likely headlines) to h2
    formatted = formatted.replace(/^([A-Z][A-Z\s]{3,})$/gm, '<h2>$1</h2>');
    
    // Convert double line breaks to paragraph breaks
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    
    // Wrap in paragraph if not already wrapped in HTML tags
    if (!formatted.includes('<') || (!formatted.startsWith('<') && !formatted.includes('<p>'))) {
      formatted = '<p>' + formatted + '</p>';
    }
    
    return formatted;
  };

  const handleGenerateContent = async () => {
    if (!contentRequest.trim() || !editorRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const result = await AIService.processText(contentRequest, 'generate_content');
      
      // Format the AI result before inserting
      const formattedResult = formatAIResponse(result);
      
      // Get current content and append formatted new content
      const currentContent = editorRef.current.getContent();
      const newContent = currentContent + formattedResult;
      
      // Set the new content to editor
      editorRef.current.setContent(newContent);
      
      // Clear the request input
      setContentRequest('');
    } catch (error) {
      console.error('Content generation error:', error);
      alert('Error generating content. Please check your API configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateContent();
    }
  };

  return (
    <div className={`h-full flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className={`p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-medium ${
             theme === 'dark' ? 'text-white' : 'text-gray-800'
           }`}>{t.writeAssistant.title}</h3>
          {(isLoading || isGenerating) && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <LoadingSpinner className="w-4 h-4" />
              {isGenerating ? 'Generating Content...' : 'AI Processing...'}
            </div>
          )}
        </div>
      </div>
      
      {/* Editor Container */}
      <div className={`flex-1 overflow-hidden ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`h-full max-w-7xl mx-auto rounded-xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          <Editor
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            onInit={handleEditorInit}
            initialValue={`<p>${t.writeAssistant.placeholder}</p>`}
            init={{
              height: '100%',
              menubar: true,
              toolbar_mode: 'wrap',
              toolbar_sticky: true,
              skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
              content_css: theme === 'dark' ? '/tinymce/skins/content/dark/content.min.css' : '/tinymce/skins/content/default/content.min.css',
              body_class: theme === 'dark' ? 'mce-content-body-dark' : 'mce-content-body-light',
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks fontfamily fontsize | ' +
                'bold italic underline strikethrough | forecolor backcolor | ' +
                'alignleft aligncenter alignright alignjustify | ' +
                'bullist numlist outdent indent | link image media table | ' +
                'aiassistant | code preview fullscreen | removeformat help',
              content_style: `
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                  font-size: 14px; 
                  line-height: 1.6; 
                  padding: 20px; 
                  margin: 0;
                  ${theme === 'dark' ? 'background-color: #1f2937 !important; color: #f9fafb !important;' : 'background-color: #ffffff !important; color: #111827 !important;'}
                }
                .mce-content-body-dark {
                  background-color: #1f2937 !important;
                  color: #f9fafb !important;
                }
                .mce-content-body-light {
                  background-color: #ffffff !important;
                  color: #111827 !important;
                }
              `,
              contextmenu: false, // Disable default context menu
              branding: false,
              promotion: false,
              resize: false,
              statusbar: true,
              base_url: '/tinymce',
              suffix: '.min',
              elementpath: false,
              setup: (editor: any) => {
                // Add AI Writing Assistant button to toolbar
                editor.ui.registry.addMenuButton('aiassistant', {
                  text: '🤖 AI Assistant',
                  tooltip: 'AI Writing Assistant',
                  fetch: (callback: any) => {
                    const selection = editor.selection.getContent({ format: 'text' });
                    
                    if (!selection.trim()) {
                      callback([
                        {
                          type: 'menuitem',
                          text: 'Vui lòng chọn text trước',
                          enabled: false
                        }
                      ]);
                      return;
                    }
                    
                    const translateItems = [
                      { id: 'translate_en', label: '🇺🇸 English' },
                      { id: 'translate_vi', label: '🇻🇳 Tiếng Việt' },
                      { id: 'translate_zh', label: '🇨🇳 中文' },
                      { id: 'translate_ja', label: '🇯🇵 日本語' },
                      { id: 'translate_ko', label: '🇰🇷 한국어' },
                      { id: 'translate_fr', label: '🇫🇷 Français' },
                      { id: 'translate_de', label: '🇩🇪 Deutsch' },
                      { id: 'translate_es', label: '🇪🇸 Español' },
                      { id: 'translate_it', label: '🇮🇹 Italiano' },
                      { id: 'translate_pt', label: '🇵🇹 Português' },
                      { id: 'translate_ru', label: '🇷🇺 Русский' },
                      { id: 'translate_ar', label: '🇸🇦 العربية' },
                      { id: 'translate_hi', label: '🇮🇳 हिन्दी' },
                      { id: 'translate_th', label: '🇹🇭 ไทย' },
                      { id: 'translate_id', label: '🇮🇩 Bahasa Indonesia' },
                      { id: 'translate_ms', label: '🇲🇾 Bahasa Melayu' },
                      { id: 'translate_nl', label: '🇳🇱 Nederlands' },
                      { id: 'translate_sv', label: '🇸🇪 Svenska' },
                      { id: 'translate_no', label: '🇳🇴 Norsk' },
                      { id: 'translate_da', label: '🇩🇰 Dansk' },
                      { id: 'translate_fi', label: '🇫🇮 Suomi' },
                      { id: 'translate_pl', label: '🇵🇱 Polski' },
                      { id: 'translate_tr', label: '🇹🇷 Türkçe' },
                      { id: 'translate_he', label: '🇮🇱 עברית' },
                      { id: 'translate_cs', label: '🇨🇿 Čeština' },
                      { id: 'translate_hu', label: '🇭🇺 Magyar' },
                      { id: 'translate_ro', label: '🇷🇴 Română' },
                      { id: 'translate_bg', label: '🇧🇬 Български' },
                      { id: 'translate_hr', label: '🇭🇷 Hrvatski' },
                      { id: 'translate_sk', label: '🇸🇰 Slovenčina' },
                      { id: 'translate_sl', label: '🇸🇮 Slovenščina' },
                      { id: 'translate_et', label: '🇪🇪 Eesti' },
                      { id: 'translate_lv', label: '🇱🇻 Latviešu' },
                      { id: 'translate_lt', label: '🇱🇹 Lietuvių' },
                      { id: 'translate_uk', label: '🇺🇦 Українська' },
                      { id: 'translate_be', label: '🇧🇾 Беларуская' },
                      { id: 'translate_mk', label: '🇲🇰 Македонски' },
                      { id: 'translate_sr', label: '🇷🇸 Српски' },
                      { id: 'translate_bs', label: '🇧🇦 Bosanski' },
                      { id: 'translate_me', label: '🇲🇪 Crnogorski' },
                      { id: 'translate_al', label: '🇦🇱 Shqip' },
                      { id: 'translate_mt', label: '🇲🇹 Malti' }
                    ];
                    
                    const toneItems = [
                      { id: 'tone_professional', label: '💼 Professional' },
                      { id: 'tone_casual', label: '😊 Casual' },
                      { id: 'tone_friendly', label: '🤝 Friendly' },
                      { id: 'tone_formal', label: '🎩 Formal' },
                      { id: 'tone_creative', label: '🎨 Creative' },
                      { id: 'tone_confident', label: '💪 Confident' },
                      { id: 'tone_persuasive', label: '🎯 Persuasive' }
                    ];
                    
                    const aiActions = [
                      { id: 'rewrite', label: `✏️ ${t.writeAssistant.contextMenu.rewrite}` },
                      { id: 'summarize', label: `📝 ${t.writeAssistant.contextMenu.summarize}` },
                      { 
                        type: 'nestedmenuitem',
                        text: `🌐 ${t.writeAssistant.contextMenu.translate}`,
                        getSubmenuItems: () => translateItems.map(item => ({
                          type: 'menuitem',
                          text: item.label,
                          onAction: () => {
                            const selectedText = editor.selection.getContent({ format: 'text' });
                            if (selectedText.trim()) {
                              handleAIAction(item.id);
                            }
                          }
                        }))
                      },
                      { id: 'expand', label: `📏 ${t.writeAssistant.contextMenu.expand}` },
                      { id: 'improve', label: `⭐ ${t.writeAssistant.contextMenu.improve}` },
                      { id: 'grammar', label: `✅ ${t.writeAssistant.contextMenu.grammar}` },
                      {
                        type: 'nestedmenuitem',
                        text: `🎭 ${t.writeAssistant.contextMenu.tone}`,
                        getSubmenuItems: () => toneItems.map(item => ({
                          type: 'menuitem',
                          text: item.label,
                          onAction: () => {
                            const selectedText = editor.selection.getContent({ format: 'text' });
                            if (selectedText.trim()) {
                              handleAIAction(item.id);
                            }
                          }
                        }))
                      },
                      { id: 'simplify', label: `🎯 ${t.writeAssistant.contextMenu.simplify}` }
                    ];
                    
                    const menuItems = aiActions.map(action => {
                      if (action.type === 'separator') {
                        return { type: 'separator' };
                      }
                      if (action.type === 'nestedmenuitem') {
                        return {
                          type: 'nestedmenuitem',
                          text: action.text,
                          getSubmenuItems: action.getSubmenuItems
                        };
                      }
                      return {
                        type: 'menuitem',
                        text: action.label,
                        onAction: () => {
                          const selectedText = editor.selection.getContent({ format: 'text' });
                          if (selectedText.trim()) {
                            handleAIAction(action.id);
                          }
                        }
                      };
                    });
                    
                    callback(menuItems);
                  }
                });
                
                // Add context menu event listener
                editor.on('contextmenu', handleContextMenu);
              }
            }}
          />
        </div>
      </div>
      
      {/* Content Generation Form */}
      <div className={`p-4   ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="max-w-[500px] mx-auto">
          <div className="relative">
            {/* Animated gradient border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            
            {/* Main form container */}
            <div className={`relative rounded-2xl p-4 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-900'
            }`}>
              <div className="flex items-center gap-3">
                {/* Sparkle icon */}
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 text-purple-400">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                    </svg>
                  </div>
                </div>
                
                {/* Input field */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={contentRequest}
                    onChange={(e) => setContentRequest(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Keep writing the next paragraph..."
                    className="w-full bg-transparent text-white placeholder-gray-400 border-none outline-none text-sm py-2 px-0"
                    disabled={isGenerating}
                  />
                </div>
                
                {/* Submit button */}
                <button
                  onClick={handleGenerateContent}
                  disabled={!contentRequest.trim() || isGenerating}
                  className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                  title={isGenerating ? 'Đang tạo nội dung...' : 'Tạo nội dung'}
                >
                  {isGenerating ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AIContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        onAction={handleAIAction}
        onClose={hideContextMenu}
      />
      
      {magicContextMenu.visible && (
        <div className="animate-in fade-in duration-300">
          <MagicContextMenu
            x={magicContextMenu.x}
            y={magicContextMenu.y}
            onClose={hideMagicContextMenu}
            onInsertText={handleInsertText}
            onInsertImage={handleInsertImage}
          />
        </div>
      )}
      
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-md ${
            theme === 'dark'
              ? toast.type === 'success'
                ? 'bg-green-900/90 border-green-700 text-green-100'
                : toast.type === 'error'
                ? 'bg-red-900/90 border-red-700 text-red-100'
                : 'bg-yellow-900/90 border-yellow-700 text-yellow-100'
              : toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-sm font-medium">
              {toast.message}
            </div>
            <button
              onClick={closeToast}
              className={`flex-shrink-0 ml-2 p-1 rounded-md transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteAssistant;