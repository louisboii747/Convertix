import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import {
  changeOwnPassword,
  deleteOwnAccount,
  deleteOwnHistory,
  queryOwnHistory,
  updateOwnProfile,
} from "./account-queries.ts";
import { requireRecoverySession } from "./password-recovery.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
// This suite creates/deletes fixtures. It must never run against a hosted project.
if (!url || !["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error(
    "Account integration tests require a disposable local Supabase URL.",
  );
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secret, options);

test("local Supabase account workflows and cross-user isolation", async (t) => {
  const password = `Account-v2-${randomUUID()}`;
  const users: string[] = [];
  async function fixture() {
    const email = `account-v2-${randomUUID()}@example.test`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Account tester" },
    });
    assert.equal(error, null);
    const id = data.user!.id;
    users.push(id);
    const client = createClient(url, publicKey, options);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    assert.equal(signedIn.error, null);
    return { id, email, client, token: signedIn.data.session!.access_token };
  }
  try {
    const one = await fixture();
    const two = await fixture();
    const rows = Array.from({ length: 34 }, (_, index) => ({
      id: randomUUID(),
      conversion_id: randomUUID(),
      user_id: one.id,
      original_filename:
        index === 0 ? "50%_report.docx" : `document-${index}.docx`,
      source_format: index < 25 ? "docx" : "png",
      target_format: index < 25 ? "pdf" : "jpg",
      status: index === 33 ? "failed" : "completed",
      input_size: 2000,
      output_size: index === 33 ? null : 1000,
    }));
    assert.equal(
      (
        await admin
          .from("conversion_history")
          .insert([
            ...rows,
            {
              ...rows[0],
              id: randomUUID(),
              conversion_id: randomUUID(),
              user_id: two.id,
              original_filename: "private-other-user.docx",
            },
          ])
      ).error,
      null,
    );

    await t.test(
      "pagination and exact summary go beyond latest twenty",
      async () => {
        const first = await queryOwnHistory(one.client, {});
        const second = await queryOwnHistory(one.client, { page: 2 });
        const last = await queryOwnHistory(one.client, { page: 3 });
        assert.equal(first.count, 34);
        assert.equal(first.entries.length, 15);
        assert.equal(last.entries.length, 4);
        assert.equal(
          new Set(
            [...first.entries, ...second.entries, ...last.entries].map(
              (entry) => entry.id,
            ),
          ).size,
          34,
        );
        const summary = await one.client.rpc("account_conversion_summary");
        assert.equal(summary.error, null);
        assert.equal(summary.data.total, 34);
        assert.equal(summary.data.this_month, 34);
        assert.deepEqual(summary.data.favourite, {
          source: "docx",
          target: "pdf",
          count: 25,
        });
      },
    );
    await t.test(
      "literal filename search and combined format/status filters",
      async () => {
        assert.equal(
          (await queryOwnHistory(one.client, { search: "50%_report" })).count,
          1,
        );
        assert.equal(
          (
            await queryOwnHistory(one.client, {
              source: "png",
              target: "jpg",
              status: "failed",
            })
          ).count,
          1,
        );
        assert.equal(
          (await queryOwnHistory(one.client, { search: "not-a-file" })).count,
          0,
        );
      },
    );
    await t.test(
      "RLS blocks cross-user reads, deletion, inserts and ownership reassignment",
      async () => {
        const stolen = await two.client
          .from("conversion_history")
          .select("id")
          .eq("user_id", one.id);
        assert.deepEqual(stolen.data, []);
        assert.equal(
          (await queryOwnHistory(two.client, { user_id: one.id })).count,
          1,
        );
        await assert.rejects(() =>
          deleteOwnHistory(two.client, rows[0].id, "DELETE"),
        );
        const forged = await two.client
          .from("conversion_history")
          .insert({
            ...rows[0],
            id: randomUUID(),
            conversion_id: randomUUID(),
          });
        assert.ok(forged.error);
        const reassigned = await one.client
          .from("conversion_history")
          .update({ user_id: two.id })
          .eq("id", rows[0].id);
        assert.ok(reassigned.error);
        assert.deepEqual(
          (await two.client.from("profiles").select("id").eq("id", one.id))
            .data,
          [],
        );
      },
    );
    await t.test(
      "profile changes are owner-scoped and member since is immutable",
      async () => {
        await updateOwnProfile(one.client, " Updated tester ");
        assert.equal(
          (await one.client.from("profiles").select("display_name").single())
            .data?.display_name,
          "Updated tester",
        );
        assert.equal(
          (await two.client.from("profiles").select("display_name").single())
            .data?.display_name,
          "Account tester",
        );
        assert.ok(
          (
            await one.client
              .from("profiles")
              .update({ created_at: new Date().toISOString() })
              .eq("id", one.id)
          ).error,
        );
      },
    );
    await t.test(
      "own history deletion succeeds and summary updates",
      async () => {
        await deleteOwnHistory(one.client, rows[0].id, "DELETE");
        assert.equal((await queryOwnHistory(one.client, {})).count, 33);
        assert.equal(
          (await one.client.rpc("account_conversion_summary")).data.total,
          33,
        );
      },
    );
    await t.test(
      "normal sessions cannot use the recovery-only password reset",
      async () => {
        await assert.rejects(
          () => requireRecoverySession(one.client),
          /fresh password reset link/,
        );
      },
    );
    await t.test(
      "password changes require correct current credentials independently of Auth configuration",
      async () => {
        await assert.rejects(
          () =>
            changeOwnPassword(
              one.client,
              "wrong-password",
              `${password}-changed`,
              `${password}-changed`,
            ),
          /Check your current password/,
        );
        assert.equal(
          (
            await createClient(url, publicKey, options).auth.signInWithPassword(
              { email: one.email, password },
            )
          ).error,
          null,
        );
        await changeOwnPassword(
          one.client,
          password,
          `${password}-changed`,
          `${password}-changed`,
        );
        assert.equal(
          (
            await createClient(url, publicKey, options).auth.signInWithPassword(
              { email: one.email, password: `${password}-changed` },
            )
          ).error,
          null,
        );
      },
    );
    await t.test(
      "password recovery verifies an actual one-time Auth token",
      async () => {
        const link = await admin.auth.admin.generateLink({
          type: "recovery",
          email: one.email,
        });
        assert.equal(link.error, null);
        const recovered = createClient(url, publicKey, options);
        const verification = await recovered.auth.verifyOtp({
          type: "recovery",
          token_hash: link.data.properties!.hashed_token,
        });
        assert.equal(verification.error, null);
        assert.equal((await requireRecoverySession(recovered)).id, one.id);
        const changed = await recovered.auth.updateUser({
          password: `${password}-new`,
        });
        assert.equal(changed.error, null);
        const replay = await createClient(
          url,
          publicKey,
          options,
        ).auth.verifyOtp({
          type: "recovery",
          token_hash: link.data.properties!.hashed_token,
        });
        assert.ok(replay.error);
        assert.equal(
          (
            await createClient(url, publicKey, options).auth.signInWithPassword(
              { email: one.email, password: `${password}-new` },
            )
          ).error,
          null,
        );
      },
    );
    await t.test(
      "account deletion cascades and previously issued tokens cannot access account data",
      async () => {
        await deleteOwnAccount(two.client, () => admin, "DELETE");
        assert.deepEqual(
          (await admin.from("profiles").select("id").eq("id", two.id)).data,
          [],
        );
        assert.deepEqual(
          (
            await admin
              .from("conversion_history")
              .select("id")
              .eq("user_id", two.id)
          ).data,
          [],
        );
        assert.ok(
          (await createClient(url, publicKey, options).auth.getUser(two.token))
            .error,
        );
        const stale = createClient(url, publicKey, {
          ...options,
          global: { headers: { Authorization: `Bearer ${two.token}` } },
        });
        assert.deepEqual(
          (await stale.from("conversion_history").select("id")).data,
          [],
        );
        assert.deepEqual((await stale.from("profiles").select("id")).data, []);
        await assert.rejects(() =>
          deleteOwnAccount(two.client, () => admin, "DELETE"),
        );
        assert.ok((await admin.auth.admin.getUserById(one.id)).data.user);
      },
    );
  } finally {
    for (const id of users) await admin.auth.admin.deleteUser(id);
  }
});
