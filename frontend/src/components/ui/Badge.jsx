import React from 'react';
import { cn } from '../../utils/cn';

export const Badge = ({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  ...props
}) => {
  const variants = {
    teal: "bg-brand-50 text-brand-800 border-brand-200/60",
    neutral: "bg-surface-100 text-ink-secondary border-surface-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    amber: "bg-amber-50 text-amber-800 border-amber-200/60",
    rose: "bg-rose-50 text-rose-800 border-rose-200/60",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200/60",
    dark: "bg-ink-primary text-white border-transparent",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 rounded-full font-medium gap-1",
    md: "text-xs px-2.5 py-1 rounded-full font-medium gap-1.5",
    lg: "text-sm px-3.5 py-1.5 rounded-full font-medium gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border select-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};
