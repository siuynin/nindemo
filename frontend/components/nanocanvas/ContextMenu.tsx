import React, { useEffect, useRef, useState } from 'react';
import { BringToFrontIcon, DuplicateIcon, GenerateIcon, SendToBackIcon, TrashIcon, ExpandIcon, DownloadIcon, UpscaleIcon, PencilIcon } from '@/components/icons';
import { CanvasItem } from '@/types';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onBringToFront: () => void;
    onSendToBack: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onGenerateImage: () => void;
    onExpand: () => void;
    onDownload: () => void;
    onUpscale: () => void;
    onSetMagicFillMode: () => void;
    itemType?: CanvasItem['type'];
    isGenerationDisabled?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
    x, y, onClose, onBringToFront, onSendToBack, onDuplicate, onDelete, onGenerateImage, onExpand, onDownload, onUpscale, onSetMagicFillMode, itemType, isGenerationDisabled = false
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Smart positioning to show menu right at cursor position (similar to AIContextMenu)
    const getSmartPosition = () => {
        const menuWidth = 224; // w-56 = 14rem = 224px
        const menuHeight = 300; // Estimated height for menu items
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

    const menuItemClass = "w-full flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-indigo-500 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent";
    const iconClass = "w-5 h-5 mr-3";

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-56 bg-gray-800/80 backdrop-blur-md rounded-lg shadow-2xl p-2 border border-gray-700 animate-fade-in-up"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
        >
            <ul className="space-y-1">
                {itemType ? (
                    <>
                        {itemType === 'image' && (
                            <>
                                <li>
                                    <button onClick={onSetMagicFillMode} className={menuItemClass}>
                                        <PencilIcon className={iconClass} />Inpaint
                                    </button>
                                </li>
                                <li>
                                    <button onClick={onExpand} className={menuItemClass}>
                                        <ExpandIcon className={iconClass} /> Expand
                                    </button>
                                </li>
                                <li>
                                    <button onClick={onDownload} className={menuItemClass}>
                                        <DownloadIcon className={iconClass} /> Download
                                    </button>
                                </li>
                                <li>
                                    <button onClick={onUpscale} className={menuItemClass}>
                                        <UpscaleIcon className={iconClass} /> Upscale
                                    </button>
                                </li>
                            </>
                        )}
                        <li>
                            <button onClick={onBringToFront} className={menuItemClass}>
                                <BringToFrontIcon className={iconClass} /> Bring to Front
                            </button>
                        </li>
                        <li>
                            <button onClick={onSendToBack} className={menuItemClass}>
                                <SendToBackIcon className={iconClass} /> Send to Back
                            </button>
                        </li>
                        <li>
                            <button onClick={onDuplicate} className={menuItemClass}>
                                <DuplicateIcon className={iconClass} /> Duplicate
                            </button>
                        </li>
                        <div className="h-px bg-gray-600 my-1"></div>
                        <li>
                            <button onClick={onDelete} className={`${menuItemClass} text-red-400 hover:bg-red-500 hover:text-white`}>
                                <TrashIcon className={iconClass} /> Delete
                            </button>
                        </li>
                    </>
                ) : (
                    <li>
                        <button onClick={onGenerateImage} className={menuItemClass} disabled={isGenerationDisabled}>
                            <GenerateIcon className={iconClass} /> Generate Image
                        </button>
                    </li>
                )}
            </ul>
        </div>
    );
};

export default ContextMenu;