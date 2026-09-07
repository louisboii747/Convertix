"use client";
import Link from "next/link";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import {
  changeEmail,
  changePassword,
  deleteAccount,
  requestAccountPasswordReset,
  updateProfile,
} from "@/app/account/actions";
import type { ActionState } from "@/lib/account";
import { captureEvent } from "@/lib/posthog-client";
import { ConfirmDialog } from "./confirm-dialog";
import { FormMessage } from "./form-message";
import styles from "./account.module.css";

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={styles.button} type="submit" disabled={pending}>
      {pending ? "Saving…" : text}
    </button>
  );
}

function SettingsForm({
  action,
  event,
  children,
  submit,
  id,
}: {
  action: (previous: ActionState, form: FormData) => Promise<ActionState>;
  event: string;
  children: ReactNode;
  submit: string;
  id: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (previous: ActionState, form: FormData) => {
      try {
        if (event === "password_change_completed")
          captureEvent("password_change_requested");
        const result = await action(previous, form);
        if (result.ok) {
          captureEvent(event);
          if (event === "profile_updated")
            window.dispatchEvent(new Event("convertix:account-updated"));
        }
        return result;
      } catch {
        return { ok: false, message: "Couldn’t connect. Please try again." };
      }
    },
    {},
  );
  return (
    <form
      action={formAction}
      className={styles.settingsForm}
      aria-describedby={state.message ? `${id}-message` : undefined}
      aria-busy={pending}
    >
      <fieldset disabled={pending}>
        {children}
        <SubmitButton text={submit} />
      </fieldset>
      <FormMessage state={state} id={`${id}-message`} />
    </form>
  );
}

function PasswordResetButton({
  hasPasswordIdentity,
}: {
  hasPasswordIdentity: boolean;
}) {
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  return (
    <div className={styles.resetOption}>
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              captureEvent("password_change_requested", {
                method: "email_link",
              });
              setState(await requestAccountPasswordReset());
            } catch {
              setState({
                ok: false,
                message: "Couldn’t connect. Please try again.",
              });
            }
          })
        }
      >
        {pending
          ? "Sending…"
          : hasPasswordIdentity
            ? "Email me a reset link"
            : "Set a password by email"}
      </button>
      <FormMessage state={state} />
    </div>
  );
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteAccount, {});
  return (
    <ConfirmDialog
      title="Delete your Convertix account?"
      onClose={onClose}
      busy={pending}
    >
      <p>
        Your profile and all conversion history will be permanently deleted.
        You’ll be signed out. This cannot be undone.
      </p>
      <p>
        Files you already downloaded remain on your device. Deleting your
        account does not delete your Google account.
      </p>
      <form action={action} className={styles.settingsForm}>
        <div className={styles.field}>
          <label htmlFor="delete-confirmation">Type DELETE to confirm</label>
          <input
            id="delete-confirmation"
            name="confirmation"
            autoComplete="off"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            pattern="DELETE"
            disabled={pending}
          />
        </div>
        <FormMessage state={state} />
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            autoFocus
            disabled={pending}
            onClick={onClose}
          >
            Keep my account
          </button>
          <button
            type="submit"
            className={styles.dangerButton}
            disabled={confirmation !== "DELETE" || pending}
          >
            {pending ? "Deleting account…" : "Delete my account"}
          </button>
        </div>
      </form>
    </ConfirmDialog>
  );
}

export function AccountSettings({
  displayName,
  email,
  pendingEmail,
  hasPasswordIdentity,
  usesGoogle,
  deletionAvailable,
}: {
  displayName: string;
  email: string;
  pendingEmail?: string;
  hasPasswordIdentity: boolean;
  usesGoogle: boolean;
  deletionAvailable: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <div className={styles.settings}>
      <section
        className={styles.settingSection}
        aria-labelledby="profile-title"
      >
        <div>
          <h2 id="profile-title">Your profile</h2>
          <p>A familiar name for your corner of Convertix.</p>
        </div>
        <SettingsForm
          action={updateProfile}
          event="profile_updated"
          submit="Save display name"
          id="profile"
        >
          <div className={styles.field}>
            <label htmlFor="display-name">Display name</label>
            <input
              id="display-name"
              name="display_name"
              autoComplete="nickname"
              defaultValue={displayName}
              required
              minLength={1}
              maxLength={80}
            />
            <span className={styles.hint}>
              Up to 80 characters. This also appears in the site header.
            </span>
          </div>
        </SettingsForm>
      </section>
      <section className={styles.settingSection} aria-labelledby="email-title">
        <div>
          <h2 id="email-title">Email address</h2>
          <p>Keep your sign-in and recovery address up to date.</p>
          {usesGoogle && (
            <p className={styles.provider}>
              <ShieldCheck size={17} aria-hidden="true" />
              Google connected
            </p>
          )}
        </div>
        <div>
          <div className={styles.currentEmail}>
            <span className={styles.hint}>Current email</span>
            <strong data-ph-mask>{email || "No email address"}</strong>
          </div>
          {pendingEmail && (
            <p className={styles.notice} role="status">
              Pending verification: <strong data-ph-mask>{pendingEmail}</strong>
              . Check both inboxes for confirmation instructions.
            </p>
          )}
          <SettingsForm
            action={changeEmail}
            event="email_change_requested"
            submit="Request email change"
            id="email"
          >
            <div className={styles.field}>
              <label htmlFor="new-email">New email address</label>
              <input
                id="new-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
              <span className={styles.hint}>
                Follow the verification instructions sent to your inboxes.
                {usesGoogle
                  ? " Your Google sign-in remains managed by Google."
                  : ""}
              </span>
            </div>
          </SettingsForm>
        </div>
      </section>
      <section
        className={styles.settingSection}
        aria-labelledby="password-title"
      >
        <div>
          <h2 id="password-title">Password & sign-in</h2>
          <p>
            {hasPasswordIdentity
              ? "Change your Convertix password or get a secure reset link."
              : "You sign in with Google. You can also add a Convertix password using a secure email link."}
          </p>
        </div>
        <div>
          {hasPasswordIdentity && (
            <SettingsForm
              action={changePassword}
              event="password_change_completed"
              submit="Change password"
              id="password"
            >
              <div className={styles.field}>
                <label htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                  aria-describedby="password-hint"
                />
                <span id="password-hint" className={styles.hint}>
                  Use at least 8 characters. A long, unique password is best.
                </span>
              </div>
              <div className={styles.field}>
                <label htmlFor="confirm-password">Confirm new password</label>
                <input
                  id="confirm-password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  required
                />
              </div>
            </SettingsForm>
          )}
          <PasswordResetButton hasPasswordIdentity={hasPasswordIdentity} />
        </div>
      </section>
      <section
        className={`${styles.settingSection} ${styles.dangerZone}`}
        aria-labelledby="danger-title"
      >
        <div>
          <h2 id="danger-title">
            <TriangleAlert size={20} aria-hidden="true" />
            Delete account
          </h2>
          <p>Permanently remove your Convertix account.</p>
        </div>
        <div>
          <p>
            Your profile and conversion history will be deleted. This action
            cannot be undone. You can still convert files without an account.
          </p>
          {deletionAvailable ? (
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => setDeleteOpen(true)}
            >
              Delete account…
            </button>
          ) : (
            <p className={styles.notice}>
              Account deletion is temporarily unavailable.{" "}
              <Link className={styles.textButton} href="/contact">
                Contact support
              </Link>
            </p>
          )}
        </div>
      </section>
      {deleteOpen && (
        <DeleteAccountDialog onClose={() => setDeleteOpen(false)} />
      )}
    </div>
  );
}
