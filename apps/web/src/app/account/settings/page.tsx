import { getAccountProfile, requireAccount } from "@/lib/account-server";
import { accountDeletionConfigured } from "@/lib/supabase/admin";
import { AccountSettings } from "@/components/account/account-settings";
import styles from "@/components/account/account.module.css";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const [{ user }, profile, params] = await Promise.all([
    requireAccount(),
    getAccountProfile(),
    searchParams,
  ]);
  const hasPasswordIdentity =
    user.identities?.some((identity) => identity.provider === "email") ?? false;
  const usesGoogle =
    user.identities?.some((identity) => identity.provider === "google") ??
    false;
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <span className={styles.eyebrow}>Make yourself at home</span>
          <h1>Account settings</h1>
          <p>Your profile, sign-in details, and account controls.</p>
        </div>
      </div>
      {params.email === "verified" && (
        <p className={styles.notice} role="status">
          {user.new_email
            ? "One confirmation received. Follow the instructions in both inboxes to finish changing your email."
            : "Email verification complete. Your current account email is shown below."}
        </p>
      )}
      {params.error === "email_verification" && (
        <p className={styles.error} role="alert">
          This verification link has expired or could not be used. Request a new
          email change below.
        </p>
      )}
      {profile.profileUnavailable && (
        <p className={styles.error} role="alert">
          Your display name couldn’t be loaded. Please refresh before editing
          it.
        </p>
      )}
      <AccountSettings
        displayName={profile.displayName}
        email={user.email ?? ""}
        pendingEmail={user.new_email}
        hasPasswordIdentity={hasPasswordIdentity}
        usesGoogle={usesGoogle}
        deletionAvailable={accountDeletionConfigured()}
      />
    </>
  );
}
