import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@vexa/core';
import {
  Job,
  JobAcceptedEvent,
  JobCancelledEvent,
  MatchingDefaults,
  NewJobEvent,
  RedisChannels,
  RedisKeys,
} from '@vexa/shared';

const MAX_ROUNDS = 3;

@Injectable()
export class MatchingService implements OnModuleInit {
  private readonly logger = new Logger(MatchingService.name);
  private readonly radiusMeters: number;
  private readonly maxCandidates: number;
  private readonly offerTtlSeconds: number;

  /** jobId → timer del round actual de oferta. */
  private readonly pending = new Map<string, NodeJS.Timeout>();
  private readonly jobs = new Map<string, Job>();

  constructor(
    private readonly redis: RedisService,
    config: ConfigService
  ) {
    this.radiusMeters = config.get<number>('MATCHING_RADIUS_METERS', MatchingDefaults.RADIUS_METERS);
    this.maxCandidates = config.get<number>('MATCHING_MAX_CANDIDATES', MatchingDefaults.MAX_CANDIDATES);
    this.offerTtlSeconds = config.get<number>('MATCHING_OFFER_TTL_SECONDS', MatchingDefaults.OFFER_TTL_SECONDS);
  }

  async onModuleInit() {
    await this.redis.subscribe<Job>(RedisChannels.JOB_CREATED, (job) => this.handleNewJob(job));
    await this.redis.subscribe<JobAcceptedEvent>(RedisChannels.JOB_ACCEPTED, (e) =>
      this.clear(e.jobId)
    );
    await this.redis.subscribe<JobCancelledEvent>(RedisChannels.JOB_CANCELLED, (e) =>
      this.clear(e.jobId)
    );
    this.logger.log(`Listening for jobs (radius=${this.radiusMeters}m, candidates<=${this.maxCandidates})`);
  }

  async handleNewJob(job: Job) {
    if (!job?.id || !job.pickup) {
      this.logger.warn('Malformed job payload, skipping');
      return;
    }
    this.jobs.set(job.id, job);
    await this.offerRound(job, 0);
  }

  /** Oferta el pedido; si expira sin aceptación, expande el radio y reintenta. */
  private async offerRound(job: Job, round: number) {
    const radius = this.radiusMeters * (round + 1);
    const candidates = await this.redis.findNearbyCouriers(
      { lat: job.pickup.lat, lng: job.pickup.lng },
      radius,
      this.maxCandidates
    );

    if (!candidates.length) {
      if (round + 1 < MAX_ROUNDS) return this.scheduleRetry(job, round + 1);
      this.logger.warn(`Job ${job.id}: sin repartidores tras ${MAX_ROUNDS} rondas`);
      this.jobs.delete(job.id);
      return;
    }

    const offeredTo = candidates.map((c) => c.courierId);
    const expiresAt = new Date(Date.now() + this.offerTtlSeconds * 1000);
    await this.redis.client.set(
      RedisKeys.JOB_OFFER(job.id),
      JSON.stringify({ offeredTo, expiresAt, round }),
      'EX',
      this.offerTtlSeconds
    );
    const event: NewJobEvent = { job, offeredTo, expiresAt: expiresAt.toISOString() };
    await this.redis.publish(RedisChannels.JOB_OFFERED, event);
    this.logger.log(`Job ${job.id} ofrecido a ${offeredTo.length} repartidores (ronda ${round + 1}, r=${radius}m)`);

    this.scheduleRetry(job, round + 1);
  }

  /** Si la oferta expira sin `JOB_ACCEPTED`, el timer dispara la siguiente ronda. */
  private scheduleRetry(job: Job, nextRound: number) {
    this.clear(job.id, false);
    const timer = setTimeout(async () => {
      this.pending.delete(job.id);
      const pending = this.jobs.get(job.id);
      if (!pending) return; // aceptado/cancelado entre tanto
      if (nextRound >= MAX_ROUNDS) {
        this.logger.warn(`Job ${job.id}: oferta expirada sin asignación`);
        this.jobs.delete(job.id);
        return;
      }
      await this.offerRound(pending, nextRound);
    }, this.offerTtlSeconds * 1000);
    this.pending.set(job.id, timer);
  }

  private clear(jobId: string, dropJob = true) {
    const timer = this.pending.get(jobId);
    if (timer) clearTimeout(timer);
    this.pending.delete(jobId);
    if (dropJob) this.jobs.delete(jobId);
  }
}
