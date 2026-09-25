import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  DashboardPage,
  ProgrammeDetailPage,
  WorkoutPage,
} from '@/pages';
import { HistoryPage, ProfilePage, ProgrammePage } from '@/pages/mobile-core-pages';
import { LoginPage, SignupPage } from '@/pages/auth-pages';
import { DesignSystemPage } from '@/pages/design-system';
import { Shell } from '@/components/shell';
import { getGetCurrentSessionQueryKey, useGetCurrentSession, useStartWorkout } from '@workspace/api-client-react';
import {
  Route,
  Switch,
  useSearch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

// Disable React Query retries when running under Playwright (navigator.webdriver = true)
// so error states resolve immediately rather than after 3× exponential-backoff retries.
const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: isAutomated ? 0 : 3 },
  },
});

function StartWorkoutRoute() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { mutate, isPending, data, isError } = useStartWorkout();
  const params = new URLSearchParams(search);
  const programmeId = Number(params.get('programme'));
  const sessionNumber = Number(params.get('session'));
  useEffect(() => {
    if (Number.isFinite(programmeId) && Number.isFinite(sessionNumber) && !isPending && !data && !isError) {
      mutate({ data: { programmeId, sessionNumber } }, { onSuccess: (w) => setLocation(`/workout/${w.id}`) });
    }
  }, [programmeId, sessionNumber]);
  if (isError) return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="font-display text-3xl font-semibold uppercase">Couldn't start session</h1>
      <button
        className="mt-4 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        onClick={() => setLocation('/')}
      >
        Back to today
      </button>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="h-28 animate-pulse rounded-xl bg-elevated" />
      <p className="font-data text-xs uppercase tracking-widest text-muted-foreground">Setting up your session…</p>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Shell>
        <Switch>
          <Route path="/"                 component={DashboardPage}      />
          <Route path="/profile"          component={ProfilePage}        />
          <Route path="/programme"        component={ProgrammePage}      />
          <Route path="/programme/:id"    component={ProgrammeDetailPage}/>
          <Route path="/workout/start"    component={StartWorkoutRoute}  />
          <Route path="/workout/:id"      component={WorkoutPage}        />
          <Route path="/history"          component={HistoryPage}        />
          <Route path="/design"           component={DesignSystemPage}   />
          <Route                          component={NotFound}           />
        </Switch>
      </Shell>
    </RoutedErrorBoundary>
  );
}

function AuthBoundary() {
  const [location, setLocation] = useLocation();
  const session = useGetCurrentSession({ query: { retry: false, queryKey: getGetCurrentSessionQueryKey() } });
  const isAuthPage = location === '/login' || location === '/signup';
  useEffect(() => {
    const handleExpired = () => {
      queryClient.clear();
      setLocation(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    };
    window.addEventListener('lofte:auth-expired', handleExpired);
    return () => window.removeEventListener('lofte:auth-expired', handleExpired);
  }, [setLocation]);

  if (isAuthPage) {
    if (session.isSuccess) {
      return <RedirectToHome setLocation={setLocation} />;
    }
    return location === '/signup' ? <SignupPage /> : <LoginPage />;
  }

  if (session.isLoading) {
    return (
      <div className="grain flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="font-data text-xs uppercase tracking-widest text-muted-foreground">Restoring your session…</p>
      </div>
    );
  }

  if (session.isError && session.error?.status !== 401) {
    return (
      <div className="grain flex min-h-[100dvh] items-center justify-center bg-background px-5">
        <div className="w-full max-w-[402px] rounded-2xl border border-destructive/30 bg-card p-6" role="alert">
          <p className="type-section-heading">We couldn’t restore your session</p>
          <p className="mt-2 type-body-sm text-muted-foreground">Check your connection, then try again.</p>
          <button
            type="button"
            className="mt-5 min-h-12 w-full rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
            onClick={() => session.refetch()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (session.isError || !session.data) {
    return <RedirectToLogin location={location} setLocation={setLocation} />;
  }

  return <Router />;
}

function RedirectToHome({ setLocation }: { setLocation: (path: string) => void }) {
  useEffect(() => {
    setLocation('/');
  }, [setLocation]);
  return null;
}

function RedirectToLogin({ location, setLocation }: { location: string; setLocation: (path: string) => void }) {
  useEffect(() => {
    setLocation(`/login?next=${encodeURIComponent(location)}`);
  }, [location, setLocation]);
  return null;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
           <AuthBoundary />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
