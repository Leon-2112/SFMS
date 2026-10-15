/**
 * Core business logic and relational validation rules for SFMS
 * Pure functions decoupled from database and framework drivers
 */

export interface BookingInterval {
  start: Date | string;
  end: Date | string;
}

/**
 * Evaluates whether two half-open intervals [start, end) overlap.
 * Mathematical predicate: existing.start < requested.end AND existing.end > requested.start
 */
export function hasIntervalOverlap(
  existingStart: Date | string,
  existingEnd: Date | string,
  reqStart: Date | string,
  reqEnd: Date | string
): boolean {
  const eStart = new Date(existingStart).getTime();
  const eEnd = new Date(existingEnd).getTime();
  const rStart = new Date(reqStart).getTime();
  const rEnd = new Date(reqEnd).getTime();

  if (isNaN(eStart) || isNaN(eEnd) || isNaN(rStart) || isNaN(rEnd)) {
    throw new Error('Invalid date provided to hasIntervalOverlap');
  }

  if (eStart >= eEnd || rStart >= rEnd) {
    throw new Error('Interval start must be strictly before end');
  }

  return eStart < rEnd && eEnd > rStart;
}

/**
 * Calculates reservation price based on hourly rate and duration in minutes
 */
export function calculateBookingPrice(
  startAt: Date | string,
  endAt: Date | string,
  hourlyRate: number
): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const durationMs = end - start;
  if (durationMs <= 0) return 0;

  const durationHours = durationMs / (1000 * 60 * 60);
  const total = durationHours * hourlyRate;
  return Math.round(total * 100) / 100;
}

/**
 * Validates participant count against venue capacity
 */
export function isParticipantCountValid(
  participantCount: number,
  facilityCapacity: number
): boolean {
  return (
    Number.isInteger(participantCount) &&
    participantCount > 0 &&
    participantCount <= facilityCapacity
  );
}

/**
 * Checks if a time range (HH:mm) is within facility daily operating hours
 */
export function isWithinOperatingHours(
  bookingStart: Date | string,
  bookingEnd: Date | string,
  opensAt: string, // e.g. "06:00:00" or "06:00"
  closesAt: string // e.g. "22:00:00" or "22:00"
): boolean {
  const bStart = new Date(bookingStart);
  const bEnd = new Date(bookingEnd);

  const startMinutes = bStart.getHours() * 60 + bStart.getMinutes();
  const endMinutes = bEnd.getHours() * 60 + bEnd.getMinutes();

  const [openH, openM] = opensAt.split(':').map(Number);
  const [closeH, closeM] = closesAt.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
}

/**
 * Verifies if a user is authorized to cancel a reservation
 */
export function canUserCancelBooking(
  userRole: 'MEMBER' | 'ADMIN' | 'MAINTENANCE_STAFF',
  userId: number,
  bookingMemberId: number,
  bookingStatus: string
): boolean {
  if (bookingStatus !== 'PENDING' && bookingStatus !== 'APPROVED') {
    return false;
  }
  if (userRole === 'ADMIN') {
    return true;
  }
  return userId === bookingMemberId;
}

/**
 * Format currency in Indian Rupees (INR - ₹)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Safely format date into YYYY-MM-DD
 */
export function formatDate(dateStr: string | Date): string {
  if (!dateStr) return '';
  if (typeof dateStr === 'string') {
    return dateStr.replace('T', ' ').substring(0, 10);
  }
  return dateStr.toISOString().split('T')[0];
}

/**
 * Safely format time into HH:mm
 */
export function formatTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  if (typeof dateStr === 'string') {
    const parts = dateStr.replace('T', ' ').split(' ');
    if (parts.length > 1) {
      return parts[1].substring(0, 5);
    }
    return dateStr.substring(0, 5);
  }
  return dateStr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Format a start and end interval for user display: e.g. "2026-10-16 • 10:00 → 11:30"
 */
export function formatDateTimeRange(startStr: string | Date, endStr: string | Date): string {
  const date = formatDate(startStr);
  const start = formatTime(startStr);
  const end = formatTime(endStr);
  return `${date} • ${start} → ${end}`;
}
