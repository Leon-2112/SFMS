export type Role = 'MEMBER' | 'ADMIN' | 'MAINTENANCE_STAFF';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: Role;
  account_status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'DEACTIVATED' | 'REJECTED';
  department?: string;
  phone?: string;
  created_at?: string;
}

export interface SportType {
  sport_type_id: number;
  name: string;
  description: string;
  icon_name: string;
}

export interface OperatingHour {
  operating_hour_id: number;
  facility_id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
}

export interface Facility {
  facility_id: number;
  sport_type_id: number;
  sport_name: string;
  name: string;
  location: string;
  is_indoor: number | boolean;
  capacity: number;
  hourly_rate: string | number;
  facility_status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description: string | null;
  image_url: string | null;
  created_at: string;
  operating_hours?: OperatingHour[];
}

export interface Booking {
  booking_id: number;
  member_id: number;
  member_name?: string;
  member_email?: string;
  facility_id: number;
  facility_name?: string;
  sport_name?: string;
  start_at: string;
  end_at: string;
  participant_count: number;
  purpose: string;
  hourly_rate_at_booking: string | number;
  total_price: string | number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  decided_by?: number | null;
  decider_name?: string | null;
  decision_note?: string | null;
  decided_at?: string | null;
  created_at: string;
}

export interface Equipment {
  equipment_id: number;
  facility_id: number;
  facility_name: string;
  asset_tag: string;
  name: string;
  quantity: number;
  condition_status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'NEEDS_REPAIR';
  notes: string | null;
  created_at: string;
}

export interface MaintenanceReport {
  report_id: number;
  facility_id: number;
  facility_name: string;
  submitted_by: number;
  submitter_name: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUBMITTED' | 'IN_REVIEW' | 'WORK_ORDER_CREATED' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  work_order_id?: number | null;
  work_order_status?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
}

export interface WorkOrder {
  work_order_id: number;
  report_id: number;
  facility_name: string;
  report_title: string;
  report_severity: string;
  assigned_to: number | null;
  assigned_name: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution_notes: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DashboardSummary {
  total_facilities: number;
  active_facilities: number;
  total_bookings: number;
  pending_bookings: number;
  approved_bookings: number;
  total_revenue_estimate: number | string;
  open_maintenance_issues: number;
  active_work_orders: number;
  registered_members: number;
  pending_user_registrations: number;
}
