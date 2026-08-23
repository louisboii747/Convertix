"use client";

import { useEffect, useState } from "react";

import { logout } from "@/app/account/actions";

export function ConfirmLogoutButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button className="account-logout" type="button" onClick={() => setOpen(true)}>
        Log out
      </button>

      {open ? (
        <div className="confirm-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div>
              <span className="confirm-modal-eyebrow">Confirm action</span>
              <h2 id="logout-confirm-title">Log out of Convertix?</h2>
              <p>You can sign back in at any time.</p>
            </div>

            <div className="confirm-modal-actions">
              <button type="button" className="confirm-modal-cancel" autoFocus onClick={() => setOpen(false)}>
                Cancel
              </button>
              <form action={logout}>
                <button type="submit" className="confirm-modal-confirm">
                  Log out
                </button>
              </form>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
