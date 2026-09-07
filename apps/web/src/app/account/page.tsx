import Link from "next/link";
import {
  ArrowUpRight,
  ArrowLeftRight,
  CalendarDays,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { getAccountProfile, requireAccount } from "@/lib/account-server";
import { queryOwnHistory } from "@/lib/account-queries";
import {
  EMPTY_HISTORY_FILTERS,
  formatAccountDate,
  type AccountSummary,
} from "@/lib/account";
import { AccountOverviewEvent } from "@/components/account/account-event";
import { HistoryList } from "@/components/account/history-list";
import { FlowButton } from "@/components/ui/flow-button";
import styles from "@/components/account/account.module.css";

export default async function AccountPage() {
  const { supabase, user } = await requireAccount();
  const [profile, summaryResult, history] = await Promise.all([
    getAccountProfile(),
    supabase.rpc("account_conversion_summary"),
    queryOwnHistory(supabase, EMPTY_HISTORY_FILTERS).catch(() => null),
  ]);
  const summary = summaryResult.error
    ? null
    : (summaryResult.data as AccountSummary | null);
  const favourite = summary?.favourite;
  return (
    <>
      <AccountOverviewEvent />
      <div className={styles.pageHeading}>
        <div>
          <span className={styles.eyebrow}>Your account, at a glance</span>
          <h1 data-ph-mask>Hello, {profile.displayName}</h1>
          <p>A little less admin. More getting things done.</p>
        </div>
        <FlowButton
          href="/"
          text="Convert another file"
          variant="primary"
          shape="rounded"
        />
      </div>
      <div className={styles.identityLine}>
        <span data-ph-mask>{user.email ?? "Email unavailable"}</span>
        <span>Member since {formatAccountDate(user.created_at)}</span>
      </div>
      {profile.profileUnavailable && (
        <p className={styles.notice} role="status">
          Your display name is temporarily unavailable. Try refreshing this
          page.
        </p>
      )}
      <div className={styles.stats}>
        <section>
          <span className={styles.metricLabel}>
            <ArrowLeftRight size={18} aria-hidden="true" />
            Total conversions
          </span>
          <strong>
            {summary ? summary.total.toLocaleString("en-GB") : "—"}
          </strong>
          <span>Recorded in your history</span>
        </section>
        <section>
          <span className={styles.metricLabel}>
            <CalendarDays size={18} aria-hidden="true" />
            This month
          </span>
          <strong>
            {summary ? summary.this_month.toLocaleString("en-GB") : "—"}
          </strong>
          <span>Since the start of this month (UTC)</span>
        </section>
        <section>
          <span className={styles.metricLabel}>
            <Sparkles size={18} aria-hidden="true" />
            Most-used conversion
          </span>
          <strong className={styles.pairMetric}>
            {favourite
              ? `${favourite.source.toUpperCase()} → ${favourite.target.toUpperCase()}`
              : "—"}
          </strong>
          <span>
            {favourite
              ? `${favourite.count.toLocaleString("en-GB")} completed conversions`
              : summary
                ? "A favourite appears as your history grows"
                : "Statistics temporarily unavailable"}
          </span>
        </section>
      </div>
      {!summary && (
        <p className={styles.notice} role="status">
          We couldn’t load your conversion totals. Refresh the page to try
          again.
        </p>
      )}
      <section className={styles.panel} aria-labelledby="recent-title">
        <div className={styles.panelHeading}>
          <div>
            <h2 id="recent-title">Recent conversions</h2>
            <p>Pick up where you left off with a fresh file.</p>
          </div>
          <Link className={styles.textButton} href="/account/history">
            View all history <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {history === null ? (
          <div className={styles.empty}>
            <h3>History is temporarily unavailable</h3>
            <p>Please refresh this page to try again.</p>
          </div>
        ) : history.entries.length ? (
          <HistoryList entries={history.entries.slice(0, 5)} />
        ) : (
          <div className={styles.empty}>
            <FolderOpen size={32} aria-hidden="true" />
            <h3>Your next conversion starts here</h3>
            <p>Conversions saved while you’re logged in will appear here.</p>
            <Link className={styles.textButton} href="/">
              Convert your first file{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
      <p className={styles.footnote}>
        History is a record of your conversions, not file storage. To convert
        again, you’ll need to choose a file. Totals reflect saved history and
        decrease when entries are deleted.
      </p>
    </>
  );
}
