-- ============================================================================
-- Sports Facilities Management System (SFMS)
-- Assessed SQL Query Library: 001_queries.sql
-- Covers Patterns A through G, Joins, Aggregations, Subqueries/CTEs, and EXPLAIN plans.
-- ============================================================================

USE sfms;

-- ----------------------------------------------------------------------------
-- Pattern A: Check Overlapping Active Bookings (Used in Transaction with Row Lock)
-- Half-open interval overlap predicate:
-- existing.start_at < requested_end AND existing.end_at > requested_start
-- Only statuses that hold capacity (PENDING, APPROVED) block availability.
-- ----------------------------------------------------------------------------
-- Parameters: [facility_id = 2, requested_end = '2026-10-16 10:30:00', requested_start = '2026-10-16 09:30:00']
EXPLAIN
SELECT booking_id, facility_id, start_at, end_at, status, purpose
FROM bookings
WHERE facility_id = 2
  AND status IN ('PENDING', 'APPROVED')
  AND start_at < '2026-10-16 10:30:00'
  AND end_at > '2026-10-16 09:30:00';

-- ----------------------------------------------------------------------------
-- Pattern B: Member Booking History (Join with Facility and Sport Type)
-- ----------------------------------------------------------------------------
EXPLAIN
SELECT 
    b.booking_id, 
    f.name AS facility_name, 
    st.name AS sport,
    b.start_at, 
    b.end_at, 
    b.participant_count,
    b.total_price,
    b.status,
    b.decision_note,
    b.created_at
FROM bookings b
JOIN facilities f ON f.facility_id = b.facility_id
JOIN sport_types st ON st.sport_type_id = f.sport_type_id
WHERE b.member_id = 4
ORDER BY b.start_at DESC;

-- ----------------------------------------------------------------------------
-- Pattern C: Bookings Grouped by Status (Aggregate Distribution)
-- ----------------------------------------------------------------------------
SELECT 
    status, 
    COUNT(*) AS booking_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bookings), 1) AS percentage_of_total
FROM bookings
GROUP BY status
ORDER BY booking_count DESC;

-- ----------------------------------------------------------------------------
-- Pattern D: Most Booked Facilities (Top Venues by Approved Count)
-- ----------------------------------------------------------------------------
SELECT 
    f.facility_id, 
    f.name AS facility_name,
    st.name AS sport,
    COUNT(b.booking_id) AS approved_booking_count,
    COALESCE(SUM(b.total_price), 0.00) AS total_revenue
FROM facilities f
JOIN sport_types st ON st.sport_type_id = f.sport_type_id
LEFT JOIN bookings b ON b.facility_id = f.facility_id AND b.status = 'APPROVED'
GROUP BY f.facility_id, f.name, st.name
ORDER BY approved_booking_count DESC, total_revenue DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- Pattern E: Monthly Reservation Volume (Time-series Aggregation)
-- ----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(start_at, '%Y-%m') AS booking_month,
    COUNT(*) AS total_reservations,
    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_reservations,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_reservations,
    COALESCE(SUM(total_price), 0.00) AS monthly_revenue_estimate
FROM bookings
WHERE status IN ('PENDING', 'APPROVED', 'COMPLETED')
GROUP BY DATE_FORMAT(start_at, '%Y-%m')
ORDER BY booking_month ASC;

-- ----------------------------------------------------------------------------
-- Pattern F: Active Facilities With No Upcoming Future Active Bookings (NOT EXISTS)
-- ----------------------------------------------------------------------------
SELECT 
    f.facility_id, 
    f.name AS facility_name,
    f.location,
    st.name AS sport
FROM facilities f
JOIN sport_types st ON st.sport_type_id = f.sport_type_id
WHERE f.facility_status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.facility_id = f.facility_id
      AND b.status IN ('PENDING', 'APPROVED')
      AND b.end_at > '2026-10-15 10:00:00'
  );

-- ----------------------------------------------------------------------------
-- Pattern G: Maintenance Backlog Grouped by Severity and Status
-- ----------------------------------------------------------------------------
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
    issue_count DESC;

-- ----------------------------------------------------------------------------
-- Pattern H: Facility Utilization Estimate
-- Booked Duration (minutes) / Total Available Operating Duration across 7 days
-- ----------------------------------------------------------------------------
SELECT 
    f.facility_id,
    f.name AS facility_name,
    st.name AS sport,
    COALESCE(SUM(
        CASE WHEN b.status IN ('APPROVED', 'COMPLETED') 
             THEN TIMESTAMPDIFF(MINUTE, b.start_at, b.end_at) 
             ELSE 0 END
    ), 0) AS booked_minutes,
    (7 * 16 * 60) AS weekly_available_minutes, -- 7 days * 16 operating hours (06:00 to 22:00)
    ROUND(
        COALESCE(SUM(
            CASE WHEN b.status IN ('APPROVED', 'COMPLETED') 
                 THEN TIMESTAMPDIFF(MINUTE, b.start_at, b.end_at) 
                 ELSE 0 END
        ), 0) * 100.0 / (7 * 16 * 60), 
        2
    ) AS estimated_utilization_pct
FROM facilities f
JOIN sport_types st ON st.sport_type_id = f.sport_type_id
LEFT JOIN bookings b ON b.facility_id = f.facility_id
GROUP BY f.facility_id, f.name, st.name
ORDER BY estimated_utilization_pct DESC;
