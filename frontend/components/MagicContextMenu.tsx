import React, { useState, useRef, useEffect } from 'react';
import { runwareApi } from '../services/runwareApi';
import AIService from '../services/AIService';
import { useTheme } from '../contexts/ThemeContext';
import Input from './ui/Input';
import Button from './ui/Button';
import Alert from './ui/Alert';

interface MagicContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onInsertText: (text: string) => void;
  onInsertImage: (imageUrl: string) => void;
}

interface PromptModalProps {
  type: 'text' | 'image';
  onSubmit: (prompt: string, aspectRatio?: string) => void;
  onClose: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ type, onSubmit, onClose }) => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await onSubmit(prompt.trim(), type === 'image' ? aspectRatio : undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {type === 'text' ? '✨ Generate Text' : '🖼️ Generate Image'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={type === 'text' ? 'Enter your text prompt...' : 'Describe the image you want to generate...'}
              disabled={isLoading}
            />
          </div>
          
          {type === 'image' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
              >
                <option value="1:1">Square (1:1)</option>
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="3:4">Portrait (3:4)</option>
              </select>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              variant="primary"
              startIcon={isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : undefined}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MagicContextMenu: React.FC<MagicContextMenuProps> = ({ x, y, onClose, onInsertText, onInsertImage }) => {
  const { theme } = useTheme();
  const [showPromptModal, setShowPromptModal] = useState<'text' | 'image' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const menuRef = useRef<HTMLDivElement>(null);

  // Set up AIService toast callback
  React.useEffect(() => {
    AIService.setToastCallback((message: string, type: 'success' | 'error' | 'warning') => {
      setToast({
        message,
        type,
        visible: true
      });
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 4000);
    });
  }, []);

  const getSmartPosition = () => {
    const menuWidth = 160; // min-w-[160px]
    const menuHeight = 100; // estimated height for 2 items
    const padding = 10;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = x;
    let top = y;
    
    // Check if menu would overflow right edge
    if (left + menuWidth + padding > viewportWidth) {
      left = x - menuWidth; // Show to the left of cursor
    }
    
    // Check if menu would overflow bottom edge
    if (top + menuHeight + padding > viewportHeight) {
      top = y - menuHeight; // Show above cursor
    }
    
    // Ensure menu stays within viewport bounds
    left = Math.max(padding, Math.min(left, viewportWidth - menuWidth - padding));
    top = Math.max(padding, Math.min(top, viewportHeight - menuHeight - padding));
    
    return { left, top };
  };

  const position = getSmartPosition();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Không đóng menu nếu modal đang mở
      if (showPromptModal) return;
      
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showPromptModal) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showPromptModal]);

  const handleTextGeneration = async (prompt: string) => {
    try {
      // Use generate_content for pure text generation instead of rewrite
      const result = await AIService.processText(prompt, 'generate_content');
      onInsertText(result);
      setShowPromptModal(null);
      onClose();
    } catch (error) {
      console.error('Text generation failed:', error);
      alert('Failed to generate text. Please try again.');
    }
  };

  const handleImageGeneration = async (prompt: string, aspectRatio: string = '1:1') => {
    try {
      // Convert aspect ratio to width/height like ImageCreator
      const sizeMap: { [key: string]: { width: number; height: number } } = {
        '1:1': { width: 512, height: 512 },
        '16:9': { width: 1024, height: 576 },
        '9:16': { width: 576, height: 1024 },
        '4:3': { width: 1024, height: 768 },
        '3:4': { width: 768, height: 1024 }
      };
      
      const size = sizeMap[aspectRatio] || sizeMap['1:1'];
      
      const result = await runwareApi.generateImage({
        positivePrompt: prompt,
        model: 'rundiffusion:130@100',
        width: size.width,
        height: size.height,
        numberResults: 1
      });
      
      if (result && result.length > 0) {
        onInsertImage(result[0].imageURL);
        setShowPromptModal(null);
        onClose();
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  const menuItems = [
    {
      icon: '✨',
      label: 'General Text',
      onClick: () => setShowPromptModal('text')
    },
    {
      icon: '🖼️',
      label: 'General Image',
      onClick: () => setShowPromptModal('image')
    }
  ];

  return (
    <>
      <div
        ref={menuRef}
        className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-40 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-300"
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`,
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {showPromptModal && (
        <PromptModal
          type={showPromptModal}
          onSubmit={showPromptModal === 'text' ? handleTextGeneration : handleImageGeneration}
          onClose={() => setShowPromptModal(null)}
        />
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <Alert
            variant={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'warning'}
            message={toast.message}
            onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            showCloseButton
          />
        </div>
      )}
    </>
  );
};

export default MagicContextMenu;
export type { MagicContextMenuProps };