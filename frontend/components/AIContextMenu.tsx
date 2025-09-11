import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AIContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  onAction: (actionId: string) => void;
  onClose: () => void;
}

const AIContextMenu: React.FC<AIContextMenuProps> = ({ visible, x, y, onAction, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);
  
  if (!visible) return null;

  const aiActions = [
    { id: 'rewrite', label: `✏️ ${t.writeAssistant.contextMenu.rewrite}`, description: 'Rewrite the selected text' },
    { id: 'summarize', label: `📝 ${t.writeAssistant.contextMenu.summarize}`, description: 'Create a summary' },
    { 
      id: 'translate', 
      label: `🌐 ${t.writeAssistant.contextMenu.translate}`, 
      description: 'Translate to another language',
      submenu: [
         { id: 'translate_en', label: '🇺🇸 English', description: 'Translate to English' },
         { id: 'translate_vi', label: '🇻🇳 Tiếng Việt', description: 'Translate to Vietnamese' },
         { id: 'translate_zh', label: '🇨🇳 中文', description: 'Translate to Chinese' },
         { id: 'translate_ja', label: '🇯🇵 日本語', description: 'Translate to Japanese' },
         { id: 'translate_ko', label: '🇰🇷 한국어', description: 'Translate to Korean' },
         { id: 'translate_fr', label: '🇫🇷 Français', description: 'Translate to French' },
         { id: 'translate_de', label: '🇩🇪 Deutsch', description: 'Translate to German' },
         { id: 'translate_es', label: '🇪🇸 Español', description: 'Translate to Spanish' },
         { id: 'translate_it', label: '🇮🇹 Italiano', description: 'Translate to Italian' },
         { id: 'translate_pt', label: '🇵🇹 Português', description: 'Translate to Portuguese' },
         { id: 'translate_ru', label: '🇷🇺 Русский', description: 'Translate to Russian' },
         { id: 'translate_ar', label: '🇸🇦 العربية', description: 'Translate to Arabic' },
         { id: 'translate_hi', label: '🇮🇳 हिन्दी', description: 'Translate to Hindi' },
         { id: 'translate_th', label: '🇹🇭 ไทย', description: 'Translate to Thai' },
         { id: 'translate_id', label: '🇮🇩 Bahasa Indonesia', description: 'Translate to Indonesian' },
         { id: 'translate_ms', label: '🇲🇾 Bahasa Melayu', description: 'Translate to Malay' },
         { id: 'translate_nl', label: '🇳🇱 Nederlands', description: 'Translate to Dutch' },
         { id: 'translate_sv', label: '🇸🇪 Svenska', description: 'Translate to Swedish' },
         { id: 'translate_no', label: '🇳🇴 Norsk', description: 'Translate to Norwegian' },
         { id: 'translate_da', label: '🇩🇰 Dansk', description: 'Translate to Danish' },
         { id: 'translate_fi', label: '🇫🇮 Suomi', description: 'Translate to Finnish' },
         { id: 'translate_pl', label: '🇵🇱 Polski', description: 'Translate to Polish' },
         { id: 'translate_tr', label: '🇹🇷 Türkçe', description: 'Translate to Turkish' },
         { id: 'translate_he', label: '🇮🇱 עברית', description: 'Translate to Hebrew' },
         { id: 'translate_cs', label: '🇨🇿 Čeština', description: 'Translate to Czech' },
         { id: 'translate_hu', label: '🇭🇺 Magyar', description: 'Translate to Hungarian' },
         { id: 'translate_ro', label: '🇷🇴 Română', description: 'Translate to Romanian' },
         { id: 'translate_bg', label: '🇧🇬 Български', description: 'Translate to Bulgarian' },
         { id: 'translate_hr', label: '🇭🇷 Hrvatski', description: 'Translate to Croatian' },
         { id: 'translate_sk', label: '🇸🇰 Slovenčina', description: 'Translate to Slovak' },
         { id: 'translate_sl', label: '🇸🇮 Slovenščina', description: 'Translate to Slovenian' },
         { id: 'translate_et', label: '🇪🇪 Eesti', description: 'Translate to Estonian' },
         { id: 'translate_lv', label: '🇱🇻 Latviešu', description: 'Translate to Latvian' },
         { id: 'translate_lt', label: '🇱🇹 Lietuvių', description: 'Translate to Lithuanian' },
         { id: 'translate_uk', label: '🇺🇦 Українська', description: 'Translate to Ukrainian' },
         { id: 'translate_be', label: '🇧🇾 Беларуская', description: 'Translate to Belarusian' },
         { id: 'translate_mk', label: '🇲🇰 Македонски', description: 'Translate to Macedonian' },
         { id: 'translate_sr', label: '🇷🇸 Српски', description: 'Translate to Serbian' },
         { id: 'translate_bs', label: '🇧🇦 Bosanski', description: 'Translate to Bosnian' },
         { id: 'translate_me', label: '🇲🇪 Crnogorski', description: 'Translate to Montenegrin' },
         { id: 'translate_al', label: '🇦🇱 Shqip', description: 'Translate to Albanian' },
         { id: 'translate_mt', label: '🇲🇹 Malti', description: 'Translate to Maltese' }
       ]
    },
    { id: 'expand', label: `📏 ${t.writeAssistant.contextMenu.expand}`, description: 'Expand the content' },
    { id: 'improve', label: `⭐ ${t.writeAssistant.contextMenu.improve}`, description: 'Enhance writing quality' },
    { id: 'grammar', label: `✅ ${t.writeAssistant.contextMenu.grammar}`, description: 'Correct grammar and spelling' },
    {
      id: 'tone',
      label: `🎭 ${t.writeAssistant.contextMenu.tone}`,
      description: 'Change tone',
      submenu: [
        { id: 'tone_professional', label: '💼 Professional', description: 'Make it more professional' },
        { id: 'tone_casual', label: '😊 Casual', description: 'Make it more casual' },
        { id: 'tone_friendly', label: '🤝 Friendly', description: 'Make it more friendly' },
        { id: 'tone_formal', label: '🎩 Formal', description: 'Make it more formal' },
        { id: 'tone_creative', label: '🎨 Creative', description: 'Make it more creative' },
        { id: 'tone_confident', label: '💪 Confident', description: 'Make it more confident' },
        { id: 'tone_persuasive', label: '🎯 Persuasive', description: 'Make it more persuasive' }
      ]
    },
    { id: 'simplify', label: `🎯 ${t.writeAssistant.contextMenu.simplify}`, description: 'Make it easier to understand' }
  ];

  const handleAction = (actionId: string) => {
    onAction(actionId);
  };

  // Smart positioning to show menu right at cursor position
  const getSmartPosition = () => {
    const menuWidth = 320; // Max width of menu
    const menuHeight = 400; // Estimated height
    const padding = 10;
    
    let left = x;
    let top = y;
    
    // Check if menu would go off right edge
    if (x + menuWidth > window.innerWidth - padding) {
      left = x - menuWidth; // Show to the left of cursor
    }
    
    // Check if menu would go off bottom edge
    if (y + menuHeight > window.innerHeight - padding) {
      top = y - menuHeight; // Show above cursor
    }
    
    // Ensure menu stays within viewport bounds
    left = Math.max(padding, left);
    top = Math.max(padding, top);
    
    return { left, top };
  };
  
  const position = getSmartPosition();

  return (
    <>
      <div 
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
      />
      <div 
        className={`fixed rounded-lg shadow-xl border py-2 min-w-[280px] max-w-[320px] z-[9999] ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-200'
        }`}
        style={{
          left: position.left,
          top: position.top,
        }}
      >
        <div className={`px-4 py-2 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className={`font-medium text-sm ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>AI Writing Assistant</span>
          </div>
        </div>
        
        <div className="py-1">
          {aiActions.map(action => (
            <div 
              key={action.id} 
              className="relative"
              onMouseEnter={() => action.submenu && setHoveredSubmenu(action.id)}
              onMouseLeave={() => setHoveredSubmenu(null)}
            >
              <button
                className={`w-full text-left px-4 py-3 transition-colors group flex items-center justify-between ${
                  theme === 'dark'
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => !action.submenu && handleAction(action.id)}
              >
                <div>
                  <div className={`font-medium text-sm ${
                    theme === 'dark'
                      ? 'text-gray-300 group-hover:text-white'
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {action.label}
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {action.description}
                  </div>
                </div>
                {action.submenu && (
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                  }`}>▶</span>
                )}
              </button>
              
              {/* Submenu */}
              {action.submenu && hoveredSubmenu === action.id && (
                <div 
                  className={`absolute left-full top-0 ml-1 rounded-lg shadow-xl border py-2 min-w-[200px] z-[10000] ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {action.submenu.map(subAction => (
                    <button
                      key={subAction.id}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      }`}
                      onClick={() => handleAction(subAction.id)}
                      title={subAction.description}
                    >
                      {subAction.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AIContextMenu;