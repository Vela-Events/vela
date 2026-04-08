/**
 * Message bus topic constants.
 *
 * All pub/sub topic strings used across the application are defined here
 * to avoid scattered string literals and make renaming safe.
 */
export const Topics = {
  /** Published by EventsService after an event is saved to the DB. */
  EVENTS_INGESTED: 'events.ingested',

  /** Published by NotificationsService when a rule matches, per action. */
  NOTIFICATIONS_DELIVER: 'notifications.deliver',
} as const;

export type Topic = (typeof Topics)[keyof typeof Topics];
