import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  
  const baseStyles = "font-bold tracking-wider uppercase transition-all duration-200 focus:outline-none border";
  
  const variants = {
    primary: "bg-white text-black border-white hover:bg-gray-200 hover:border-gray-200 active:scale-[0.98]",
    secondary: "bg-transparent text-white border-white/20 hover:border-white hover:bg-white/5 active:scale-[0.98]",
    danger: "bg-transparent text-red-500 border-red-900/50 hover:border-red-500 hover:bg-red-500/10 active:scale-[0.98]",
    ghost: "bg-transparent text-gray-500 border-transparent hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs rounded-md",
    md: "px-6 py-3 text-sm rounded-md",
    lg: "px-8 py-4 text-base rounded-md",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};