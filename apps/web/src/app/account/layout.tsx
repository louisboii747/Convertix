import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ConfirmLogoutButton } from "@/components/confirm-logout-button";
import { AccountNavigation } from "@/components/account/account-navigation";
import { requireAccount } from "@/lib/account-server";
import styles from "@/components/account/account.module.css";

export const metadata: Metadata = {
  title: "Account",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAccount();
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className={`${styles.shell} ph-no-capture ph-mask`}
        data-ph-private
        data-ph-mask
      >
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            My Convertix<span>Your personal workspace</span>
          </div>
          <AccountNavigation />
          <div className={styles.sidebarFooter}>
            <span>You’re free to convert.</span>
            <p>
              An account keeps your history together. Basic conversion is always
              open to everyone.
            </p>
            <ConfirmLogoutButton />
          </div>
        </aside>
        <div className={styles.content}>{children}</div>
      </main>
    </>
  );
}
