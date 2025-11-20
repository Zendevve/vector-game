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
    primary: "bg-white text-black border-white hover:bg-neutral-200 hover:border-neutral-200 active:scale-[0.99]",
    secondary: "bg-transparent text-white border-neutral-800 hover:border-white hover:bg-white/5 active:scale-[0.99]",
    danger: "bg-transparent text-red-600 border-red-900/30 hover:border-red-500 hover:bg-red-950/10 active:scale-[0.99]",
    ghost: "bg-transparent text-neutral-500 border-transparent hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3 text-xs",
    lg: "px-8 py-5 text-sm",
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
