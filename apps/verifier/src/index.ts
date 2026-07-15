import 'dotenv/config';
import { closeRedis } from '@a2a/redis';
import { startVerifyListener } from './task-listener.js';

const SHUTDOWN = async () => {
  console.log('[Verifier] Shutting down...');
  await closeRedis();
  process.exit(0);
};

process.on('SIGINT', SHUTDOWN);
process.on('SIGTERM', SHUTDOWN);

async function main() {
  console.log('[Verifier] Starting verification service');

  const pollInterval = parseInt(process.env.POLL_INTERVAL || '5000', 10);
  startVerifyListener(pollInterval);

  console.log(`[Verifier] Polling every ${pollInterval}ms`);
}

main().catch((err) => {
  console.error('[Verifier] Fatal error:', err);
  process.exit(1);
});
