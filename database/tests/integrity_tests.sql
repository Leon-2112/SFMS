-- ============================================================================
-- Sports Facilities Management System (SFMS)
-- DBMS Integrity Test Suite: integrity_tests.sql
-- ============================================================================

USE sfms;

-- Test 1: Verify UNIQUE constraint on users(email)
-- Expected: Error 1062 (23000): Duplicate entry
-- INSERT INTO users (full_name, email, password_hash, role)
-- VALUES ('Duplicate User', 'admin@campus.edu', 'hash', 'MEMBER');

-- Test 2: Verify CHECK constraint on capacity > 0
-- Expected: Error 3819 (HY000): Check constraint 'chk_facilities_capacity' is violated
-- INSERT INTO facilities (sport_type_id, name, location, capacity, hourly_rate)
-- VALUES (1, 'Invalid Capacity Venue', 'Building A', 0, 10.00);

-- Test 3: Verify CHECK constraint on bookings time order (start_at < end_at)
-- Expected: Error 3819 (HY000): Check constraint 'chk_bookings_time_order' is violated
-- INSERT INTO bookings (member_id, facility_id, start_at, end_at, participant_count, purpose)
-- VALUES (4, 1, '2026-10-20 12:00:00', '2026-10-20 11:00:00', 2, 'Time travel request');

-- Test 4: Verify FOREIGN KEY RESTRICT on deleting facility with bookings
-- Expected: Error 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails
-- DELETE FROM facilities WHERE facility_id = 2;

-- Test 5: Verify FOREIGN KEY RESTRICT on deleting user with bookings
-- Expected: Error 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails
-- DELETE FROM users WHERE user_id = 4;

-- Test 6: Verify Overlap Query Resolution
-- Adjacent interval check:
-- Existing booking on facility 2 is from 09:00 to 10:00.
-- A request from 10:00 to 11:00 MUST produce 0 conflict rows:
SELECT COUNT(*) AS conflict_count
FROM bookings
WHERE facility_id = 2
  AND status IN ('PENDING', 'APPROVED')
  AND start_at < '2026-10-16 11:00:00'
  AND end_at > '2026-10-16 10:00:00'
  AND booking_id NOT IN (2); -- Exclude existing second booking for test isolation
