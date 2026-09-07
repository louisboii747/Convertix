"use server";
import { createClient } from "@/lib/supabase/server";
import { authSiteUrl } from "@/lib/account-server";
import { AccountError, validateEmail, type ActionState } from "@/lib/account";

export async function requestPasswordReset(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const email = validateEmail(form.get("email"));
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${authSiteUrl()}/auth/callback?flow=recovery`,
    });
    if (
      error &&
      ["over_email_send_rate_limit", "over_request_rate_limit"].includes(
        error.code ?? "",
      )
    )
      throw new AccountError(
        "Too many requests. Please wait a few minutes before trying again.",
      );
    if (error && (error.status ?? 0) >= 500)
      throw new AccountError(
        "Password reset is temporarily unavailable. Please try again later.",
      );
    // Do not reveal whether an email has an account (including OAuth accounts).
    return {
      ok: true,
      message:
        "If an account exists for that email, you’ll receive a password reset link. Open it in this browser to continue.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof AccountError
          ? error.message
          : "We couldn’t send your request. Please try again.",
    };
  }
}
