import React from 'react';

interface TextAreaProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  disabled?: boolean;
  rows?: number;
  cols?: number;
  success?: boolean;
  error?: boolean;
  hint?: string;
  label?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  rows = 4,
  cols,
  success = false,
  error = false,
  hint,
  label,
}) => {
  let textareaClasses = `w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 resize-vertical ${className}`;

  if (disabled) {
    textareaClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    textareaClasses += ` border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <textarea
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        cols={cols}
        className={textareaClasses}
      />
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? 'text-error-500'
              : success
              ? 'text-success-500'
              : 'text-gray-500'
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;