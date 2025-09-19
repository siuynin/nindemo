import type React from "react";
import type { FC } from "react";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | "url" | "tel" | "search";
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  required?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  label?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  className = "",
  min,
  max,
  step,
  disabled = false,
  required = false,
  success = false,
  error = false,
  hint,
  label,
  startIcon,
  endIcon,
}) => {
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-4 transition-all duration-200 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 ${className}`;

  // Add padding for icons
  if (startIcon) {
    inputClasses += " pl-10";
  }
  if (endIcon) {
    inputClasses += " pr-10";
  }

  if (disabled) {
    inputClasses += " text-gray-500 border-gray-300 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600";
  } else if (error) {
    inputClasses += " border-error-500 focus:border-error-300 focus:ring-error-100 dark:border-error-500 dark:focus:border-error-400";
  } else if (success) {
    inputClasses += " border-success-500 focus:border-success-300 focus:ring-success-100 dark:border-success-500 dark:focus:border-success-400";
  } else {
    inputClasses += " bg-white text-gray-900 border-gray-300 focus:border-brand-500 focus:ring-brand-100 dark:border-gray-600 dark:text-white dark:focus:border-brand-400";
  }

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {startIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">
              {startIcon}
            </span>
          </div>
        )}
        
        <input
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          required={required}
          className={inputClasses}
        />
        
        {endIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 dark:text-gray-500">
              {endIcon}
            </span>
          </div>
        )}
      </div>

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;