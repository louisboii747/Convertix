import Link from "next/link";

import { signup } from "@/app/login/actions";
import { PasswordField } from "@/components/password-field";
import { SiteHeader } from "@/components/site-header";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, success } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="auth-page" id="main-content">
        <section className="auth-shell">
          <div className="auth-intro">
            <h1>Create a Convertix account</h1>
            <p>
              Keep your profile and recent conversions together. You can still
              convert files without signing in.
            </p>
          </div>

          <div className="auth-card">
            {error === "missing_fields" && (
              <div className="auth-alert" role="alert">Please complete all fields.</div>
            )}

            {error === "password_too_short" && (
              <div className="auth-alert" role="alert">Your password must be at least 8 characters long.</div>
            )}

            {error === "signup_failed" && (
              <div className="auth-alert" role="alert">We couldn&apos;t create your account. Please try again.</div>
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
              <Link className="auth-back" href="/login">Go to login</Link>
            )}

            {!success && (
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
                  <PasswordField
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>

                <button className="auth-submit" type="submit"><span>Create account</span></button>
              </form>
            )}

            <div className="auth-card-footer">
              {!success && (
                <Link className="auth-back" href="/login">Already have an account? Log in</Link>
              )}
              <Link className="auth-back" href="/">Back to Convertix</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
