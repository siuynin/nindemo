import { ReactNode } from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  shadow = "sm",
  border = true,
  hover = false,
}) => {
  const { actualTheme } = useTheme();

  // Padding classes
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-theme-sm",
    md: "shadow-theme-md",
    lg: "shadow-theme-lg",
  };

  const baseClasses = `${actualTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl transition-all duration-200`;
  const borderClasses = border ? `border ${actualTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}` : "";
  const hoverClasses = hover ? "hover:shadow-theme-md hover:-translate-y-1" : "";

  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;