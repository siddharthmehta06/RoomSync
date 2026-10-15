import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple Tailwind CSS classes cleanly, resolving conflicts automatically.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
