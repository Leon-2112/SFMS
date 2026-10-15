import { getConnection, query } from '../db/pool.ts';
import { calculateBookingPrice, isParticipantCountValid, isWithinOperatingHours } from '../../src/utils/rules.ts';

export class BookingConflictError extends Error {
  statusCode: number;
  conflictingBookings: any[];
  constructor(message: string, conflicts: any[] = []) {
    super(message);
    this.name = 'BookingConflictError';
    this.statusCode = 409;
    this.conflictingBookings = conflicts;
  }
}

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export interface BookingRow {
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

/**
 * Transaction-safe booking creation with InnoDB row-level locking
 */
export async function createBookingWithTransaction(data: {
  member_id: number;
  facility_id: number;
  start_at: string;
  end_at: string;
  participant_count: number;
  purpose: string;
}): Promise<BookingRow> {
  const { member_id, facility_id, start_at, end_at, participant_count, purpose } = data;

  const startDate = new Date(start_at);
  const endDate = new Date(end_at);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ValidationError('Invalid start_at or end_at datetime string');
  }

  if (startDate >= endDate) {
    throw new ValidationError('Reservation start time must be strictly before end time');
  }

  const now = new Date();
  if (startDate.getTime() < now.getTime() - 60000) {
    throw new ValidationError('Reservation cannot be scheduled in the past');
  }

  // Check out dedicated pool connection to maintain transaction boundary and row locks
  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    // 1. Lock the stable facility row using SELECT ... FOR UPDATE
    // This serializes concurrent booking requests targeting the same facility
    const [facilities]: any = await conn.execute(
      'SELECT facility_id, name, capacity, hourly_rate, facility_status FROM facilities WHERE facility_id = ? FOR UPDATE',
      [facility_id]
    );

    if (!facilities || facilities.length === 0) {
      throw new ValidationError(`Facility #${facility_id} does not exist`);
    }

    const facility = facilities[0];

    if (facility.facility_status !== 'ACTIVE') {
      throw new ValidationError(
        `Facility '${facility.name}' is currently in ${facility.facility_status} status and cannot accept bookings.`
      );
    }

    // 2. Validate participant count against venue capacity
    const numCapacity = Number(facility.capacity);
    if (!isParticipantCountValid(participant_count, numCapacity)) {
      throw new ValidationError(
        `Participant count (${participant_count}) exceeds venue capacity (${numCapacity}) or is invalid.`
      );
    }

    // 3. Validate operating hours on the scheduled day
    const dayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    const [opHours]: any = await conn.execute(
      'SELECT opens_at, closes_at FROM operating_hours WHERE facility_id = ? AND day_of_week = ? LIMIT 1',
      [facility_id, dayOfWeek]
    );

    if (opHours && opHours.length > 0) {
      const { opens_at, closes_at } = opHours[0];
      if (!isWithinOperatingHours(startDate, endDate, opens_at, closes_at)) {
        throw new ValidationError(
          `Requested slot is outside operating hours (${opens_at.substring(0, 5)} - ${closes_at.substring(0, 5)}) on this day.`
        );
      }
    }

    // 4. Check for overlapping active bookings (Half-open interval overlap check)
    // Only PENDING and APPROVED bookings block availability
    const [conflicts]: any = await conn.execute(
      `SELECT booking_id, start_at, end_at, status, purpose 
       FROM bookings 
       WHERE facility_id = ? 
         AND status IN ('PENDING', 'APPROVED') 
         AND start_at < ? 
         AND end_at > ?`,
      [facility_id, end_at, start_at]
    );

    if (conflicts && conflicts.length > 0) {
      await conn.rollback();
      throw new BookingConflictError(
        `Time collision: The requested interval [${start_at} - ${end_at}) conflicts with ${conflicts.length} existing active booking(s).`,
        conflicts
      );
    }

    // 5. Calculate price snapshot
    const hourlyRate = Number(facility.hourly_rate);
    const totalPrice = calculateBookingPrice(startDate, endDate, hourlyRate);

    // 6. Insert new booking
    const [insertResult]: any = await conn.execute(
      `INSERT INTO bookings (
         member_id, facility_id, start_at, end_at, 
         participant_count, purpose, hourly_rate_at_booking, total_price, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        member_id,
        facility_id,
        start_at,
        end_at,
        participant_count,
        purpose,
        hourlyRate,
        totalPrice,
      ]
    );

    const bookingId = insertResult.insertId;

    // 7. Insert audit log
    await conn.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOKING_REQUEST', 'BOOKING', ?, ?)`,
      [
        member_id,
        bookingId,
        `Created pending reservation for facility ${facility.name} [${start_at} - ${end_at})`,
      ]
    );

    // Commit transaction
    await conn.commit();

    // Return the newly created booking record
    const [createdRows]: any = await conn.execute(
      `SELECT b.*, f.name AS facility_name, st.name AS sport_name
       FROM bookings b
       JOIN facilities f ON f.facility_id = b.facility_id
       JOIN sport_types st ON st.sport_type_id = f.sport_type_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    return createdRows[0];
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rbErr) {
      console.error('[BookingTransaction] Rollback error:', rbErr);
    }
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Member's personal booking history
 */
export async function getMemberBookings(memberId: number): Promise<BookingRow[]> {
  const sql = `
    SELECT 
      b.booking_id,
      b.member_id,
      b.facility_id,
      f.name AS facility_name,
      st.name AS sport_name,
      b.start_at,
      b.end_at,
      b.participant_count,
      b.purpose,
      b.hourly_rate_at_booking,
      b.total_price,
      b.status,
      b.decision_note,
      b.created_at
    FROM bookings b
    JOIN facilities f ON f.facility_id = b.facility_id
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    WHERE b.member_id = ?
    ORDER BY b.start_at DESC
  `;
  return await query<BookingRow[]>(sql, [memberId]);
}

/**
 * Active bookings for a facility on a specific date (for live availability view)
 */
export async function getFacilityBookingsForDate(facilityId: number, dateStr: string): Promise<BookingRow[]> {
  const sql = `
    SELECT booking_id, facility_id, start_at, end_at, status, purpose, participant_count
    FROM bookings
    WHERE facility_id = ?
      AND status IN ('PENDING', 'APPROVED')
      AND DATE(start_at) = ?
    ORDER BY start_at ASC
  `;
  return await query<BookingRow[]>(sql, [facilityId, dateStr]);
}

/**
 * Admin view: all bookings with filtering
 */
export async function listAllBookings(statusFilter?: string): Promise<BookingRow[]> {
  let sql = `
    SELECT 
      b.booking_id,
      b.member_id,
      u.full_name AS member_name,
      u.email AS member_email,
      b.facility_id,
      f.name AS facility_name,
      st.name AS sport_name,
      b.start_at,
      b.end_at,
      b.participant_count,
      b.purpose,
      b.hourly_rate_at_booking,
      b.total_price,
      b.status,
      b.decided_by,
      decider.full_name AS decider_name,
      b.decision_note,
      b.decided_at,
      b.created_at
    FROM bookings b
    JOIN users u ON u.user_id = b.member_id
    JOIN facilities f ON f.facility_id = b.facility_id
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    LEFT JOIN users decider ON decider.user_id = b.decided_by
    WHERE 1=1
  `;
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'ALL') {
    sql += ' AND b.status = ?';
    params.push(statusFilter);
  }
  sql += ' ORDER BY b.start_at DESC';

  return await query<BookingRow[]>(sql, params);
}

/**
 * Admin decision: approve or reject
 */
export async function decideBooking(
  bookingId: number,
  adminUserId: number,
  status: 'APPROVED' | 'REJECTED',
  decisionNote?: string
): Promise<boolean> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [rows]: any = await conn.execute(
      'SELECT booking_id, status FROM bookings WHERE booking_id = ? FOR UPDATE',
      [bookingId]
    );

    if (!rows || rows.length === 0) {
      throw new ValidationError(`Booking #${bookingId} not found`);
    }

    const currentBooking = rows[0];
    if (currentBooking.status !== 'PENDING') {
      throw new ValidationError(
        `Cannot decide booking with status '${currentBooking.status}'. Only PENDING bookings can be decided.`
      );
    }

    await conn.execute(
      `UPDATE bookings 
       SET status = ?, decided_by = ?, decision_note = ?, decided_at = CURRENT_TIMESTAMP
       WHERE booking_id = ?`,
      [status, adminUserId, decisionNote || null, bookingId]
    );

    await conn.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'BOOKING', ?, ?)`,
      [
        adminUserId,
        status === 'APPROVED' ? 'BOOKING_APPROVAL' : 'BOOKING_REJECTION',
        bookingId,
        `Booking ${bookingId} was ${status} with note: ${decisionNote || 'None'}`,
      ]
    );

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Member or admin cancellation
 */
export async function cancelBooking(
  bookingId: number,
  userId: number,
  userRole: 'MEMBER' | 'ADMIN' | 'MAINTENANCE_STAFF',
  reason?: string
): Promise<boolean> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [rows]: any = await conn.execute(
      'SELECT booking_id, member_id, status FROM bookings WHERE booking_id = ? FOR UPDATE',
      [bookingId]
    );

    if (!rows || rows.length === 0) {
      throw new ValidationError(`Booking #${bookingId} not found`);
    }

    const b = rows[0];
    if (b.status !== 'PENDING' && b.status !== 'APPROVED') {
      throw new ValidationError(`Cannot cancel booking in ${b.status} state.`);
    }

    if (userRole !== 'ADMIN' && b.member_id !== userId) {
      throw new ValidationError('You do not own this reservation.');
    }

    await conn.execute(
      `UPDATE bookings 
       SET status = 'CANCELLED', decision_note = CONCAT(COALESCE(decision_note, ''), ' [Cancelled: ', ?)
       WHERE booking_id = ?`,
      [reason || 'Cancelled by user', bookingId]
    );

    await conn.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'BOOKING_CANCELLATION', 'BOOKING', ?, ?)`,
      [userId, bookingId, `Cancelled booking #${bookingId}: ${reason || 'User requested'}`]
    );

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
