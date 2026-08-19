import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { logout } from "./actions";

export default async function AccountPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Failed to load profile:", profileError);
  }

  const displayName = profile?.display_name ?? "Convertix user";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not available";

  return (
    <main className="account-page" id="main-content">
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
            <span className="account-nav-name">{displayName}</span>
          </nav>
        </div>
      </header>

      <section className="account-shell">
        <div className="account-heading">
          <p className="auth-eyebrow">Your account</p>
          <h1>Good to see you, {displayName}.</h1>
          <p>
            Manage your Convertix account and keep track of your conversions in
            one place.
          </p>
        </div>

        <div className="account-grid">
          <section className="account-panel">
            <div className="account-panel-heading">
              <span>Profile</span>
              <span>Active account</span>
            </div>

            <div className="account-profile-lead">
              <div className="account-avatar" aria-hidden="true">
                {displayName.slice(0, 1).toUpperCase()}
              </div>

              <div>
                <strong>{displayName}</strong>
                <span>{user.email ?? "Email unavailable"}</span>
              </div>
            </div>

            <dl className="account-details">
              <div>
                <dt>Display name</dt>
                <dd>{displayName}</dd>
              </div>

              <div>
                <dt>Email</dt>
                <dd>{user.email ?? "Not available"}</dd>
              </div>

              <div>
                <dt>Member since</dt>
                <dd>{memberSince}</dd>
              </div>
            </dl>
          </section>

          <section className="account-panel account-panel-muted">
            <div className="account-panel-heading">
              <span>Conversions</span>
              <span>Coming next</span>
            </div>

            <div className="account-empty-state">
              <strong>Your conversion history will live here.</strong>
            </div>
          </section>
        </div>

        <div className="account-actions">
          <Link className="account-back-link" href="/">
            ← Back to converter
          </Link>

          <form action={logout}>
            <button className="account-logout" type="submit">
              Log out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
