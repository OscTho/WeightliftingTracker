import { Link, useLocation } from 'wouter';
import { BarChart3, Clock, Layers, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Nav items — 4 tabs.
 * Track (home/today) is the central purpose of the app.
 * Programme, History, Profile are supporting destinations.
 */
const items = [
  { href: '/',          label: 'Track',     icon: BarChart3 },
  { href: '/programme', label: 'Plans',     icon: Layers    },
  { href: '/history',   label: 'History',   icon: Clock     },
  { href: '/profile',   label: 'Profile',   icon: UserRound },
];

function isActive(href: string, location: string) {
  if (href === '/') return location === '/' || location.startsWith('/workout');
  return location.startsWith(href);
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="grain min-h-[100dvh] bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-primary font-display text-lg font-semibold leading-none text-primary-foreground">L</span>
            <span className="font-display text-xl font-semibold uppercase tracking-[.06em]">Lofte</span>
          </Link>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated font-display text-sm font-semibold text-foreground"
            aria-label="Profile"
            data-testid="link-header-profile"
          >
            LO
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="px-4 pb-28 pt-6">{children}</main>

      {/* Bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg"
        aria-label="Main navigation"
      >
        <div className="flex gap-1 px-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, location);
            return (
              <Link
                key={href}
                href={href}
                className={`tap flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg type-caption font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`link-nav-${label.toLowerCase()}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Shared feedback blocks
// ─────────────────────────────────────────────────────────

export function LoadingBlock({ label = 'Loading training data' }: { label?: string }) {
  return (
    <div className="space-y-3" aria-label={label} data-testid="status-loading">
      <div className="h-28 animate-pulse rounded-xl bg-elevated" />
      <div className="h-16 animate-pulse rounded-xl bg-elevated" />
      <div className="h-10 animate-pulse rounded-xl bg-elevated" />
    </div>
  );
}

export function ErrorBlock({ retry }: { retry?: () => void }) {
  return (
    <div
      className="rounded-xl border border-destructive/30 bg-destructive/8 p-6"
      role="alert"
      data-testid="status-error"
    >
      <p className="type-section-heading">Couldn't load this page</p>
      <p className="mt-1 type-body-sm text-muted-foreground">Check your connection, then try again.</p>
      {retry && (
        <button
          onClick={retry}
          className="tap mt-4 rounded-lg bg-destructive px-5 py-3 type-button text-destructive-foreground"
          data-testid="button-retry"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({
  title, detail, action,
}: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div
      className="rounded-xl border border-dashed border-border bg-card p-8 text-center"
      data-testid="status-empty"
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-secondary" />
      <p className="type-section-heading">{title}</p>
      <p className="mx-auto mt-2 max-w-sm type-body-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
