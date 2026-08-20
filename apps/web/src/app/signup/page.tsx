import Link from "next/link";

import { loginWithGoogle, signup } from "@/app/login/actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, success } = await searchParams;

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
          <p className="auth-eyebrow">Create an account</p>
          <h1>Keep more of Convertix together.</h1>
          <p>
            Create an account for your profile and future conversion history.
            Basic conversions still work without signing in.
          </p>
        </div>

        <div className="auth-card">
          {error === "missing_fields" && (
            <div className="auth-alert" role="alert">
              Please complete all fields.
            </div>
          )}

          {error === "password_too_short" && (
            <div className="auth-alert" role="alert">
              Your password must be at least 8 characters long.
            </div>
          )}

          {error === "signup_failed" && (
            <div className="auth-alert" role="alert">
              We couldn&apos;t create your account. Please try again.
            </div>
          )}

          {error === "oauth_failed" && (
            <div className="auth-alert" role="alert">
              We couldn&apos;t start Google sign-in. Please try again.
            </div>
          )}

          {error === "email_rate_limit" && (
            <div className="auth-alert" role="alert">
              Too many confirmation emails have been sent recently. Please wait
              a little while and try again.
            </div>
          )}

          {success === "check_email" && (
            <div className="auth-success" role="status">
              If this email can be used to create an account, we&apos;ve sent a
              confirmation link. Already registered? Log in instead.
            </div>
          )}

          {success === "check_email" && (
            <Link className="auth-back" href="/login">
              Go to login →
            </Link>
          )}

          {!success && (
            <>
              <form action={loginWithGoogle} className="auth-form">
                <input type="hidden" name="source" value="signup" />
                <button className="auth-submit" type="submit">
                  <span>Continue with Google</span>
                  <span aria-hidden="true">G</span>
                </button>
              </form>

              <p className="auth-back" aria-hidden="true">
                or create an account with email
              </p>

              <form action={signup} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="display_name">Display name</label>
                  <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Louis"
                    maxLength={80}
                    required
                  />
                </div>

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
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>

                <button className="auth-submit" type="submit">
                  <span>Create account</span>
                  <span aria-hidden="true">→</span>
                </button>
              </form>
            </>
          )}

          <div className="auth-card-footer">
            {!success && (
              <Link className="auth-back" href="/login">
                Already have an account? Log in
              </Link>
            )}

            <Link className="auth-back" href="/">
              ← Back to Convertix
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
