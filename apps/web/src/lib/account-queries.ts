import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AccountError,
  HISTORY_PAGE_SIZE,
  escapeLike,
  isUuid,
  parseHistoryFilters,
  validateDisplayName,
  validatePassword,
  type HistoryEntry,
  type HistoryResult,
} from "./account.ts";

export async function authenticatedAccount(client: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || user.is_anonymous)
    throw new AccountError("Please log in again to continue.");
  return user;
}

const historyColumns =
  "id,original_filename,source_format,target_format,status,input_size,output_size,created_at,completed_at";

export async function queryOwnHistory(
  client: SupabaseClient,
  input: unknown,
): Promise<HistoryResult> {
  const user = await authenticatedAccount(client);
  const filters = parseHistoryFilters(input);
  let query = client
    .from("conversion_history")
    .select(historyColumns, { count: "exact" })
    .eq("user_id", user.id);
  if (filters.search)
    query = query.ilike("original_filename", `%${escapeLike(filters.search)}%`);
  if (filters.source) query = query.eq("source_format", filters.source);
  if (filters.target) query = query.eq("target_format", filters.target);
  if (filters.status) query = query.eq("status", filters.status);
  const offset = (filters.page - 1) * HISTORY_PAGE_SIZE;
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + HISTORY_PAGE_SIZE - 1);
  if (error)
    throw new AccountError("We couldn’t load your history. Please try again.");
  return {
    entries: (data ?? []) as HistoryEntry[],
    count: count ?? 0,
    page: filters.page,
  };
}

export async function deleteOwnHistory(
  client: SupabaseClient,
  id: unknown,
  confirmation: unknown,
) {
  const user = await authenticatedAccount(client);
  if (!isUuid(id) || confirmation !== "DELETE")
    throw new AccountError("Confirm which history entry you want to delete.");
  const { data, error } = await client
    .from("conversion_history")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error)
    throw new AccountError("We couldn’t delete this entry. Please try again.");
  // The same response for an unknown id and somebody else's id prevents enumeration.
  if (!data)
    throw new AccountError("This history entry is no longer available.");
}

export async function updateOwnProfile(client: SupabaseClient, input: unknown) {
  const user = await authenticatedAccount(client);
  const displayName = validateDisplayName(input);
  const { data, error } = await client
    .from("profiles")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();
  if (error)
    throw new AccountError(
      "We couldn’t save your display name. Please try again.",
    );
  if (!data) {
    const { error: insertError } = await client
      .from("profiles")
      .insert({ id: user.id, display_name: displayName });
    if (insertError)
      throw new AccountError(
        "We couldn’t save your display name. Please try again.",
      );
  }
}

export async function deleteOwnAccount(
  client: SupabaseClient,
  getAdmin: () => SupabaseClient,
  confirmation: unknown,
) {
  const user = await authenticatedAccount(client);
  if (confirmation !== "DELETE")
    throw new AccountError("Type DELETE to confirm account deletion.");
  // Create the privileged client only after both authorization and confirmation.
  const admin = getAdmin();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  // getSession supplies the token only; identity was verified with getUser above.
  if (sessionError || !session || session.user.id !== user.id)
    throw new AccountError("Please log in again before deleting your account.");
  const { error: revokeError } = await admin.auth.admin.signOut(
    session.access_token,
    "global",
  );
  if (revokeError)
    throw new AccountError(
      "We couldn’t secure your sessions. Your account has not been deleted. Please log in again and retry.",
    );
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error)
    throw new AccountError(
      "Your account could not be deleted. Please log in again and retry, or contact support.",
    );
  // Database cascades delete the profile and history in the Auth deletion transaction.
  await client.auth.signOut({ scope: "local" });
  return user.id;
}

export async function changeOwnPassword(
  client: SupabaseClient,
  current: unknown,
  next: unknown,
  confirmation: unknown,
) {
  const user = await authenticatedAccount(client);
  if (
    !user.email ||
    !user.identities?.some((identity) => identity.provider === "email")
  )
    throw new AccountError(
      "Use the email reset link to set a Convertix password for this account.",
    );
  const password = validatePassword(next, confirmation);
  if (typeof current !== "string" || !current || current.length > 128)
    throw new AccountError("Enter your current password.");
  // Some Auth deployments ignore updateUser.current_password unless an extra
  // setting is enabled. Verify using signInWithPassword on every deployment.
  const verified = await client.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (verified.error || !verified.data.user)
    throw new AccountError(
      "We couldn’t change your password. Check your current password, or use an email reset link.",
    );
  if (verified.data.user.id !== user.id) {
    await client.auth.signOut({ scope: "local" });
    throw new AccountError("Please log in again to continue.");
  }
  const { error } = await client.auth.updateUser({
    password,
    current_password: current,
  });
  if (error)
    throw new AccountError(
      error.code === "same_password"
        ? "Choose a different password."
        : "We couldn’t change your password. Try a longer, unique password or use an email reset link.",
    );
}
