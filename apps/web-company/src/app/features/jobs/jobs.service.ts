import { inject, Injectable } from '@angular/core';
import { Job, JobDimensions, JobPriceBreakdown, JobStatus, Paginated } from '@vexa/shared';
import { ApiService } from '../../core/api/api.service';

export interface CreateJobPayload {
  pickup: { line1: string; city: string; lat: number; lng: number; line2?: string; reference?: string };
  dropoff: { line1: string; city: string; lat: number; lng: number; line2?: string; reference?: string };
  price: number;
  notes?: string;
  packageType?: string;
  weightKg?: number;
  dimensions?: JobDimensions;
  declaredValue?: number;
  fragile?: boolean;
  refrigerated?: boolean;
  priority?: 'standard' | 'express' | 'same_day';
  priceBreakdown?: JobPriceBreakdown;
  durationSeconds?: number;
}

export interface DeliveryHistoryStats {
  totalCount: number;
  totalSpend: number;
  avgTransportSeconds: number;
}

export interface JobWithCourier extends Job {
  courier?: { id: string; user?: { fullName?: string } } | null;
}

export interface DeliveryHistoryPage extends Paginated<JobWithCourier> {
  stats: DeliveryHistoryStats;
}

@Injectable({ providedIn: 'root' })
export class JobsService {
  private readonly api = inject(ApiService);

  list(params: { status?: JobStatus; page?: number; pageSize?: number } = {}) {
    return this.api.get<Paginated<JobWithCourier>>('jobs', params as Record<string, string | number>);
  }

  getById(id: string) {
    return this.api.get<Job>(`jobs/${id}`);
  }

  create(payload: CreateJobPayload) {
    return this.api.post<Job>('jobs', payload);
  }

  history(params: { from?: string; to?: string; search?: string; page?: number; pageSize?: number } = {}) {
    return this.api.get<DeliveryHistoryPage>('jobs/history', params as Record<string, string | number>);
  }

  cancel(id: string, reason?: string) {
    return this.api.post<Job>(`jobs/${id}/cancel`, { reason });
  }

  rate(id: string, score: number, comment?: string) {
    return this.api.post<Job>(`jobs/${id}/rate`, { score, comment });
  }

  priceEstimate(params: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    weightKg?: number;
    priority?: 'standard' | 'express' | 'same_day';
  }) {
    return this.api.get<{
      price: number;
      currency: string;
      distanceMeters: number;
      durationSeconds: number;
      trafficAware: boolean;
      demand: { availableCouriersNearby: number; activeJobsNearby: number };
      breakdown: JobPriceBreakdown;
    }>('jobs/price-estimate', params as Record<string, string | number>);
  }
}
