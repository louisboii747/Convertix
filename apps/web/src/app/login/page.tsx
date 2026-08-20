import Link from "next/link";

import { login, loginWithGoogle } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    verified?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, verified } = await searchParams;

  return (
    <main className="auth-page" id="main-content">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="brand" href="/" aria-label="Convertix home">
            <span className="brand-mark" aria-hidden="true">
              ×
            </span>
            <span>Convertix</span>
          </Link>

          <nav className="site-nav" aria-label="Primary navigation">
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#formats">Formats</Link>
            <Link href="/#faq">FAQ</Link>
          </nav>
        </div>
      </header>

      <section className="auth-shell">
        <div className="auth-intro">
          <p className="auth-eyebrow">Your account</p>
          <h1>Welcome back.</h1>
          <p>
            Log in to your Convertix account to access your profile and future
            conversion history.
          </p>
        </div>

        <div className="auth-card">
          {verified === "true" && (
            <div className="auth-success" role="status">
              Email confirmed. You can log in now.
            </div>
          )}

          {error === "missing_fields" && (
            <div className="auth-alert" role="alert">
              Please enter your email and password.
            </div>
          )}

          {error === "invalid_credentials" && (
            <div className="auth-alert" role="alert">
              Your email or password is incorrect.
            </div>
          )}

          {error === "oauth_failed" && (
            <div className="auth-alert" role="alert">
              We couldn&apos;t start Google sign-in. Please try again.
            </div>
          )}

          {error === "oauth_callback_failed" && (
            <div className="auth-alert" role="alert">
              Google sign-in couldn&apos;t be completed. Please try again.
            </div>
          )}

          {error === "email_rate_limit" && (
            <div className="auth-alert" role="alert">
              Too many confirmation emails have been sent recently. Please wait
              a little while and try again.
            </div>
          )}

          <form action={loginWithGoogle} className="auth-form">
            <input type="hidden" name="source" value="login" />
            <button className="auth-submit" type="submit">
              <span>Continue with Google</span>
              <span aria-hidden="true">G</span>
            </button>
          </form>

          <p className="auth-back" aria-hidden="true">
            or continue with email
          </p>

          <form action={login} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </div>

            <button className="auth-submit" type="submit">
              <span>Log in</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="auth-card-footer">
            <Link className="auth-back" href="/signup">
              New to Convertix? Create an account
            </Link>

            <Link className="auth-back" href="/">
              ← Back to Convertix
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
