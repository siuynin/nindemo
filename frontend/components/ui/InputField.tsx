import type React from "react";
import type { FC } from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  label?: string;
}

const InputField: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  label,
}) => {
  const { actualTheme } = useTheme();
  
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 cursor-not-allowed ${actualTheme === 'dark' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100'}`;
  } else if (error) {
    inputClasses += ` border-red-500 focus:border-red-300 focus:ring-red-500/20 ${actualTheme === 'dark' ? 'text-red-400 border-red-500 focus:border-red-400' : ''}`;
  } else if (success) {
    inputClasses += ` border-green-500 focus:border-green-300 focus:ring-green-500/20 ${actualTheme === 'dark' ? 'text-green-400 border-green-500 focus:border-green-400' : ''}`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 ${actualTheme === 'dark' ? 'border-gray-600 text-white bg-gray-700 focus:border-blue-400' : ''}`;
  }

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-2 ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClasses}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {hint && (
        <p className={`mt-1 text-sm ${
          error ? (actualTheme === 'dark' ? 'text-red-400' : 'text-red-600') : 
          success ? (actualTheme === 'dark' ? 'text-green-400' : 'text-green-600') : 
          (actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
        }`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default InputField;