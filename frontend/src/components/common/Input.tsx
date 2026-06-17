import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightLabel?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', className = '', id, rightLabel, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const isPasswordType = type === 'password';

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between items-center w-full">
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-text-secondary select-none"
          >
            {label}
          </label>
          {rightLabel}
        </div>
        <div className="relative w-full">
          <input
            id={inputId}
            type={isPasswordType && showPassword ? 'text' : type}
            ref={ref}
            className={`glass-input px-4 py-3 ${isPasswordType ? 'pr-12' : ''} rounded-xl text-navy placeholder-navy/40 text-base shadow-sm focus:outline-none w-full ${
              error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''
            } ${className}`}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy focus:outline-none transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {error && (
          <span className="text-sm font-medium text-danger mt-0.5 animate-float-fast">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
