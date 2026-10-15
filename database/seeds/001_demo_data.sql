-- ============================================================================
-- Sports Facilities Management System (SFMS)
-- Seed Data: 001_demo_data.sql
-- Password for all seed users is: password123
-- Hash: $2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG
-- ============================================================================

USE sfms;

-- Clean existing data in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE work_orders;
TRUNCATE TABLE maintenance_reports;
TRUNCATE TABLE equipment;
TRUNCATE TABLE bookings;
TRUNCATE TABLE operating_hours;
TRUNCATE TABLE facilities;
TRUNCATE TABLE sport_types;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. SEED USERS
-- ----------------------------------------------------------------------------
INSERT INTO users (user_id, full_name, email, password_hash, role, account_status, phone, department, created_at)
VALUES
(1, 'Dr. Marcus Vance', 'admin@campus.edu', '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG', 'ADMIN', 'ACTIVE', '+1-555-0101', 'Athletics & Facilities Directorate', '2026-01-01 08:00:00'),
(2, 'Elena Rostova', 'staff@campus.edu', '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG', 'MAINTENANCE_STAFF', 'ACTIVE', '+1-555-0102', 'Campus Physical Plant', '2026-01-02 08:00:00'),
(3, 'James Miller', 'staff2@campus.edu', '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG', 'MAINTENANCE_STAFF', 'ACTIVE', '+1-555-0103', 'Campus Physical Plant', '2026-01-02 08:00:00'),
(4, 'Sarah Chen', 'member@campus.edu', '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG', 'MEMBER', 'ACTIVE', '+1-555-0104', 'Computer Science Dept', '2026-01-10 09:30:00'),
(5, 'Alex Rivera', 'alex.student@campus.edu', '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG', 'MEMBER', 'ACTIVE', '+1-555-0105', 'Electrical Engineering Dept', '2026-01-12 11:15:00'),
(6, 'Priya Patel', 'priya.patel@campus.edu', '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG', 'MEMBER', 'ACTIVE', '+1-555-0106', 'Bioengineering Dept', '2026-01-15 14:00:00');

-- ----------------------------------------------------------------------------
-- 2. SEED SPORT TYPES
-- ----------------------------------------------------------------------------
INSERT INTO sport_types (sport_type_id, name, description, icon_name)
VALUES
(1, 'Badminton', 'Indoor racket sport played with shuttlecocks on hardwood/synthetic courts.', 'activity'),
(2, 'Basketball', 'Regulation hardwood court equipped with shock-absorbing backboards.', 'dribble'),
(3, 'Tennis', 'Championship hard outdoor and indoor synthetic tennis courts.', 'circle-dot'),
(4, 'Swimming', 'Standard 50m Olympic competition pool with automated lane lines.', 'waves'),
(5, 'Volleyball', 'Indoor spring floor court and outdoor sand beach volleyball courts.', 'target'),
(6, 'Squash', 'Enclosed glass-back squash courts with tournament-grade maple floors.', 'box');

