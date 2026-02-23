export type UserRole = 'client' | 'partner' | 'admin';

export type PackageSize = 'small' | 'medium' | 'large';

export type MissionStatus =
  | 'pending'
  | 'accepted'
  | 'collected'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Mission {
  id: string;
  client_id: string;
  partner_id: string | null;
  package_photo_url: string | null;
  package_title: string;
  package_size: PackageSize;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  pickup_time_slot: string;
  status: MissionStatus;
  price: number;
  commission: number;
  qr_code: string | null;
  created_at: string;
  completed_at: string | null;
  // Joined fields
  client_first_name?: string;
  client_last_name?: string;
  partner_first_name?: string;
  partner_last_name?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  verified: boolean;
  phone?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;      // ex: "mission_accepted", "delivery_completed", "maintenance"
  message: string;
  read: boolean;
  created_at: string;
}
