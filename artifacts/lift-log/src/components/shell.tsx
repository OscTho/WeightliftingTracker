import { Link, useLocation } from 'wouter';
import { BarChart3, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

const items = [
  { href: '/', label: 'Track', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="grain min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-brand">
            <span className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground font-display text-xl font-bold leading-none">L</span>
            <span className="font-display text-xl font-bold uppercase tracking-[.08em]">Lofte</span>
          </Link>
          <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground font-display text-base font-bold" data-testid="link-header-profile">LO</Link>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg">
        <div className="flex justify-around gap-1 px-2">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' || location.startsWith('/workout') || location.startsWith('/programme') : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`tap flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                data-testid={`link-nav-${label.toLowerCase()}`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function LoadingBlock({ label = 'Loading training data' }: { label?: string }) {
  return (
    <div className="space-y-3" aria-label={label} data-testid="status-loading">
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export function ErrorBlock({ retry }: { retry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6" data-testid="status-error">
      <p className="font-display text-2xl uppercase">Couldn't load this page</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection, then try again.</p>
      {retry && <button onClick={retry} className="tap mt-4 rounded-md bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground" data-testid="button-retry">Try again</button>}
    </div>
  );
}

export function EmptyBlock({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center" data-testid="status-empty">
      <div className="mx-auto mb-4 h-2 w-14 bg-secondary" />
      <p className="font-display text-3xl uppercase">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{detail}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
