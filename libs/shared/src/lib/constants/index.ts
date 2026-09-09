export const RedisKeys = {
  COURIERS_GEO: 'couriers:geo',
  COURIER_STATUS: (courierId: string) => `courier:${courierId}:status`,
  COURIER_LAST_SEEN: (courierId: string) => `courier:${courierId}:last-seen`,
  JOB_OFFER: (jobId: string) => `job:${jobId}:offer`,
} as const;

export const RedisChannels = {
  JOB_CREATED: 'jobs.created',
  JOB_OFFERED: 'jobs.offered',
  JOB_ACCEPTED: 'jobs.accepted',
  JOB_CANCELLED: 'jobs.cancelled',
  JOB_COMPLETED: 'jobs.completed',
  COURIER_LOCATION: 'couriers.location',
  NOTIFICATION_BROADCAST: 'notifications.broadcast',
  JOB_MESSAGE: 'jobs.message',
} as const;

export const MatchingDefaults = {
  RADIUS_METERS: 3000,
  MAX_CANDIDATES: 10,
  OFFER_TTL_SECONDS: 45,
} as const;

export const ApiRoutes = {
  AUTH: 'auth',
  USERS: 'users',
  COMPANIES: 'companies',
  COURIERS: 'couriers',
  JOBS: 'jobs',
  PAYMENTS: 'payments',
  ADMIN: 'admin',
  HEALTH: 'health',
} as const;
