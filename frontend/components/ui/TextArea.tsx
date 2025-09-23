import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface TextareaProps {
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // Change handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
  label?: string; // Label text
  id?: string; // Input id
  name?: string; // Input name
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
  label,
  id,
  name,
}) => {
  const { actualTheme } = useTheme();
  
  let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${className}`;

  if (disabled) {
    textareaClasses += ` opacity-50 text-gray-500 border-gray-300 cursor-not-allowed ${actualTheme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100'}`;
  } else if (error) {
    textareaClasses += ` bg-transparent border-red-500 focus:border-red-300 focus:ring-red-500/20 ${actualTheme === 'dark' ? 'border-red-500 bg-gray-700 text-white focus:border-red-400' : ''}`;
  } else {
    textareaClasses += ` bg-transparent border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 ${actualTheme === 'dark' ? 'text-gray-300 border-gray-600 bg-gray-700 text-white focus:border-blue-400' : 'text-gray-900'}`;
  }

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p className={`mt-1 text-sm ${
          error ? (actualTheme === 'dark' ? 'text-red-400' : 'text-red-600') : (actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
        }`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;