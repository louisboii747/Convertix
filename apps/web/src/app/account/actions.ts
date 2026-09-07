"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { captureServerEvent } from "@/lib/posthog-server";
import {
  AccountError,
  validateEmail,
  type ActionState,
  type HistoryResult,
} from "@/lib/account";
import {
  authenticatedAccount,
  changeOwnPassword,
  deleteOwnAccount,
  deleteOwnHistory,
  queryOwnHistory,
  updateOwnProfile,
} from "@/lib/account-queries";
import { authSiteUrl } from "@/lib/account-server";
import { createAdminClient } from "@/lib/supabase/admin";

function failure(error: unknown): ActionState {
  return {
    ok: false,
    message:
      error instanceof AccountError
        ? error.message
        : "Something went wrong. Please try again.",
  };
}

export async function loadHistory(input: unknown): Promise<HistoryResult> {
  try {
    return await queryOwnHistory(await createClient(), input);
  } catch (error) {
    return { entries: [], count: 0, page: 1, error: failure(error).message };
  }
}

export async function deleteHistoryEntry(
  id: string,
  confirmation: string,
): Promise<ActionState> {
  try {
    await deleteOwnHistory(await createClient(), id, confirmation);
    revalidatePath("/account", "layout");
    return { ok: true, message: "History entry deleted." };
  } catch (error) {
    return failure(error);
  }
}

export async function updateProfile(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await updateOwnProfile(await createClient(), form.get("display_name"));
    revalidatePath("/account", "layout");
    return { ok: true, message: "Display name saved." };
  } catch (error) {
    return { ...failure(error), field: "display_name" };
  }
}

export async function changeEmail(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const user = await authenticatedAccount(supabase);
    const email = validateEmail(form.get("email"));
    if (user.email?.toLowerCase() === email.toLowerCase())
      throw new AccountError(
        "Enter an email address different from your current one.",
      );
    const { data, error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${authSiteUrl()}/auth/callback?flow=email` },
    );
    if (error)
      throw new AccountError(
        error.code === "over_email_send_rate_limit"
          ? "Too many requests. Please wait before trying again."
          : "We couldn’t request this email change. Please try again.",
      );
    revalidatePath("/account", "layout");
    return {
      ok: true,
      message:
        data.user.email?.toLowerCase() === email.toLowerCase()
          ? "Email address updated."
          : "Check your current and new email inboxes for confirmation instructions. Your address stays unchanged until verification is complete.",
    };
  } catch (error) {
    return { ...failure(error), field: "email" };
  }
}

export async function changePassword(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await changeOwnPassword(
      await createClient(),
      form.get("current_password"),
      form.get("password"),
      form.get("confirm_password"),
    );
    return {
      ok: true,
      message: "Password changed. Use your new password next time you log in.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function requestAccountPasswordReset(): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const user = await authenticatedAccount(supabase);
    if (!user.email)
      throw new AccountError(
        "This account has no email address. Please contact support.",
      );
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${authSiteUrl()}/auth/callback?flow=recovery`,
    });
    if (error)
      throw new AccountError(
        "We couldn’t send a reset link. Please wait a few minutes and try again.",
      );
    return {
      ok: true,
      message:
        "Check your inbox for a password reset link. Open it in this browser to continue.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteAccount(
  _previous: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const id = await deleteOwnAccount(
      await createClient(),
      createAdminClient,
      form.get("confirmation"),
    );
    await captureServerEvent(id, "account_deleted");
    revalidatePath("/account", "layout");
  } catch (error) {
    return failure(error);
  }
  redirect("/login?success=account_deleted");
}

export async function logout() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await captureServerEvent(user.id, "user_logged_out");
  }

  redirect("/login");
}
