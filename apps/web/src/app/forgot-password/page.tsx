import type { Metadata } from "next";
import Link from "next/link";
import { RecoveryForm } from "@/components/account/recovery-form";
export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};
export default function ForgotPasswordPage() {
  return (
    <>
      <main
        id="main-content"
        className="auth-page ph-no-capture ph-mask"
        data-ph-private
      >
        <section className="auth-shell">
          <div className="auth-intro">
            <h1>Forgot your password?</h1>
            <p>We’ll email you a secure link to choose a new one.</p>
          </div>
          <div className="auth-card">
            <RecoveryForm />
            <div className="auth-card-footer">
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
