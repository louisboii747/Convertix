import type { Metadata } from "next";
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
      <main
        id="main-content"
        className={`${styles.shell} ph-no-capture ph-mask`}
        data-ph-private
        data-ph-mask
      >
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            My Convertix<span>Profile and conversion history</span>
          </div>
          <AccountNavigation />
          <div className={styles.sidebarFooter}>
            <span>Convert without an account</span>
            <p>
              Log in to keep your conversion history. You can also convert files
              without signing in.
            </p>
            <ConfirmLogoutButton />
          </div>
        </aside>
        <div className={styles.content}>{children}</div>
      </main>
    </>
  );
}
