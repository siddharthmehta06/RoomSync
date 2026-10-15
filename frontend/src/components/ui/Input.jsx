import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className,
  type = 'text',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-ink-primary mb-1.5 ml-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-tertiary">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={cn(
            "w-full bg-surface-50 border border-surface-200 text-ink-primary text-sm rounded-xl px-3.5 py-2.5 transition-all duration-200 placeholder:text-ink-tertiary/70",
            "focus:bg-white focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20",
            Icon && "pl-10",
            error && "border-rose-400 focus:border-rose-600 focus:ring-rose-500/20 bg-rose-50/20",
            className
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600 ml-0.5">{error}</p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-ink-tertiary ml-0.5">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
