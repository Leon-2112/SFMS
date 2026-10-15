# Requirements and Use Cases

## 1. Actors and Roles
- **MEMBER (Students/Faculty):** Authenticate, browse and filter active facilities by sport/type/capacity, check availability calendar, submit reservation requests, view own booking history, cancel eligible reservations, and submit facility maintenance issue reports.
- **ADMIN (Athletic Director / Campus Facilities Admin):** Comprehensive administrative control: manage facilities and operating schedules, review pending booking queue (approve/reject with audit notes), manage equipment inventory, assign maintenance reports to work orders, and analyze management reports (utilization, revenue estimates, busiest venues, backlog).
- **MAINTENANCE_STAFF (Physical Plant Technicians):** View assigned maintenance work orders, examine reported fault details, update resolution status (`ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`), and record technical resolution notes.

## 2. Functional Requirements
### F1: Venue Discovery & Availability
- Filterable catalog by sport category, indoor/outdoor flag, capacity, and active/maintenance status.
- Availability calendar based on half-open intervals `[start_at, end_at)` against active reservations (`PENDING` and `APPROVED`).

### F2: Concurrency-Safe Booking Requests
- Members submit `facility_id`, `start_at`, `end_at`, `participant_count`, and `purpose`.
- Server validates that `start_at < end_at`, slot falls within facility operating hours, participant count does not exceed venue capacity, and time is in the future.
- Database transaction locks the facility row (`SELECT facility_id FROM facilities WHERE facility_id = ? FOR UPDATE`) and checks the overlap predicate:
  `existing.start_at < requested.end_at AND existing.end_at > requested.start_at`
  If a conflict exists, transaction rolls back and returns HTTP 409 Conflict.

### F3: Booking Governance
- Administrators approve or reject reservations with decision notes.
- Members can cancel their own bookings. Cancelled and rejected bookings immediately free up the time slot.

### F4: Maintenance & Work Order Lifecycle
- Users report facility hazards or equipment defects with severity ratings (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- Administrators convert reports into work orders assigned to maintenance technicians.
- Technicians log repair progress and close work orders.

### F5: Reporting & DBMS Analytical Queries
- View pending approvals queue (`v_pending_bookings`).
- Facility utilization rate calculation (booked minutes / available weekly operating minutes).
- Monthly booking volume and revenue estimation.
- Maintenance backlog grouped by severity and resolution status.
