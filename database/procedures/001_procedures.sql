-- ============================================================================
-- Sports Facilities Management System (SFMS)
-- Stored Procedures: 001_procedures.sql
-- ============================================================================

USE sfms;

DROP PROCEDURE IF EXISTS sp_get_facility_booking_summary;

DELIMITER $$

CREATE PROCEDURE sp_get_facility_booking_summary(
    IN p_start DATETIME,
    IN p_end DATETIME
)
BEGIN
    -- Demonstrates parameterized date range filtering, grouping, and aggregations in SQL
    SELECT 
        f.facility_id,
        f.name AS facility_name,
        st.name AS sport_name,
        COUNT(b.booking_id) AS total_requests,
        SUM(CASE WHEN b.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
        SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN b.status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
        COALESCE(SUM(CASE WHEN b.status IN ('APPROVED', 'COMPLETED') THEN b.total_price ELSE 0.00 END), 0.00) AS period_revenue,
        COALESCE(SUM(CASE WHEN b.status IN ('APPROVED', 'COMPLETED') 
                          THEN TIMESTAMPDIFF(MINUTE, b.start_at, b.end_at) 
                          ELSE 0 END) / 60.0, 0.0) AS total_booked_hours
    FROM facilities f
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    LEFT JOIN bookings b ON b.facility_id = f.facility_id 
        AND b.start_at >= p_start 
        AND b.end_at <= p_end
    GROUP BY f.facility_id, f.name, st.name
    ORDER BY approved_count DESC, total_requests DESC;
END$$

DELIMITER ;
