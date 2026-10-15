-- ============================================================================
-- Sports Facilities Management System (SFMS)
-- Migration 001: Core Relational Schema
-- Target DBMS: MySQL 8.4 LTS / Compatible MySQL 8.x / MariaDB (InnoDB Engine)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS sfms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sfms;

-- Disable foreign key checks during schema re-creation if needed
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS work_orders;
DROP TABLE IF EXISTS maintenance_reports;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS operating_hours;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS sport_types;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores member profiles, staff, and system administrators.
-- Passwords must ALWAYS be hashed using bcrypt/Argon2.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('MEMBER', 'ADMIN', 'MAINTENANCE_STAFF') NOT NULL DEFAULT 'MEMBER',
    account_status ENUM('ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'DEACTIVATED', 'REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    phone VARCHAR(20) NULL,
    department VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. SPORT_TYPES TABLE
-- Controlled vocabulary lookup of sports categories (e.g. Badminton, Swimming).
-- ----------------------------------------------------------------------------
CREATE TABLE sport_types (
    sport_type_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    icon_name VARCHAR(50) NULL DEFAULT 'activity',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sport_types_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. FACILITIES TABLE
-- Represents bookable campus venues (courts, halls, pools, fields).
-- ----------------------------------------------------------------------------
CREATE TABLE facilities (
    facility_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sport_type_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    is_indoor BOOLEAN NOT NULL DEFAULT TRUE,
    capacity INT NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    facility_status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_facilities_capacity CHECK (capacity > 0),
    CONSTRAINT chk_facilities_rate CHECK (hourly_rate >= 0.00),
    CONSTRAINT fk_facilities_sport_type
        FOREIGN KEY (sport_type_id) REFERENCES sport_types(sport_type_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_facilities_sport_type ON facilities(sport_type_id);
CREATE INDEX idx_facilities_status ON facilities(facility_status);

-- ----------------------------------------------------------------------------
-- 4. OPERATING_HOURS TABLE
-- Opening/closing windows per facility and weekday.
-- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
-- ----------------------------------------------------------------------------
CREATE TABLE operating_hours (
    operating_hour_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    facility_id BIGINT NOT NULL,
    day_of_week TINYINT NOT NULL,
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    CONSTRAINT chk_operating_hours_dow CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_operating_hours_times CHECK (opens_at < closes_at),
    CONSTRAINT uq_facility_day_window UNIQUE (facility_id, day_of_week),
    CONSTRAINT fk_operating_hours_facility
        FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_operating_hours_facility ON operating_hours(facility_id);

-- ----------------------------------------------------------------------------
-- 5. BOOKINGS TABLE
-- Member reservation requests. Booking intervals are half-open [start_at, end_at).
-- Only PENDING and APPROVED bookings hold capacity/block collisions.
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    facility_id BIGINT NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    participant_count INT NOT NULL,
    purpose VARCHAR(200) NOT NULL,
    hourly_rate_at_booking DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    decided_by BIGINT NULL,
    decision_note VARCHAR(255) NULL,
    decided_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_bookings_time_order CHECK (start_at < end_at),
    CONSTRAINT chk_bookings_participants CHECK (participant_count > 0),
    CONSTRAINT chk_bookings_price CHECK (total_price >= 0.00),
    CONSTRAINT fk_bookings_member
        FOREIGN KEY (member_id) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_facility
        FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_decided_by
        FOREIGN KEY (decided_by) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crucial composite indexes for query performance & concurrency checks:
CREATE INDEX idx_bookings_conflict_check ON bookings(facility_id, status, start_at, end_at);
CREATE INDEX idx_bookings_member_history ON bookings(member_id, created_at);
CREATE INDEX idx_bookings_status_start ON bookings(status, start_at);
CREATE INDEX idx_bookings_facility_id ON bookings(facility_id);
CREATE INDEX idx_bookings_decided_by ON bookings(decided_by);

-- ----------------------------------------------------------------------------
-- 6. EQUIPMENT TABLE
-- Asset inventory tied to specific sports facilities.
-- ----------------------------------------------------------------------------
CREATE TABLE equipment (
    equipment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    facility_id BIGINT NOT NULL,
    asset_tag VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    condition_status ENUM('EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED', 'NEEDS_REPAIR') NOT NULL DEFAULT 'GOOD',
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_equipment_quantity CHECK (quantity >= 0),
    CONSTRAINT uq_equipment_asset_tag UNIQUE (asset_tag),
    CONSTRAINT fk_equipment_facility
        FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_equipment_facility ON equipment(facility_id);

-- ----------------------------------------------------------------------------
-- 7. MAINTENANCE_REPORTS TABLE
-- Issues reported on facilities by users or staff.
-- ----------------------------------------------------------------------------
CREATE TABLE maintenance_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    facility_id BIGINT NOT NULL,
    submitted_by BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('SUBMITTED', 'IN_REVIEW', 'WORK_ORDER_CREATED', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'SUBMITTED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_facility
        FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reports_submitted_by
        FOREIGN KEY (submitted_by) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_reports_facility_status ON maintenance_reports(facility_id, status, created_at);
CREATE INDEX idx_reports_submitted_by ON maintenance_reports(submitted_by);

-- ----------------------------------------------------------------------------
-- 8. WORK_ORDERS TABLE
-- Actionable repairs derived from maintenance reports, assigned to staff.
-- ----------------------------------------------------------------------------
CREATE TABLE work_orders (
    work_order_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    assigned_to BIGINT NULL,
    status ENUM('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    resolution_notes TEXT NULL,
    assigned_at DATETIME NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_work_orders_report UNIQUE (report_id),
    CONSTRAINT fk_work_orders_report
        FOREIGN KEY (report_id) REFERENCES maintenance_reports(report_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_work_orders_assigned_to
        FOREIGN KEY (assigned_to) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_work_orders_assigned ON work_orders(assigned_to, status);

-- ----------------------------------------------------------------------------
-- 9. AUDIT_LOGS TABLE
-- Records significant operational events (booking decisions, role updates).
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_actor
        FOREIGN KEY (actor_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
