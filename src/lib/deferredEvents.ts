export const DEFERRED_MOUNTED_EVENT = 'merit-or-math:deferred-mounted';

/**
 * Asks every deferred block to load now rather than waiting to be approached.
 * Restoring a reading place needs the page at its real height before it can
 * aim at anything; nothing else should use this.
 */
export const DEFERRED_MOUNT_NOW_EVENT = 'merit-or-math:mount-deferred-now';
