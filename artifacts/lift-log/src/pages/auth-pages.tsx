import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetCurrentSessionQueryKey,
  useLogin,
  useSignup,
} from '@workspace/api-client-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';

function errorMessage(error: unknown, fallback: string) {
  const candidate = error as { message?: string; data?: { error?: string } } | undefined;
  return candidate?.data?.error || candidate?.message || fallback;
}

function AuthLayout({ children, title, detail }: { children: React.ReactNode; title: string; detail: string }) {
  return (
    <main className="grain flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[402px]">
        <div className="mb-10">
          <p className="font-display text-xl font-bold uppercase tracking-[-.04em] text-primary">Lofte</p>
          <p className="mt-12 type-caption text-primary">Training log</p>
          <h1 className="mt-2 type-page-title">{title}</h1>
          <p className="mt-3 type-body-sm text-muted-foreground">{detail}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function LoginPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const next = new URLSearchParams(window.location.search).get('next') || '/';
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!loginValue.trim() || !password) {
      setFormError('Enter your username or email and password.');
      return;
    }
    login.mutate({ data: { login: loginValue.trim(), password } }, {
      onSuccess: (session) => {
        queryClient.setQueryData(getGetCurrentSessionQueryKey(), session);
        setLocation(next.startsWith('/') ? next : '/');
      },
      onError: (error) => setFormError(errorMessage(error, 'We couldn’t sign you in. Check your details and try again.')),
    });
  };

  return (
    <AuthLayout title="Welcome back." detail="Sign in to keep your training, numbers, and progress together.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Username or email" value={loginValue} onChange={(event) => setLoginValue(event.target.value)} autoComplete="username" required data-testid="input-login" />
        <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required data-testid="input-password" />
        {formError && <p className="type-body-sm text-destructive" role="alert">{formError}</p>}
        <Button type="submit" className="mt-2 w-full uppercase" loading={login.isPending} data-testid="button-login">Sign in</Button>
        <p className="pt-3 text-center type-body-sm text-muted-foreground">
          New to Lofte? <Link href="/signup" className="font-semibold text-primary">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function SignupPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const signup = useSignup();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [formError, setFormError] = useState('');

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!/^[A-Za-z0-9_]{3,20}$/.test(form.username.trim())) {
      setFormError('Username must be 3–20 characters using letters, numbers, or underscores.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    signup.mutate({ data: { username: form.username.trim(), email: form.email.trim(), password: form.password } }, {
      onSuccess: (session) => {
        queryClient.setQueryData(getGetCurrentSessionQueryKey(), session);
        setLocation('/');
      },
      onError: (error) => setFormError(errorMessage(error, 'We couldn’t create your account. Please try again.')),
    });
  };

  return (
    <AuthLayout title="Make space to lift." detail="Create a private Lofte account for your numbers and training log.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Username" value={form.username} onChange={(event) => update('username', event.target.value)} autoComplete="username" required data-testid="input-signup-username" />
        <Input label="Email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" required data-testid="input-signup-email" />
        <Input label="Password" type="password" value={form.password} onChange={(event) => update('password', event.target.value)} autoComplete="new-password" hint="At least 8 characters." required data-testid="input-signup-password" />
        {formError && <p className="type-body-sm text-destructive" role="alert">{formError}</p>}
        <Button type="submit" className="mt-2 w-full uppercase" loading={signup.isPending} data-testid="button-signup">Create account</Button>
        <p className="pt-3 text-center type-body-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-semibold text-primary">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}