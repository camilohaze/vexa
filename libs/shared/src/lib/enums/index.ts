export enum UserRole {
  ADMIN = 'ADMIN',
  COMPANY = 'COMPANY',
  COURIER = 'COURIER',
}

export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  APPLE = 'APPLE',
  FACEBOOK = 'FACEBOOK',
}

export enum JobStatus {
  PENDING = 'PENDING',
  OFFERED = 'OFFERED',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum CourierStatus {
  OFFLINE = 'OFFLINE',
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
}

export enum VehicleType {
  BICYCLE = 'BICYCLE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  REFUNDED = 'REFUNDED',
  ERROR = 'ERROR',
}

export enum PaymentProvider {
  WOMPI = 'WOMPI',
  STRIPE_CONNECT = 'STRIPE_CONNECT',
  MERCADO_PAGO = 'MERCADO_PAGO',
  PAYU = 'PAYU',
}
