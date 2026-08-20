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

  const { data: conversions, error: conversionsError } = await supabase
    .from("conversion_history")
    .select(
      `
      conversion_id,
      original_filename,
      source_format,
      target_format,
      status,
      input_size,
      output_size,
      created_at,
      completed_at
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (conversionsError) {
    console.error("Failed to load conversion history:", conversionsError);
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
          <h1>Hello {displayName}.</h1>
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

          <section className="account-panel">
            <div className="account-panel-heading">
              <span>Conversions</span>
              <span>
                {conversions?.length ?? 0}{" "}
                {(conversions?.length ?? 0) === 1
                  ? "conversion"
                  : "conversions"}
              </span>
            </div>

            {conversions && conversions.length > 0 ? (
              <div className="account-conversion-list">
                {conversions.map((conversion) => {
                  const convertedAt = new Date(
                    conversion.completed_at ?? conversion.created_at,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      className="account-conversion-item"
                      key={conversion.conversion_id}
                    >
                      <div
                        className="account-conversion-icon"
                        aria-hidden="true"
                      >
                        {conversion.target_format.toUpperCase()}
                      </div>

                      <div className="account-conversion-main">
                        <strong>{conversion.original_filename}</strong>

                        <div className="account-conversion-route">
                          <span>{conversion.source_format.toUpperCase()}</span>
                          <span aria-hidden="true">→</span>
                          <span>{conversion.target_format.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="account-conversion-meta">
                        <span>{convertedAt}</span>

                        <span
                          className="account-conversion-status"
                          data-status={conversion.status}
                        >
                          {conversion.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="account-empty-state">
                <strong>No conversions yet.</strong>
                <span>Your completed conversions will appear here.</span>
              </div>
            )}
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
