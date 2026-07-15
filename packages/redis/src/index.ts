export { getRedisClient, closeRedis } from './client.js';
export {
  acquireTaskLock,
  releaseTaskLock,
  refreshTaskLock,
  isTaskLocked,
} from './task-lock.js';
export {
  openBidWindow,
  closeBidWindow,
  isBidWindowOpen,
  getBidWindowTTL,
  submitBidToWindow,
  collectBids,
  clearBids,
} from './bid-window.js';
export {
  pushNotifications,
  getNotifications,
  acknowledgeNotification,
} from './notify.js';
export {
  acquireVerifyLock,
  releaseVerifyLock,
  enqueueVerification,
  dequeueVerification,
  getVerifyQueueSize,
} from './verify-lock.js';
export type { BidRecord, TaskNotification } from './bid-window.js';
