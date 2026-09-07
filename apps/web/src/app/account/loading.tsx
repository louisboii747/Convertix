import styles from "@/components/account/account.module.css";
export default function AccountLoading() {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.eyebrow}>My Convertix</span>
      <p>Loading your account…</p>
    </div>
  );
}
