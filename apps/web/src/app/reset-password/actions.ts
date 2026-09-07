"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRecoverySession } from "@/lib/password-recovery";
import {
  AccountError,
  validatePassword,
  type ActionState,
} from "@/lib/account";
import { captureServerEvent } from "@/lib/posthog-server";

export async function resetPassword(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const user = await requireRecoverySession(supabase);
    const password = validatePassword(
      form.get("password"),
      form.get("confirm_password"),
    );
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      throw new AccountError(
        error.code === "same_password"
          ? "Choose a different password."
          : "We couldn’t update your password. Try a longer, unique password or request a fresh reset link.",
      );
    await captureServerEvent(user.id, "password_change_completed", {
      method: "email_link",
    });
    await supabase.auth.signOut({ scope: "global" });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof AccountError
          ? error.message
          : "We couldn’t update your password. Please try again.",
    };
  }
  redirect("/login?success=password_reset");
}
