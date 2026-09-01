import { Link, useLocation } from 'wouter';
import { ClipboardList, Clock, PlayCircle, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Nav items — 4 tabs.
 * Track (home/today) is the central purpose of the app.
 * Programme, History, Profile are supporting destinations.
 */
const items = [
  { href: '/',          label: 'Track',     icon: PlayCircle },
  { href: '/programme', label: 'Plans',     icon: ClipboardList },
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
      {/* Page content */}
      <main className="mx-auto w-full max-w-[402px] pb-[105px]">{children}</main>

      {/* Bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[402px] border border-border bg-background"
        aria-label="Main navigation"
      >
        <div className="flex h-[76px] items-start justify-between gap-0 px-6 pt-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, location);
            return (
              <Link
                key={href}
                href={href}
                className={`tap flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl type-caption font-semibold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`link-nav-${label.toLowerCase()}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex h-7 items-start justify-center pb-2 pt-4">
          <div className="h-[5px] w-[139px] rounded-full bg-muted-foreground" />
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