-- ----------------------------------------------------------------------------
-- 3. SEED FACILITIES
-- ----------------------------------------------------------------------------
INSERT INTO facilities (facility_id, sport_type_id, name, location, is_indoor, capacity, hourly_rate, facility_status, description, image_url)
VALUES
(1, 4, 'Olympic Aquatics Center', 'Sports Complex - Building C, Lower Level', TRUE, 50, 500.00, 'ACTIVE', 'Heated 10-lane 50m pool with electronic timing and spectator gallery.', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1200&q=80'),
(2, 2, 'Varsity Court 1 - Main Arena', 'Fieldhouse North Wing, Floor 1', TRUE, 30, 600.00, 'ACTIVE', 'FIBA regulation hardwood basketball arena with electronic shot clocks.', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80'),
(3, 2, 'Varsity Court 2 - West Annex', 'Fieldhouse North Wing, Annex B', TRUE, 25, 450.00, 'ACTIVE', 'Multi-purpose practice basketball court with adjustable rim heights.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'),
(4, 1, 'Badminton Hall Court A', 'Racquet Sports Center, Hall 1', TRUE, 8, 300.00, 'ACTIVE', 'Tournament-spec Yonex synthetic mat court with anti-glare LED lighting.', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80'),
(5, 1, 'Badminton Hall Court B', 'Racquet Sports Center, Hall 1', TRUE, 8, 300.00, 'ACTIVE', 'Adjacent tournament badminton court with electronic scoring panel.', 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=1200&q=80'),
(6, 3, 'Outdoor Tennis Court 1', 'East Campus Athletic Grounds', FALSE, 4, 350.00, 'ACTIVE', 'Hard court with floodlight system for evening training sessions.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80'),
(7, 3, 'Outdoor Tennis Court 2', 'East Campus Athletic Grounds', FALSE, 4, 350.00, 'ACTIVE', 'Standard Plexipave acrylic hard court alongside Court 1.', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80'),
(8, 5, 'South Beach Volleyball Court', 'Student Recreation Lawn South', FALSE, 12, 250.00, 'ACTIVE', 'White sand outdoor regulation court with safety netting.', 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80'),
(9, 6, 'Squash Court Alpha', 'Racquet Sports Center, Lower Concourse', TRUE, 4, 400.00, 'MAINTENANCE', 'High-speed glass-back squash court currently undergoing floor sanding.', 'https://images.unsplash.com/photo-1558365849-6ebd8b0454b2?auto=format&fit=crop&w=1200&q=80');

-- ----------------------------------------------------------------------------
-- 4. SEED OPERATING HOURS (7 days a week for all facilities: 06:00 - 22:00)
-- ----------------------------------------------------------------------------
INSERT INTO operating_hours (facility_id, day_of_week, opens_at, closes_at)
SELECT 
    f.facility_id,
    d.day_num,
    '06:00:00',
    '22:00:00'
FROM facilities f
CROSS JOIN (
    SELECT 0 AS day_num UNION ALL
    SELECT 1 UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4 UNION ALL
    SELECT 5 UNION ALL
    SELECT 6
) d;

-- ----------------------------------------------------------------------------
-- 5. SEED EQUIPMENT INVENTORY
-- ----------------------------------------------------------------------------
INSERT INTO equipment (equipment_id, facility_id, asset_tag, name, quantity, condition_status, notes)
VALUES
(1, 1, 'EQ-SWIM-001', 'Speedo Competition Kickboards', 25, 'EXCELLENT', 'Numbered 1-25 in locker room C'),
(2, 1, 'EQ-SWIM-002', 'Rescue Torpedo Float', 4, 'EXCELLENT', 'Lifeguard tower emergency gear'),
(3, 2, 'EQ-BB-101', 'Spalding TF-1000 Basketballs', 16, 'GOOD', 'Varsity game balls'),
(4, 2, 'EQ-BB-102', 'Adjustable Team Benches', 4, 'GOOD', 'Home and visitor side seating'),
(5, 4, 'EQ-BDM-201', 'Yonex Aerobite Shuttlecock Tubes', 30, 'EXCELLENT', 'Tournament grade feather shuttlecocks'),
(6, 4, 'EQ-BDM-202', 'Yonex Carbonex Rackets', 12, 'GOOD', 'Available for equipment rental'),
(7, 6, 'EQ-TNS-301', 'Wilson US Open Tennis Ball Cases', 18, 'EXCELLENT', 'Stored in equipment shed'),
(8, 6, 'EQ-TNS-302', 'Court Squeegee Roller', 2, 'FAIR', 'Rubber blade has minor wear'),
(9, 8, 'EQ-VB-401', 'Mikasa V200W Olympic Volleyballs', 8, 'GOOD', 'All-weather synthetic cover'),
(10, 9, 'EQ-SQ-501', 'Dunlop Pro Double Yellow Dot Balls', 14, 'GOOD', 'Standard competition squash balls');

-- ----------------------------------------------------------------------------
-- 6. SEED BOOKINGS
-- Time intervals are half-open [start_at, end_at).
-- Notice adjacent interval demonstration:
-- Booking 1: 09:00:00 to 10:00:00
-- Booking 2: 10:00:00 to 11:30:00
-- ----------------------------------------------------------------------------
INSERT INTO bookings (
    booking_id, member_id, facility_id, start_at, end_at, 
    participant_count, purpose, hourly_rate_at_booking, total_price, 
    status, decided_by, decision_note, decided_at, created_at
)
VALUES
-- Facility 2: Court 1
(1, 4, 2, '2026-10-16 09:00:00', '2026-10-16 10:00:00', 10, 'Intramural Basketball Practice', 20.00, 20.00, 'APPROVED', 1, 'Approved for university intramurals.', '2026-10-14 10:00:00', '2026-10-13 14:00:00'),
(2, 5, 2, '2026-10-16 10:00:00', '2026-10-16 11:30:00', 12, 'Engineering Society Pick-up Game', 20.00, 30.00, 'APPROVED', 1, 'Approved, adjacent to intramural slot.', '2026-10-14 11:00:00', '2026-10-14 08:30:00'),
(3, 6, 2, '2026-10-16 14:00:00', '2026-10-16 16:00:00', 8, 'Women Basketball Club Training', 20.00, 40.00, 'PENDING', NULL, NULL, NULL, '2026-10-15 09:00:00'),

-- Facility 4: Badminton Court A
(4, 4, 4, '2026-10-16 18:00:00', '2026-10-16 19:30:00', 4, 'Evening Doubles Match', 10.00, 15.00, 'APPROVED', 1, 'Confirmed court A booking.', '2026-10-14 12:00:00', '2026-10-14 09:00:00'),
(5, 5, 4, '2026-10-17 10:00:00', '2026-10-17 11:00:00', 2, 'Singles Ladder Tournament Match', 10.00, 10.00, 'PENDING', NULL, NULL, NULL, '2026-10-15 08:00:00'),

-- Facility 1: Olympic Pool
(6, 6, 1, '2026-10-17 07:00:00', '2026-10-17 08:30:00', 15, 'Swim Club Masters Conditioning', 25.00, 37.50, 'APPROVED', 1, 'Lifeguards on duty confirmed.', '2026-10-14 15:00:00', '2026-10-13 11:00:00'),
(7, 4, 1, '2026-10-18 16:00:00', '2026-10-18 17:30:00', 6, 'Water Polo Skills Clinic', 25.00, 37.50, 'PENDING', NULL, NULL, NULL, '2026-10-15 09:30:00'),

-- Facility 6: Tennis Court 1
(8, 5, 6, '2026-10-18 09:00:00', '2026-10-18 10:30:00', 2, 'Grad Student Tennis Friendly', 12.00, 18.00, 'APPROVED', 1, 'Authorized court reservation.', '2026-10-14 16:00:00', '2026-10-13 16:45:00'),

-- Completed historical bookings for reporting volume
(9, 4, 2, '2026-09-10 14:00:00', '2026-09-10 16:00:00', 12, 'September Opening Tournament', 20.00, 40.00, 'COMPLETED', 1, 'Completed event', '2026-09-08 10:00:00', '2026-09-07 10:00:00'),
(10, 5, 1, '2026-09-15 08:00:00', '2026-09-15 10:00:00', 20, 'Fall Swim Time Trials', 25.00, 50.00, 'COMPLETED', 1, 'Completed event', '2026-09-12 11:00:00', '2026-09-11 09:00:00'),
(11, 6, 4, '2026-09-22 17:00:00', '2026-09-22 19:00:00', 4, 'Badminton Intra-Dept Scrimmage', 10.00, 20.00, 'COMPLETED', 1, 'Completed event', '2026-09-20 10:00:00', '2026-09-19 14:00:00'),

-- Rejected and cancelled bookings (Do NOT block time slots)
(12, 6, 6, '2026-10-16 11:00:00', '2026-10-16 13:00:00', 4, 'Requested Tennis Clinic', 12.00, 24.00, 'REJECTED', 1, 'Facility allocated to collegiate athletics team.', '2026-10-14 17:00:00', '2026-10-14 14:00:00'),
(13, 5, 4, '2026-10-16 14:00:00', '2026-10-16 15:00:00', 2, 'Personal Practice', 10.00, 10.00, 'CANCELLED', NULL, 'Cancelled by user due to schedule conflict.', '2026-10-15 07:00:00', '2026-10-14 18:00:00');

-- ----------------------------------------------------------------------------
-- 7. SEED MAINTENANCE REPORTS & WORK ORDERS
-- ----------------------------------------------------------------------------
INSERT INTO maintenance_reports (
    report_id, facility_id, submitted_by, title, description, 
    severity, status, created_at
)
VALUES
(1, 1, 4, 'Chlorine filtration system pressure drop', 'The digital monitor near Pump Room 2 indicates filter pressure at 12 PSI below the safety threshold. Water clarity is acceptable but needs inspection.', 'HIGH', 'WORK_ORDER_CREATED', '2026-10-14 08:30:00'),
(2, 9, 2, 'Back wall safety glass micro-fracture', 'Visual hairline fracture detected on the lower left tempered glass panel. Court has been marked MAINTENANCE until panel replacement.', 'CRITICAL', 'WORK_ORDER_CREATED', '2026-10-13 10:00:00'),
(3, 7, 5, 'Tennis net tension wire slipping', 'The turnbuckle mechanism on the center net crank slips when tensioning to regulation 36-inch height.', 'MEDIUM', 'SUBMITTED', '2026-10-15 08:15:00'),
(4, 2, 4, 'Scoreboard digital digit segments flickering', 'Segments 3 and 7 on the home score panel flicker intermittently when buzzer sounds.', 'LOW', 'RESOLVED', '2026-10-10 11:00:00');

INSERT INTO work_orders (
    work_order_id, report_id, assigned_to, status, resolution_notes, assigned_at, resolved_at, created_at
)
VALUES
(1, 1, 2, 'IN_PROGRESS', 'Backwashed main sand filters. Replacing secondary pressure transducer valve today.', '2026-10-14 09:00:00', NULL, '2026-10-14 08:45:00'),
(2, 2, 3, 'ASSIGNED', 'Manufacturer glass panel shipment ordered. ETA Oct 18.', '2026-10-13 11:00:00', NULL, '2026-10-13 10:30:00'),
(3, 4, 2, 'RESOLVED', 'Disassembled scoreboard display panel and re-seated ribbon harness cable. Tested buzzer cycle 10 times without dropouts.', '2026-10-10 13:00:00', '2026-10-11 15:30:00', '2026-10-10 11:30:00');

-- ----------------------------------------------------------------------------
-- 8. SEED AUDIT LOGS
-- ----------------------------------------------------------------------------
INSERT INTO audit_logs (audit_id, actor_user_id, action, entity_type, entity_id, details, ip_address, created_at)
VALUES
(1, 1, 'SYSTEM_INIT', 'DATABASE', 1, 'Database schema initialized with 3NF tables and indexes.', '127.0.0.1', '2026-01-01 00:00:00'),
(2, 1, 'FACILITY_STATUS_CHANGE', 'FACILITY', 9, 'Changed status of Squash Court Alpha from ACTIVE to MAINTENANCE due to safety glass defect.', '127.0.0.1', '2026-10-13 10:15:00'),
(3, 1, 'BOOKING_APPROVAL', 'BOOKING', 1, 'Approved booking #1 for Sarah Chen on Varsity Court 1.', '127.0.0.1', '2026-10-14 10:00:00'),
(4, 1, 'WORK_ORDER_ASSIGN', 'WORK_ORDER', 1, 'Assigned chlorine filtration repair to Elena Rostova.', '127.0.0.1', '2026-10-14 09:00:00');
