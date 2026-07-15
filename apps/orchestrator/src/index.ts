import 'dotenv/config';
import { closeRedis } from '@a2a/redis';
import { startTaskListener } from './task-listener.js';

const SHUTDOWN = async () => {
  console.log('[Orchestrator] Shutting down...');
  await closeRedis();
  process.exit(0);
};

process.on('SIGINT', SHUTDOWN);
process.on('SIGTERM', SHUTDOWN);

async function main() {
  console.log('[Orchestrator] Starting task lifecycle manager');

  const pollInterval = parseInt(process.env.POLL_INTERVAL || '5000', 10);
  startTaskListener(pollInterval);

  console.log(`[Orchestrator] Polling every ${pollInterval}ms`);
}

main().catch((err) => {
  console.error('[Orchestrator] Fatal error:', err);
  process.exit(1);
});
