import { query } from '../db/pool.ts';

export async function getDashboardSummary() {
  const [counts]: any = await query(`
    SELECT 
      (SELECT COUNT(*) FROM facilities) AS total_facilities,
      (SELECT COUNT(*) FROM facilities WHERE facility_status = 'ACTIVE') AS active_facilities,
      (SELECT COUNT(*) FROM bookings) AS total_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'PENDING') AS pending_bookings,
      (SELECT COUNT(*) FROM bookings WHERE status = 'APPROVED') AS approved_bookings,
      (SELECT COALESCE(SUM(total_price), 0.00) FROM bookings WHERE status IN ('APPROVED', 'COMPLETED')) AS total_revenue_estimate,
      (SELECT COUNT(*) FROM maintenance_reports WHERE status NOT IN ('RESOLVED', 'CLOSED')) AS open_maintenance_issues,
      (SELECT COUNT(*) FROM work_orders WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS')) AS active_work_orders,
      (SELECT COUNT(*) FROM users WHERE role = 'MEMBER') AS registered_members,
      (SELECT COUNT(*) FROM users WHERE account_status = 'PENDING_APPROVAL') AS pending_user_registrations
  `);

  return counts;
}

export async function getBookingsByStatus() {
  return await query(`
    SELECT 
      status, 
      COUNT(*) AS count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bookings), 1) AS percentage
    FROM bookings
    GROUP BY status
    ORDER BY count DESC
  `);
}

export async function getMostBookedFacilities() {
  return await query(`
    SELECT 
      f.facility_id, 
      f.name AS facility_name,
      st.name AS sport,
      f.capacity,
      f.hourly_rate,
      COUNT(b.booking_id) AS approved_booking_count,
      COALESCE(SUM(b.total_price), 0.00) AS total_revenue
    FROM facilities f
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    LEFT JOIN bookings b ON b.facility_id = f.facility_id AND b.status IN ('APPROVED', 'COMPLETED')
    GROUP BY f.facility_id, f.name, st.name, f.capacity, f.hourly_rate
    ORDER BY approved_booking_count DESC, total_revenue DESC
  `);
}

export async function getMonthlyReservationVolume() {
  return await query(`
    SELECT 
      DATE_FORMAT(start_at, '%Y-%m') AS booking_month,
      COUNT(*) AS total_reservations,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
      COALESCE(SUM(total_price), 0.00) AS revenue_estimate
    FROM bookings
    WHERE status IN ('PENDING', 'APPROVED', 'COMPLETED')
    GROUP BY DATE_FORMAT(start_at, '%Y-%m')
    ORDER BY booking_month ASC
  `);
}

export async function getFacilityUtilization() {
  return await query(`
    SELECT 
      f.facility_id,
      f.name AS facility_name,
      st.name AS sport,
      f.facility_status,
      COALESCE(SUM(
          CASE WHEN b.status IN ('APPROVED', 'COMPLETED') 
               THEN TIMESTAMPDIFF(MINUTE, b.start_at, b.end_at) 
               ELSE 0 END
      ), 0) AS booked_minutes,
      (7 * 16 * 60) AS weekly_available_minutes,
      ROUND(
          COALESCE(SUM(
              CASE WHEN b.status IN ('APPROVED', 'COMPLETED') 
                   THEN TIMESTAMPDIFF(MINUTE, b.start_at, b.end_at) 
                   ELSE 0 END
          ), 0) * 100.0 / (7 * 16 * 60), 
          2
      ) AS utilization_percentage
    FROM facilities f
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    LEFT JOIN bookings b ON b.facility_id = f.facility_id
    GROUP BY f.facility_id, f.name, st.name, f.facility_status
    ORDER BY utilization_percentage DESC
  `);
}

export async function getMaintenanceBacklogSummary() {
  return await query(`
    SELECT 
      mr.severity, 
      mr.status, 
      COUNT(*) AS issue_count,
      MIN(mr.created_at) AS oldest_unresolved
    FROM maintenance_reports mr
    WHERE mr.status NOT IN ('RESOLVED', 'CLOSED')
    GROUP BY mr.severity, mr.status
    ORDER BY 
      CASE mr.severity 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        WHEN 'LOW' THEN 4 
      END ASC,
      issue_count DESC
  `);
}

export async function getViewPendingBookings() {
  return await query('SELECT * FROM v_pending_bookings ORDER BY created_at DESC');
}

export async function getViewFacilitySummary() {
  return await query('SELECT * FROM v_facility_booking_summary ORDER BY total_bookings DESC');
}

export async function getViewMaintenanceBacklog() {
  return await query('SELECT * FROM v_maintenance_backlog ORDER BY reported_at DESC');
}

export async function executeStoredProcedure(startDate: string, endDate: string) {
  const [result]: any = await query('CALL sp_get_facility_booking_summary(?, ?)', [startDate, endDate]);
  return result[0];
}
