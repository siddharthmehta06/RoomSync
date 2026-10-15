import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  isLoading = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]";

  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-2xs",
    secondary: "bg-white hover:bg-surface-50 text-ink-primary border border-surface-200 shadow-2xs hover:border-surface-300",
    outline: "bg-transparent border border-surface-200 hover:border-surface-300 text-ink-primary hover:bg-white",
    ghost: "bg-transparent text-ink-secondary hover:text-ink-primary hover:bg-surface-100/70",
    dark: "bg-ink-primary hover:bg-black text-white shadow-2xs",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-xl gap-2",
    lg: "text-sm sm:text-base px-5 py-2.5 rounded-xl gap-2",
    pill: "text-xs sm:text-sm px-4 py-2 rounded-full gap-2",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
});

Button.displayName = 'Button';
