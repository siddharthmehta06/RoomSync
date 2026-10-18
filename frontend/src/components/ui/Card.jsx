import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({
  children,
  className,
  hoverable = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-surface-200 bg-white transition-all duration-200",
        hoverable ? "hover:shadow-card-hover hover:border-surface-300 cursor-pointer" : "shadow-subtle",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }) => (
  <div className={cn("px-5 py-4 border-b border-surface-200", className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className, ...props }) => (
  <div className={cn("p-5", className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }) => (
  <div className={cn("px-5 py-3.5 border-t border-surface-200 bg-surface-50/50 rounded-b-2xl", className)} {...props}>
    {children}
  </div>
);
