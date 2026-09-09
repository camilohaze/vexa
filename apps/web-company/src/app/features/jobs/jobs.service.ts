import { inject, Injectable } from '@angular/core';
import { Job, JobStatus, Paginated } from '@vexa/shared';
import { ApiService } from '../../core/api/api.service';

export interface CreateJobPayload {
  pickup: { line1: string; city: string; lat: number; lng: number; line2?: string; reference?: string };
  dropoff: { line1: string; city: string; lat: number; lng: number; line2?: string; reference?: string };
  price: number;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly api = inject(ApiService);

  list(params: { status?: JobStatus; page?: number; pageSize?: number } = {}) {
    return this.api.get<Paginated<Job>>('jobs', params as Record<string, string | number>);
  }

  getById(id: string) {
    return this.api.get<Job>(`jobs/${id}`);
  }

  create(payload: CreateJobPayload) {
    return this.api.post<Job>('jobs', payload);
  }

  cancel(id: string, reason?: string) {
    return this.api.post<Job>(`jobs/${id}/cancel`, { reason });
  }

  rate(id: string, score: number, comment?: string) {
    return this.api.post<Job>(`jobs/${id}/rate`, { score, comment });
  }

  priceEstimate(params: { distanceMeters: number; weightKg?: number; priority?: 'standard' | 'express' }) {
    return this.api.get<{
      price: number;
      currency: string;
      breakdown: { base: number; distance: number; weight: number; priorityMultiplier: number };
    }>('jobs/price-estimate', params as Record<string, string | number>);
  }
}
