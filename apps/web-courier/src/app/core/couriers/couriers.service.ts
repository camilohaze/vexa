import { inject, Injectable } from '@angular/core';
import { Courier, CourierStatus } from '@vexa/shared';
import { ApiService } from '../api/api.service';

export interface CourierEarnings {
  today: number;
  week: number;
  month: number;
  completed: number;
  rating: number;
  ratingsCount: number;
  dailyBars: number[];
  breakdown: [string, number, number][];
}

export interface CourierTransaction {
  id: string;
  title: string;
  at: string;
  amount: number;
  status: string;
}

export interface PayoutMethod {
  key: string;
  label: string;
  detail: string;
  fee: string;
  time: string;
}

export interface CourierPerformance {
  onTimeRate: number;
  acceptanceRate: number;
  completionRate: number;
  rating: number;
  ratingsCount: number;
  avgDeliveryMinutes: number | null;
  totalJobs: number;
}

export interface CourierReview {
  id: string;
  author: string;
  when: string;
  stars: number;
  text: string;
}

export interface CourierReviews {
  average: number;
  total: number;
  distribution: number[];
  comments: CourierReview[];
}

export interface VehicleDetails {
  make?: string;
  year?: number;
  plate?: string;
  color?: string;
}

export type VerificationStatus = 'required' | 'pending' | 'verified' | 'rejected';

export interface VerificationStep {
  type: 'identity' | 'vehicle' | 'insurance' | 'background';
  status: VerificationStatus;
  urls: string[];
}

export interface CourierVerification {
  steps: VerificationStep[];
  progress: number;
  vehicleDetails: VehicleDetails | null;
}

@Injectable({ providedIn: 'root' })
export class CouriersService {
  private readonly api = inject(ApiService);

  me() {
    return this.api.get<Courier>('couriers/me');
  }

  earnings() {
    return this.api.get<CourierEarnings>('couriers/me/earnings');
  }

  updateStatus(status: CourierStatus) {
    return this.api.patch<Courier>('couriers/me/status', { status });
  }

  transactions() {
    return this.api.get<CourierTransaction[]>('couriers/me/transactions');
  }

  payoutMethods() {
    return this.api.get<PayoutMethod[]>('couriers/me/payout-methods');
  }

  requestPayout(amount: number, method: string) {
    return this.api.post<unknown>('couriers/me/payouts', { amount, method });
  }

  performance() {
    return this.api.get<CourierPerformance>('couriers/me/performance');
  }

  reviews() {
    return this.api.get<CourierReviews>('couriers/me/reviews');
  }

  verification() {
    return this.api.get<CourierVerification>('couriers/me/verification');
  }

  updateVehicle(dto: VehicleDetails) {
    return this.api.patch<Courier>('couriers/me/vehicle', dto);
  }

  submitVerification(type: VerificationStep['type'], urls: string[]) {
    return this.api.post<unknown>('couriers/me/verification', { type, urls });
  }
}
