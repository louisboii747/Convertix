"use client";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/forgot-password/actions";
import { resetPassword } from "@/app/reset-password/actions";
import { FlowButton } from "@/components/ui/flow-button";
import { captureEvent } from "@/lib/posthog-client";
import { FormMessage } from "./form-message";

export function RecoveryForm({ reset = false }: { reset?: boolean }) {
  const [state, action, pending] = useActionState(
    reset ? resetPassword : requestPasswordReset,
    {},
  );
  return (
    <form
      action={action}
      className="auth-form"
      aria-busy={pending}
      onSubmit={() =>
        captureEvent("password_change_requested", { method: "email_link" })
      }
    >
      {reset ? (
        <>
          <div className="auth-field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              aria-describedby="reset-hint"
            />
            <p id="reset-hint">Use at least 8 characters.</p>
          </div>
          <div className="auth-field">
            <label htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
            />
          </div>
        </>
      ) : (
        <div className="auth-field">
          <label htmlFor="reset-email">Email address</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </div>
      )}
      <FormMessage state={state} />
      <FlowButton
        type="submit"
        text={
          pending
            ? "Please wait…"
            : reset
              ? "Save new password"
              : "Send reset link"
        }
        disabled={pending}
        variant="dark"
        shape="rounded"
        className="w-full"
      />
    </form>
  );
}
