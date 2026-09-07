"use client";
import styles from "@/components/account/account.module.css";
export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <section className={styles.empty}>
      <h1>Your account couldn’t be loaded</h1>
      <p>Please try again in a moment.</p>
      <button className={styles.button} type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
