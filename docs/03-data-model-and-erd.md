# Data Model, ERD, and Normalization

## 1. Conceptual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "requests (member_id)"
    USERS ||--o{ BOOKINGS : "decides (decided_by)"
    USERS ||--o{ MAINTENANCE_REPORTS : "submits"
    USERS ||--o{ WORK_ORDERS : "assigned_to"
    USERS ||--o{ AUDIT_LOGS : "performs"
    
    SPORT_TYPES ||--o{ FACILITIES : "categorizes"
    FACILITIES ||--o{ OPERATING_HOURS : "follows"
    FACILITIES ||--o{ BOOKINGS : "reserved_for"
    FACILITIES ||--o{ EQUIPMENT : "contains"
    FACILITIES ||--o{ MAINTENANCE_REPORTS : "receives"
    
    MAINTENANCE_REPORTS ||--o| WORK_ORDERS : "generates"

    USERS {
        bigint user_id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        enum role
        enum account_status
        varchar phone
        varchar department
        datetime created_at
    }

    SPORT_TYPES {
        bigint sport_type_id PK
        varchar name UK
        varchar description
        varchar icon_name
        datetime created_at
    }

    FACILITIES {
        bigint facility_id PK
        bigint sport_type_id FK
        varchar name
        varchar location
        boolean is_indoor
        int capacity
        decimal hourly_rate
        enum facility_status
        text description
        varchar image_url
        datetime created_at
    }

    OPERATING_HOURS {
        bigint operating_hour_id PK
        bigint facility_id FK
        tinyint day_of_week
        time opens_at
        time closes_at
    }

    BOOKINGS {
        bigint booking_id PK
        bigint member_id FK
        bigint facility_id FK
        datetime start_at
        datetime end_at
        int participant_count
        varchar purpose
        decimal hourly_rate_at_booking
        decimal total_price
        enum status
        bigint decided_by FK
        varchar decision_note
        datetime decided_at
        datetime created_at
    }

    EQUIPMENT {
        bigint equipment_id PK
        bigint facility_id FK
        varchar asset_tag UK
        varchar name
        int quantity
        enum condition_status
        varchar notes
        datetime created_at
    }

    MAINTENANCE_REPORTS {
        bigint report_id PK
        bigint facility_id FK
        bigint submitted_by FK
        varchar title
        text description
        enum severity
        enum status
        datetime created_at
    }

    WORK_ORDERS {
        bigint work_order_id PK
        bigint report_id FK "UK"
        bigint assigned_to FK
        enum status
        text resolution_notes
        datetime assigned_at
        datetime resolved_at
        datetime created_at
    }

    AUDIT_LOGS {
        bigint audit_id PK
        bigint actor_user_id FK
        varchar action
        varchar entity_type
        bigint entity_id
        text details
        varchar ip_address
        datetime created_at
    }
```

## 2. Relational Schema and Normalization (3NF)

### First Normal Form (1NF)
- All attributes contain strictly atomic values.
- Repeating groups or comma-separated lists (e.g., storing multiple equipment items or days of the week in a single column) are eliminated.
- Primary keys are formally defined on all tables.

### Second Normal Form (2NF)
- The schema is in 1NF.
- All non-key attributes depend fully on the primary key, rather than any partial component of a composite key.
- Operating hours naturally identify by `(facility_id, day_of_week)`, which is enforced via a UNIQUE candidate key constraint alongside a surrogate `operating_hour_id` primary key.

### Third Normal Form (3NF)
- The schema is in 2NF.
- There are no transitive dependencies among non-key attributes:
  - `facility_name` and `sport_name` are not duplicated inside `bookings`.
  - User details (`full_name`, `email`) are referenced exclusively via `member_id` foreign keys.
  - Equipment and work order lifecycles exist in their own relations.
- **Deliberate Historical Snapshot Exception:**
  `hourly_rate_at_booking` and `total_price` in `bookings` represent immutable historical financial facts at reservation time, not redundant copies of the current facility price. If the facility rate is adjusted in the future, past booking contracts remain unaffected.

## 3. Deliberate Indexing Plan

| Table | Index Columns | Index Type | Purpose |
|---|---|---|---|
| `users` | `(email)` | UNIQUE | Fast O(log N) login authentication lookup. |
| `sport_types` | `(name)` | UNIQUE | Ensures canonical sport naming. |
| `operating_hours` | `(facility_id, day_of_week)` | UNIQUE | Fast lookups for daily opening bounds; prevents conflicting schedules. |
| `bookings` | `(facility_id, status, start_at, end_at)` | Composite B-Tree | High-speed range filtering for the reservation overlap predicate. |
| `bookings` | `(member_id, created_at)` | Composite B-Tree | Fast retrieval of user's personal booking history in reverse chronological order. |
| `bookings` | `(status, start_at)` | Composite B-Tree | Powers administrative approval queue and time-series aggregation. |
| `equipment` | `(asset_tag)` | UNIQUE | Fast inventory barcode / asset tag lookup. |
| `work_orders` | `(report_id)` | UNIQUE | 1:1 enforcement between reports and work orders. |
| `work_orders` | `(assigned_to, status)` | Composite B-Tree | Staff dashboard filter for assigned open tasks. |

## 4. Timezone Specification
All booking and audit timestamps are stored as `DATETIME` adhering to the campus local timezone: `America/Los_Angeles` (configured in `.env.example`).
Booking intervals are half-open intervals: `[start_at, end_at)`.
This mathematically permits adjacent reservations without collision:
- Slot 1: `[09:00:00, 10:00:00)`
- Slot 2: `[10:00:00, 11:00:00)`
Slot 1 ends at 10:00:00, and Slot 2 starts at 10:00:00; because `10:00:00 < 10:00:00` evaluates to `FALSE`, the overlap condition is not met.
