export const DEFERRED_MOUNTED_EVENT = 'merit-or-math:deferred-mounted';

/**
 * Asks every deferred block to load now rather than waiting to be approached.
 * Restoring a reading place needs the page at its real height before it can
 * aim at anything; nothing else should use this.
 */
export const DEFERRED_MOUNT_NOW_EVENT = 'merit-or-math:mount-deferred-now';

/**
 * Published on the root element by a step stage while it fills the viewport:
 * `playing` while it runs by itself (the title, the crowd), `reading` while it
 * waits on the reader. The chapter index keeps off a stage that is playing and
 * stays reachable on one that is reading — a stage at the top of the page never
 * scrolls the page, so a scroll rule alone hid the only way out of a hold.
 */
export const STAGE_STATE_ATTRIBUTE = 'data-stage';
