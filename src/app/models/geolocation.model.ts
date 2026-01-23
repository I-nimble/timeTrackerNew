export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
  deviceId?: string;
  userId?: string;
}

export interface GeolocationUpdate extends GeolocationData {
  userId: string;
  deviceId: string;
}

export interface GeolocationRequest {
  requesterId: string;
  requesterSocketId: string;
  targetUserId?: string;
  fallback?: boolean;
}

export interface GeolocationDenied {
  userId: string;
  message: string;
}