import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface AlertProps {
  variant: "success" | "error" | "warning" | "info"; // Alert type
  title?: string; // Title of the alert
  message: string; // Message of the alert
  onClose?: () => void; // Close handler
  showCloseButton?: boolean; // Whether to show close button
}

const Alert: React.FC<AlertProps> = ({
  variant,
  title,
  message,
  onClose,
  showCloseButton = true,
}) => {
  const { actualTheme } = useTheme();

  // Tailwind classes for each variant
  const variantClasses = {
    success: {
      container: `border-green-500 ${actualTheme === 'dark' ? 'border-green-500/30 bg-green-500/15' : 'bg-green-50'}`,
      icon: "text-green-500",
      text: actualTheme === 'dark' ? 'text-green-300' : 'text-green-800',
    },
    error: {
      container: `border-red-500 ${actualTheme === 'dark' ? 'border-red-500/30 bg-red-500/15' : 'bg-red-50'}`,
      icon: "text-red-500",
      text: actualTheme === 'dark' ? 'text-red-300' : 'text-red-800',
    },
    warning: {
      container: `border-yellow-500 ${actualTheme === 'dark' ? 'border-yellow-500/30 bg-yellow-500/15' : 'bg-yellow-50'}`,
      icon: "text-yellow-500",
      text: actualTheme === 'dark' ? 'text-yellow-300' : 'text-yellow-800',
    },
    info: {
      container: `border-blue-500 ${actualTheme === 'dark' ? 'border-blue-500/30 bg-blue-500/15' : 'bg-blue-50'}`,
      icon: "text-blue-500",
      text: actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-800',
    },
  };

  // Icon for each variant
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  // Get variant styles with fallback to 'info' if variant is invalid
  const currentVariant = variantClasses[variant] || variantClasses.info;
  const currentIcon = icons[variant] || icons.info;

  return (
    <div className={`rounded-lg border p-4 ${currentVariant.container}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${currentVariant.icon}`}>
          {currentIcon}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${currentVariant.text}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-1' : ''} text-sm ${currentVariant.text}`}>
            {message}
          </div>
        </div>
        {showCloseButton && onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentVariant.icon} ${actualTheme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;