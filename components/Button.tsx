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
  
  const baseStyles = "font-bold tracking-widest uppercase transition-all duration-200 focus:outline-none border select-none rounded-none flex items-center justify-center";
  
  const variants = {
    // Changed from solid white to outlined transparent for minimalist look
    primary: "bg-transparent text-white border-white/20 hover:border-white hover:bg-white/5 active:scale-[0.99]",
    secondary: "bg-transparent text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600 hover:bg-white/5 active:scale-[0.99]",
    danger: "bg-transparent text-red-800 border-red-900/30 hover:text-red-500 hover:border-red-500 hover:bg-red-950/10 active:scale-[0.99]",
    ghost: "bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-4 text-sm", // Reduced vertical padding for sleeker look
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