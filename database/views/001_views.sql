-- ============================================================================
-- Sports Facilities Management System (SFMS)
-- Database Views: 001_views.sql
-- Purpose: Encapsulate reporting logic and simplify high-frequency joins.
-- ============================================================================

USE sfms;

-- ----------------------------------------------------------------------------
-- View 1: v_pending_bookings
-- Lists all bookings awaiting administrative review with resolved user/facility details.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_pending_bookings AS
SELECT 
    b.booking_id,
    b.member_id,
    u.full_name AS member_name,
    u.email AS member_email,
    f.facility_id,
    f.name AS facility_name,
    st.name AS sport_name,
    b.start_at,
    b.end_at,
    b.participant_count,
    b.purpose,
    b.total_price,
    b.created_at
FROM bookings b
JOIN users u ON u.user_id = b.member_id
JOIN facilities f ON f.facility_id = b.facility_id
JOIN sport_types st ON st.sport_type_id = f.sport_type_id
WHERE b.status = 'PENDING';

-- ----------------------------------------------------------------------------
-- View 2: v_facility_booking_summary
-- Aggregated operational statistics for facilities, including reservation counts & revenue.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_facility_booking_summary AS
SELECT 
    f.facility_id,
    f.name AS facility_name,
    st.name AS sport_name,
    f.capacity,
    f.hourly_rate,
    f.facility_status,
    COUNT(b.booking_id) AS total_bookings,
    SUM(CASE WHEN b.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_bookings,
    SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_bookings,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bookings,
    COALESCE(SUM(CASE WHEN b.status IN ('APPROVED', 'COMPLETED') THEN b.total_price ELSE 0.00 END), 0.00) AS estimated_revenue,
    MAX(CASE WHEN b.status IN ('PENDING', 'APPROVED') THEN b.start_at ELSE NULL END) AS most_recent_booking
FROM facilities f
JOIN sport_types st ON st.sport_type_id = f.sport_type_id
LEFT JOIN bookings b ON b.facility_id = f.facility_id
GROUP BY f.facility_id, f.name, st.name, f.capacity, f.hourly_rate, f.facility_status;

-- ----------------------------------------------------------------------------
-- View 3: v_maintenance_backlog
-- Active issues and assigned staff work orders requiring facilities attention.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_maintenance_backlog AS
SELECT 
    mr.report_id,
    f.facility_id,
    f.name AS facility_name,
    mr.title,
    mr.description,
    mr.severity,
    mr.status AS report_status,
    mr.created_at AS reported_at,
    u_sub.full_name AS reported_by,
    wo.work_order_id,
    wo.status AS work_order_status,
    u_staff.full_name AS assigned_to_name,
    u_staff.email AS assigned_to_email,
    wo.assigned_at
FROM maintenance_reports mr
JOIN facilities f ON f.facility_id = mr.facility_id
JOIN users u_sub ON u_sub.user_id = mr.submitted_by
LEFT JOIN work_orders wo ON wo.report_id = mr.report_id
LEFT JOIN users u_staff ON u_staff.user_id = wo.assigned_to
WHERE mr.status NOT IN ('RESOLVED', 'CLOSED');
