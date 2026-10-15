import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({
  children,
  className,
  hoverable = false,
  glass = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-black/[0.06] transition-all duration-300",
        glass ? "glass-card" : "bg-white",
        hoverable ? "hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer" : "shadow-subtle",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => (
  <div className={cn("px-6 py-5 border-b border-black/[0.04]", className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className, ...props }) => (
  <div className={cn("p-6", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div className={cn("px-6 py-4 border-t border-black/[0.04] bg-surface-50/50 rounded-b-2xl", className)} {...props}>
    {children}
  </div>
);
