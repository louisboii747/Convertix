import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRecoverySession } from "@/lib/password-recovery";
import { SiteHeader } from "@/components/site-header";
import { RecoveryForm } from "@/components/account/recovery-form";
export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const user = await requireRecoverySession(supabase).catch(() => null);
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="auth-page ph-no-capture ph-mask"
        data-ph-private
      >
        <section className="auth-shell">
          <div className="auth-intro">
            <h1>{user ? "Choose a new password" : "Let’s get a fresh link"}</h1>
            <p>
              {user
                ? "Save your new password, then log in to Convertix."
                : "This reset link is missing, expired, or already used."}
            </p>
          </div>
          <div className="auth-card">
            {user ? (
              <RecoveryForm reset />
            ) : (
              <p className="auth-alert" role="alert">
                Open the latest reset email in the browser where you requested
                it. If it still doesn’t work, request a new link.
              </p>
            )}
            <div className="auth-card-footer">
              <Link className="auth-back" href="/forgot-password">
                Request a new reset link
              </Link>
              <Link className="auth-back" href="/login">
                Back to log in
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
