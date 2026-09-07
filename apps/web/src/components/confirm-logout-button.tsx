"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/app/account/actions";
import { ConfirmDialog } from "@/components/account/confirm-dialog";
import styles from "@/components/account/account.module.css";

function LogoutSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
export function ConfirmLogoutButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={styles.secondaryButton}
        type="button"
        onClick={() => setOpen(true)}
      >
        Log out
      </button>
      {open && (
        <ConfirmDialog
          title="Log out of Convertix?"
          onClose={() => setOpen(false)}
        >
          <p>You can sign back in at any time.</p>
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              autoFocus
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <form action={logout}>
              <LogoutSubmit />
            </form>
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
