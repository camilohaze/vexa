import {
  AuthProvider,
  CourierStatus,
  JobStatus,
  PaymentProvider,
  PaymentStatus,
  UserRole,
  VehicleType,
} from '../enums';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address extends GeoPoint {
  line1: string;
  line2?: string;
  city: string;
  reference?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  provider: AuthProvider;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Courier {
  id: string;
  userId: string;
  status: CourierStatus;
  vehicle: VehicleType;
  rating: number;
  deliveredCount?: number;
  verificationStatus?: string;
  lastLocation?: GeoPoint;
  fcmToken?: string;
}

export interface JobDimensions {
  l: number;
  w: number;
  h: number;
}

export interface JobPriceBreakdown {
  base: number;
  distance: number;
  time: number;
  weight: number;
  priorityMultiplier: number;
  subtotal: number;
  commission: number;
}

export interface Job {
  id: string;
  companyId: string;
  courierId?: string;
  status: JobStatus;
  pickup: Address;
  dropoff: Address;
  price: number;
  distanceMeters?: number;
  notes?: string;
  packageType?: string;
  weightKg?: number;
  dimensions?: JobDimensions;
  declaredValue?: number;
  fragile?: boolean;
  refrigerated?: boolean;
  priority?: 'standard' | 'express' | 'same_day';
  priceBreakdown?: JobPriceBreakdown;
  proofOfDeliveryUrl?: string;
  podSignedBy?: string;
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  jobId: string;
  provider: PaymentProvider;
  reference?: string;
  providerReference?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
