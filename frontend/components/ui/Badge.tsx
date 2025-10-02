import React from 'react';

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
}

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  // Debug logging to help identify prop issues
  if (process.env.NODE_ENV === 'development') {
    console.log('Badge props:', { variant, color, size });
  }
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium";

  // Define size styles
  const sizeStyles = {
    sm: "text-xs", // Smaller padding and font size
    md: "text-sm", // Default padding and font size
  };

  // Define color styles for variants
  const variants = {
    light: {
      primary:
        "bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400",
      success:
        "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-500",
      error:
        "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-500",
      warning:
        "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-orange-400",
      info: "bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-500",
      light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
      dark: "bg-gray-500 text-white dark:bg-white/5 dark:text-white",
    },
    solid: {
      primary: "bg-blue-500 text-white dark:text-white",
      success: "bg-green-500 text-white dark:text-white",
      error: "bg-red-500 text-white dark:text-white",
      warning: "bg-yellow-500 text-white dark:text-white",
      info: "bg-blue-500 text-white dark:text-white",
      light: "bg-gray-400 dark:bg-white/5 text-white dark:text-white/80",
      dark: "bg-gray-700 text-white dark:text-white",
    },
  };

  // Safe access to variants with fallbacks
  const getVariantStyles = (variant: BadgeVariant, color: BadgeColor) => {
    try {
      const variantData = variants[variant];
      if (!variantData) {
        console.warn(`Badge variant "${variant}" not found, falling back to "light"`);
        return variants.light[color] || variants.light.primary;
      }
      
      const colorStyle = variantData[color];
      if (!colorStyle) {
        console.warn(`Badge color "${color}" not found in variant "${variant}", falling back to "primary"`);
        return variantData.primary || variants.light.primary;
      }
      
      return colorStyle;
    } catch (error) {
      console.error('Error accessing Badge styles:', error);
      return variants.light.primary; // Ultimate fallback
    }
  };

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size] || sizeStyles.md;
  const colorStyles = getVariantStyles(variant, color);

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;