import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  fullWidth = false,
  ...props 
}) {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl px-5 py-2.5 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  
  const variants = {
    primary: "bg-gradient-primary text-white shadow-indigo-500/25 focus:ring-indigo-500",
    secondary: "bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white shadow-none focus:ring-slate-500",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 shadow-none focus:ring-slate-500",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 shadow-none focus:ring-red-500",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
