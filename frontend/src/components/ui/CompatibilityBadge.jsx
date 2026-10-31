import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Sparkles, AlertTriangle, CheckCircle2, SlidersHorizontal } from 'lucide-react';

export const CompatibilityBadge = ({
  score = null,
  showLabel = true,
  size = 'md',
  className,
  clickable = true,
}) => {
  const navigate = useNavigate();

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  // If score is null or undefined, do not render a badge on general room cards
  if (score === null || score === undefined || isNaN(Number(score))) {
    return null;
  }

  const percentage = Math.round(Number(score));

  let tier = {
    bg: 'bg-brand-50 text-brand-800 border-brand-200/80',
    icon: Sparkles,
    label: 'High Synergy',
    barColor: 'bg-brand-600',
  };

  if (percentage < 70) {
    tier = {
      bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      icon: AlertTriangle,
      label: 'Friction Points',
      barColor: 'bg-amber-500',
    };
  } else if (percentage < 85) {
    tier = {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      icon: CheckCircle2,
      label: 'Good Alignment',
      barColor: 'bg-emerald-600',
    };
  }

  const Icon = tier.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium shadow-2xs select-none",
        tier.bg,
        sizeStyles[size],
        className
      )}
      title={`Explainable compatibility calculated across 22 lifestyle factors: ${percentage}%`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="font-semibold">{percentage}%</span>
      {showLabel && (
        <span className="opacity-90 font-normal">· {tier.label}</span>
      )}
    </div>
  );
};
