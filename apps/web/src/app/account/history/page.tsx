import { requireAccount } from "@/lib/account-server";
import { queryOwnHistory } from "@/lib/account-queries";
import { EMPTY_HISTORY_FILTERS } from "@/lib/account";
import { AccountHistory } from "@/components/account/account-history";
import { FlowButton } from "@/components/ui/flow-button";
import styles from "@/components/account/account.module.css";

export default async function HistoryPage() {
  const { supabase } = await requireAccount();
  const history = await queryOwnHistory(supabase, EMPTY_HISTORY_FILTERS).catch(
    () => ({
      entries: [],
      count: 0,
      page: 1,
      error: "We couldn’t load your history. Please try again.",
    }),
  );
  return (
    <>
      <div className={styles.pageHeading}>
        <div>
          <span className={styles.eyebrow}>Made with Convertix</span>
          <h1>Conversion history</h1>
          <p>Find a past conversion. Start your next one.</p>
        </div>
        <FlowButton
          href="/"
          text="Convert another file"
          variant="primary"
          shape="rounded"
        />
      </div>
      <AccountHistory initial={history} />
      <p className={styles.footnote}>
        History records successful conversions saved while you’re logged in.
        Earlier attempts and anonymous conversions may not appear. Files are not
        stored in your account; “Convert again” asks you to choose a fresh file.
      </p>
    </>
  );
}
