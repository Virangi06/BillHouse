import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'mint' | 'dark';
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'light',
  hoverEffect = false,
  onClick,
}) => {
  const baseStyles = 'rounded-3xl border transition-all duration-300';
  
  const variants = {
    light: 'glass-card',
    mint: 'glass-card-mint',
    dark: 'glass-card-dark text-white',
  };

  const hoverStyles = hoverEffect 
    ? 'hover:-translate-y-1 hover:shadow-glass-hover' 
    : '';

  const clickableStyles = onClick 
    ? 'cursor-pointer active:scale-98' 
    : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
