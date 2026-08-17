/**
 * BottomSheet — Lofte design system
 *
 * Mobile-optimised modal that slides up from the bottom of the screen.
 * Used for: confirming missed sets, retrying, editing, any contextual action.
 *
 * Props:
 *   open     — controls visibility
 *   onClose  — called when backdrop or close button is tapped
 *   title    — optional heading shown at the top of the sheet
 *   children — sheet content
 */

import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, subtitle, children, className }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        className={cn(
          'relative w-full rounded-t-2xl border-t border-border bg-card p-6',
          'animate-in slide-in-from-bottom duration-200',
          className
        )}
        style={{ boxShadow: 'var(--shadow-sheet)' }}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />

        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h2 className="font-display text-2xl font-semibold uppercase leading-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="tap shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
