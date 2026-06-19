import React from 'react';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: 'teacher' | 'student'; // kept for backward compatibility if reference exists
}

export default function Logo({ className = '', variant = 'dark', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  // Keep consistency with the St. Michael's Portal brand colors (Amethyst #6B6998 vs White)
  const primaryColor = variant === 'dark' ? '#6B6998' : '#ffffff';
  
  return (
    <div className={`relative flex items-center justify-center text-[#6B6998] transition-transform ${className}`}>
      <GraduationCap 
        className={sizeClasses[size] || 'w-9 h-9'} 
        style={{ color: primaryColor }}
        strokeWidth={1.5}
      />
    </div>
  );
}
