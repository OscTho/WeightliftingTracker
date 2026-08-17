/**
 * Card — Lofte design system
 *
 * Variants:
 *   default     — standard surface (bg-card)
 *   elevated    — higher-contrast surface (bg-elevated), used for workout cards
 *   interactive — tappable card with hover/focus state
 *   highlight   — primary-tinted border for selected or featured content
 *   disabled    — muted, non-interactive
 *
 * Card sub-components:
 *   CardEyebrow  — small uppercase label above the title
 *   CardTitle    — main card heading
 *   CardMeta     — secondary metadata line
 */

import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'highlight' | 'disabled';

const variantMap: Record<CardVariant, string> = {
  default:     'bg-card border border-border',
  elevated:    'bg-elevated border border-border',
  interactive: 'bg-card border border-border cursor-pointer transition-colors hover:border-border/60 hover:bg-elevated active:bg-elevated/80',
  highlight:   'bg-card border-2 border-primary/40',
  disabled:    'bg-card border border-border opacity-50 pointer-events-none select-none',
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  as?: ElementType;
}

export function Card({ variant = 'default', as: As = 'div', className, children, ...props }: CardProps) {
  return (
    <As
      className={cn('rounded-xl p-5', variantMap[variant], className)}
      {...props}
    >
      {children}
    </As>
  );
}

// ── Sub-components ────────────────────────────────────────

export function CardEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-data text-[10px] uppercase tracking-widest text-primary', className)}>
      {children}
    </p>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('mt-1 font-display text-3xl font-semibold uppercase leading-tight', className)}>
      {children}
    </h2>
  );
}

export function CardMeta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('mt-1 text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn('my-4 border-t border-border', className)} />;
}
