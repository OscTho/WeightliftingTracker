/**
 * Button — Lofte design system
 *
 * 6 variants:  primary | secondary | tertiary | destructive | success | icon
 * 4 sizes:     sm | default | lg | icon
 * States:      default · hover · active (tap) · disabled · loading
 *
 * Workout buttons use size="lg" for large touch targets.
 * The primary workout action (Complete rep) uses variant="secondary" (gold)
 * to make it visually dominant.
 */

import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'success' | 'icon';
export type ButtonSize   = 'sm' | 'default' | 'lg' | 'icon';

const variantMap: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 ' +
    'focus-visible:ring-primary/50 disabled:bg-primary/30 disabled:text-primary-foreground/50',

  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 ' +
    'focus-visible:ring-secondary/50 disabled:bg-secondary/30 disabled:text-secondary-foreground/50',

  tertiary:
    'border border-border bg-transparent text-foreground hover:bg-card active:bg-elevated ' +
    'focus-visible:ring-ring/50 disabled:opacity-40',

  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 ' +
    'focus-visible:ring-destructive/50 disabled:bg-destructive/30',

  success:
    'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80 ' +
    'focus-visible:ring-success/50 disabled:bg-success/30',

  icon:
    'rounded-lg text-muted-foreground hover:bg-card hover:text-foreground active:bg-elevated ' +
    'focus-visible:ring-ring/50 disabled:opacity-40',
};

const sizeMap: Record<ButtonSize, string> = {
  sm:      'min-h-9 rounded-lg px-3 text-xs gap-1.5',
  default: 'min-h-12 rounded-lg px-5 text-sm gap-2',
  lg:      'min-h-16 rounded-xl px-6 text-base gap-2.5', // workout touch target
  icon:    'h-11 w-11 rounded-lg p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'tap inline-flex items-center justify-center font-semibold tracking-tight',
        'outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:cursor-not-allowed',
        variantMap[variant],
        sizeMap[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <Loader2 size={size === 'sm' ? 13 : 16} className="animate-spin" />
        : children}
    </button>
  );
}
