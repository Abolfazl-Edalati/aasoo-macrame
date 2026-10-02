/**
 * scripts/cron.ts — 15-minute reconciliation cron (SPEC §5, §9).
 *
 * Runs from system crontab:
 * - Gateway recovery via unVerified.json (+ inquiry.json)
 * - 24h auto-cancel of unpaid gateway orders only when dead-check confirms unpaid
 * - 24h auto-cancel of card orders never declared (declared ones wait for staff)
 * - Safe & idempotent: codes 100/101 make double-verify safe.
 *
 * Usage:
 *   pnpm tsx scripts/cron.ts
 */

import "dotenv/config";
import { runReconciliationCron } from "@/lib/reconciliation";

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`[cron] Reconciliation sweep started at ${startedAt}`);

  try {
    const result = await runReconciliationCron();
    console.log(
      `[cron] Completed: reconciled ${result.reconciledCount} payments (${result.reopenedCount} reopened), ` +
        `cancelled ${result.cancelledGatewayCount} dead gateway orders, ` +
        `cancelled ${result.cancelledCardCount} undeclared card orders.`
    );

    if (result.errors.length > 0) {
      console.warn(`[cron] Warnings/errors during sweep:`);
      for (const err of result.errors) {
        console.warn(`  - ${err}`);
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[cron] Fatal error in reconciliation sweep:`, message);
    process.exit(1);
  }
}

main();
