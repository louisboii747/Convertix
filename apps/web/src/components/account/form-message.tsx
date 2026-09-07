import type { ActionState } from "@/lib/account";
import styles from "./account.module.css";

export function FormMessage({
  state,
  id,
}: {
  state: ActionState;
  id?: string;
}) {
  return state.message ? (
    <p
      id={id}
      className={state.ok ? styles.success : styles.error}
      role={state.ok ? "status" : "alert"}
    >
      {state.message}
    </p>
  ) : null;
}
