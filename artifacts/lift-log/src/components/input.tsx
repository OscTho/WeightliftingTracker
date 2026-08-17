/**
 * Form components — Lofte design system
 *
 * Input      — text / number / any <input> with optional label, hint, error
 * Select     — styled <select> with label
 * Toggle     — on/off switch (boolean)
 * Checkbox   — checkbox with label
 * RadioGroup — group of radio options
 *
 * All components share the same base style (height, radius, border, background)
 * and pick up colour + spacing tokens from index.css.
 */

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────
// Shared base
// ─────────────────────────────────────────────────────────

const labelCls = 'type-caption mb-2 block text-muted-foreground';

const fieldBase =
  'min-h-12 w-full rounded-lg border bg-card px-4 text-sm text-foreground ' +
  'outline-none transition-colors placeholder:text-muted-foreground/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const fieldNormal =
  'border-input hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/20';

const fieldError =
  'border-destructive hover:border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20';

// ─────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <label className="block">
      {label && <span className={labelCls}>{label}</span>}
      <input
        ref={ref}
        className={cn(fieldBase, error ? fieldError : fieldNormal, className)}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error        && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  )
);
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────

export interface SelectOption { value: string; label: string }

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export function Select({ label, options, error, className, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className={labelCls}>{label}</span>}
      <select
        className={cn(
          fieldBase, 'cursor-pointer',
          error ? fieldError : fieldNormal,
          className
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────

export interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3', disabled && 'cursor-not-allowed opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'tap relative h-7 w-12 rounded-full border transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked ? 'border-primary bg-primary' : 'border-input bg-card'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5.5 w-5.5 rounded-full bg-foreground shadow transition-transform',
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          )}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────
// Checkbox
// ─────────────────────────────────────────────────────────

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3', disabled && 'cursor-not-allowed opacity-50')}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'tap flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          checked ? 'border-primary bg-primary' : 'border-input bg-card'
        )}
      >
        {checked && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}

// ─────────────────────────────────────────────────────────
// RadioGroup
// ─────────────────────────────────────────────────────────

export interface RadioGroupProps<T extends string | number> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label?: string;
  disabled?: boolean;
}

export function RadioGroup<T extends string | number>({
  value, onChange, options, label, disabled
}: RadioGroupProps<T>) {
  return (
    <fieldset disabled={disabled} className="disabled:opacity-50">
      {label && <legend className={cn(labelCls, 'mb-3')}>{label}</legend>}
      <div className="space-y-2">
        {options.map(o => (
          <label key={String(o.value)} className="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={value === o.value}
              onClick={() => onChange(o.value)}
              className={cn(
                'tap flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                value === o.value ? 'border-primary bg-primary' : 'border-input bg-card'
              )}
            >
              {value === o.value && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
            </button>
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
