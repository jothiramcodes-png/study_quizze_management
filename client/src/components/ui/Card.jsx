import React from 'react';

export function Card({ children, className = '', padding = 'p-6', hover = false }) {
  return (
    <div className={`glass-card rounded-2xl ${padding} ${hover ? 'glass-card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}
