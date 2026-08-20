import Link from "next/link";

import { Brand } from "@/components/brand";
import { MobileNav } from "@/components/mobile-nav";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    displayName = profile?.display_name ?? null;
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Brand />

        <nav className="site-nav" aria-label="Primary navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#formats">Formats</Link>
          <Link href="/tools">Tools</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>

          {user ? (
            <Link className="site-auth-link" href="/account">
              {displayName ?? "Account"}
            </Link>
          ) : (
            <Link className="site-auth-link" href="/login">
              Log in
            </Link>
          )}
        </nav>

        <MobileNav
          isAuthenticated={Boolean(user)}
          accountLabel={displayName ?? "Account"}
        />
      </div>
    </header>
  );
}
