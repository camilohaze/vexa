import { GeoPoint, Job } from '../models';

export const SocketEvents = {
  NEW_JOB: 'NEW_JOB',
  JOB_ACCEPTED: 'JOB_ACCEPTED',
  JOB_CANCELLED: 'JOB_CANCELLED',
  COURIER_LOCATION: 'COURIER_LOCATION',
  JOB_COMPLETED: 'JOB_COMPLETED',
  JOB_MESSAGE: 'JOB_MESSAGE',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];

export interface NewJobEvent {
  job: Job;
  offeredTo: string[];
  expiresAt: string;
}

export interface JobAcceptedEvent {
  jobId: string;
  courierId: string;
  acceptedAt: string;
}

export interface JobCancelledEvent {
  jobId: string;
  reason?: string;
  cancelledBy: 'COMPANY' | 'COURIER' | 'ADMIN' | 'SYSTEM';
}

export interface CourierLocationEvent extends GeoPoint {
  courierId: string;
  jobId?: string;
  heading?: number;
  speed?: number;
  recordedAt: string;
}

export interface JobCompletedEvent {
  jobId: string;
  courierId: string;
  proofOfDeliveryUrl?: string;
  completedAt: string;
}

export interface JobMessageEvent {
  jobId: string;
  senderId: string;
  senderRole: 'COMPANY' | 'COURIER' | 'ADMIN';
  body: string;
  sentAt: string;
}

export interface SocketEventPayloads {
  [SocketEvents.NEW_JOB]: NewJobEvent;
  [SocketEvents.JOB_ACCEPTED]: JobAcceptedEvent;
  [SocketEvents.JOB_CANCELLED]: JobCancelledEvent;
  [SocketEvents.COURIER_LOCATION]: CourierLocationEvent;
  [SocketEvents.JOB_COMPLETED]: JobCompletedEvent;
  [SocketEvents.JOB_MESSAGE]: JobMessageEvent;
}

export const SocketRooms = {
  company: (companyId: string) => `company:${companyId}`,
  courier: (courierId: string) => `courier:${courierId}`,
  job: (jobId: string) => `job:${jobId}`,
  admins: () => 'admins',
} as const;
