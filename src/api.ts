import {
  User,
  SportType,
  Facility,
  Booking,
  Equipment,
  MaintenanceReport,
  WorkOrder,
  DashboardSummary,
} from './types.ts';

const TOKEN_KEY = 'sfms_auth_token';
const USER_KEY = 'sfms_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: { code: 'PARSE_ERROR', message: 'Failed to parse JSON response' },
  }));

  if (!response.ok || !data.success) {
    const error: any = new Error(data.error?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.error?.code;
    error.conflicts = data.error?.conflicts;
    throw error;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    role: 'MEMBER' | 'MAINTENANCE_STAFF';
    phone?: string;
    department?: string;
  }) =>
    request<{ user_id: number; full_name: string; email: string; role: string; account_status: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  getMe: () => request<User>('/api/auth/me'),
  getDemoUsers: () => request<User[]>('/api/auth/demo-users'),

  // Facilities
  getFacilities: (sportTypeId?: number, query?: string) => {
    const params = new URLSearchParams();
    if (sportTypeId) params.set('sport_type_id', String(sportTypeId));
    if (query) params.set('q', query);
    const qs = params.toString();
    return request<Facility[]>(`/api/facilities${qs ? `?${qs}` : ''}`);
  },
  getSportTypes: () => request<SportType[]>('/api/facilities/sport-types'),
  getFacility: (id: number) => request<Facility>(`/api/facilities/${id}`),
  getFacilityAvailability: (facilityId: number, dateStr: string) =>
    request<{
      facility_id: number;
      date: string;
      operating_hours: any[];
      reserved_slots: Array<{
        booking_id: number;
        start_at: string;
        end_at: string;
        status: string;
        purpose: string;
      }>;
    }>(`/api/facilities/${facilityId}/availability?date=${dateStr}`),

  // Bookings (Member)
  getMyBookings: () => request<Booking[]>('/api/bookings/me'),
  createBooking: (data: {
    facility_id: number;
    start_at: string;
    end_at: string;
    participant_count: number;
    purpose: string;
  }) =>
    request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancelBooking: (id: number, reason?: string) =>
    request<{ message: string }>(`/api/bookings/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  // Admin Operations
  getAllBookings: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<Booking[]>(`/api/admin/bookings${qs}`);
  },
  decideBooking: (bookingId: number, status: 'APPROVED' | 'REJECTED', decision_note?: string) =>
    request<{ message: string }>(`/api/admin/bookings/${bookingId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status, decision_note }),
    }),

  // User & Staff Registrations (Admin Approval)
  getPendingUsers: () => request<User[]>('/api/admin/users/pending'),
  getAllUsers: (status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request<User[]>(`/api/admin/users${qs}`);
  },
  decideUser: (userId: number, status: 'ACTIVE' | 'REJECTED') =>
    request<{ message: string }>(`/api/admin/users/${userId}/decision`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  createFacility: (data: any) =>
    request<{ facility_id: number }>('/api/admin/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFacility: (id: number, data: any) =>
    request<{ message: string }>(`/api/admin/facilities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateFacilityStatus: (id: number, status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE') =>
    request<{ message: string }>(`/api/admin/facilities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updateOperatingHours: (facilityId: number, hours: Array<{ day_of_week: number; opens_at: string; closes_at: string }>) =>
    request<{ message: string }>(`/api/admin/facilities/${facilityId}/operating-hours`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    }),

  // Equipment
  getEquipment: (facilityId?: number) => {
    const qs = facilityId ? `?facility_id=${facilityId}` : '';
    return request<Equipment[]>(`/api/admin/equipment${qs}`);
  },
  createEquipment: (data: any) =>
    request<{ equipment_id: number }>('/api/admin/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEquipment: (id: number, data: any) =>
    request<{ message: string }>(`/api/admin/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteEquipment: (id: number) =>
    request<{ message: string }>(`/api/admin/equipment/${id}`, {
      method: 'DELETE',
    }),

  // Maintenance
  getMaintenanceReports: () => request<MaintenanceReport[]>('/api/maintenance/reports'),
  createMaintenanceReport: (data: {
    facility_id: number;
    title: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) =>
    request<{ report_id: number }>('/api/maintenance/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getWorkOrders: (assignedTo?: number) => {
    const qs = assignedTo ? `?assigned_to=${assignedTo}` : '';
    return request<WorkOrder[]>(`/api/maintenance/work-orders${qs}`);
  },
  assignWorkOrder: (reportId: number, assignedTo: number) =>
    request<{ work_order_id: number }>('/api/maintenance/work-orders/assign', {
      method: 'POST',
      body: JSON.stringify({ report_id: reportId, assigned_to: assignedTo }),
    }),
  updateWorkOrderStatus: (
    workOrderId: number,
    status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
    resolutionNotes: string
  ) =>
    request<{ message: string }>(`/api/maintenance/work-orders/${workOrderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolution_notes: resolutionNotes }),
    }),
  getMaintenanceStaffList: () =>
    request<Array<{ user_id: number; full_name: string; email: string }>>('/api/maintenance/staff-list'),

  // Analytics & Reports
  getDashboardSummary: () => request<DashboardSummary>('/api/admin/reports/summary'),
  getBookingsByStatus: () => request<Array<{ status: string; count: number; percentage: number }>>('/api/admin/reports/by-status'),
  getMostBookedFacilities: () => request<any[]>('/api/admin/reports/most-booked'),
  getMonthlyVolume: () => request<any[]>('/api/admin/reports/monthly'),
  getUtilization: () => request<any[]>('/api/admin/reports/utilization'),
  getMaintenanceBacklog: () => request<any[]>('/api/admin/reports/maintenance-backlog'),

  // Views
  getViewPendingBookings: () => request<any[]>('/api/admin/reports/views/pending'),
  getViewFacilitySummary: () => request<any[]>('/api/admin/reports/views/facility-summary'),
  getViewMaintenanceBacklog: () => request<any[]>('/api/admin/reports/views/maintenance-backlog'),
};
