# SQL and DBMS Demonstrations

This document outlines the assessed SQL queries, transactions, concurrency prevention mechanisms, and view implementations.

## 1. Concurrency Control and Race Condition Mitigation
In relational systems without native temporal exclusion constraints (such as MySQL/MariaDB), concurrent booking requests can encounter race conditions:
1. Thread A checks if slot [10:00, 11:00) is free -> sees 0 conflicts.
2. Thread B checks if slot [10:00, 11:00) is free -> sees 0 conflicts.
3. Thread A inserts reservation.
4. Thread B inserts reservation -> **Double Booking Vulnerability!**

### The SFMS Solution: Serialized Facility Lock in a Transaction
Inside an explicit database transaction (`START TRANSACTION`):
1. **Acquire row lock on target facility:**
   ```sql
   SELECT facility_id, facility_status 
   FROM facilities 
   WHERE facility_id = ? 
   FOR UPDATE;
   ```
   This serializes all concurrent booking attempts on the *same facility* while allowing independent bookings on other facilities to execute in parallel without lock contention.

2. **Evaluate Overlap Predicate on Active Bookings:**
   ```sql
   SELECT booking_id, start_at, end_at, status
   FROM bookings
   WHERE facility_id = ?
     AND status IN ('PENDING', 'APPROVED')
     AND start_at < ?   -- requested_end
     AND end_at > ?     -- requested_start;
   ```
   If count > 0: `ROLLBACK` and return HTTP 409 Conflict.

3. **Verify Operating Hours & Capacity:**
   Ensure `participant_count <= capacity` and the interval fits within `opens_at` and `closes_at`.

4. **Insert Booking and Commit:**
   ```sql
   INSERT INTO bookings (
       member_id, facility_id, start_at, end_at, 
       participant_count, purpose, hourly_rate_at_booking, total_price, status
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING');
   COMMIT;
   ```
   If any database error occurs, `ROLLBACK` is triggered immediately in the exception handler.

## 2. Views and Stored Procedures
- `v_pending_bookings`: Simplifies administrative queue lookups by pre-joining `users`, `facilities`, and `sport_types`.
- `v_facility_booking_summary`: Aggregates active reservations, cancellations, and calculated revenue per facility.
- `v_maintenance_backlog`: Surfaces unresolved facility defects and assigned technician contacts.
- `sp_get_facility_booking_summary(p_start, p_end)`: Stored procedure demonstrating parameterized time-window calculations in SQL.

## 3. Query Plan Verification via EXPLAIN
Running `EXPLAIN` on the overlap check query:
- Target key: `idx_bookings_conflict_check` (composite on `facility_id, status, start_at, end_at`).
- Access type: `ref` or `range` (narrowing directly by facility and reservation status).
- Estimated rows examined: reduced from O(N) full table scan down to candidate reservations in the specific time window.
