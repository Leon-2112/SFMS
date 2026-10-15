# Architecture, Security, and Testing

## 1. System Architecture
```mermaid
flowchart TD
    Client["Browser Client (React 19 + TypeScript + Tailwind CSS)"]
    API["Express REST API (Auth, Role Guard, Input Validation, Business Services)"]
    Pool["mysql2 Connection Pool"]
    DB[("MySQL / MariaDB (InnoDB Storage Engine)")]

    Client <-->|HTTPS JSON REST Requests| API
    API <-->|Parameterized SQL & Row-Level Locks| Pool
    Pool <-->|TCP Socket (Port 3306)| DB
```

## 2. Security and Hardening
- **Authentication:** Passwords are never stored in plaintext. They are salted and hashed using `bcrypt` with cost factor 10.
- **Authorization:** Role-Based Access Control (RBAC) enforced on the server for all routes:
  - `MEMBER`: Own booking access, facility browsing, maintenance reporting.
  - `ADMIN`: User management, approvals queue, facility CRUD, equipment inventory, analytical reports.
  - `MAINTENANCE_STAFF`: Assigned work order updates and notes.
- **Ownership Verification:** When a member requests cancellation, the server verifies `booking.member_id === req.user.user_id` rather than trusting client-supplied identifiers.
- **SQL Injection Prevention:** 100% of values originating from HTTP requests are executed via parameterized statements (`?` place-holders) using prepared statements in `mysql2`.
- **Sanitized Errors:** Database internal traces or SQL syntax errors are logged server-side and never leaked in HTTP error responses.

## 3. Testing Matrix
- **Unit Tests (`src/utils/rules.test.ts` via `node:test`):**
  - Overlap predicate precision (`start_at < req_end && end_at > req_start`).
  - Adjacent interval boundary validation (ensure `10:00 - 11:00` does not collide with `11:00 - 12:00`).
  - Capacity validation (`participants <= capacity`).
  - Operating hour boundary checks.
- **API Tests:**
  - Login authentication and bad password rejection.
  - RBAC enforcement (HTTP 403 when MEMBER accesses `/api/admin/*`).
  - Booking conflict detection (HTTP 409 when double-booking is attempted).
  - Facility soft-deactivation protection.
