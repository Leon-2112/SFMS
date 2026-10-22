/**
 * In-Memory Mock Database for AI Studio runtime environment.
 * Seeded with original 001_demo_data.sql records.
 * Provides complete data persistence across API operations in memory.
 */

export interface MemoryUser {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'MAINTENANCE_STAFF' | 'MEMBER';
  account_status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'SUSPENDED';
  phone: string | null;
  department: string | null;
  created_at: string;
}

export interface MemorySportType {
  sport_type_id: number;
  name: string;
  description: string;
  icon_name: string;
}

export interface MemoryFacility {
  facility_id: number;
  sport_type_id: number;
  name: string;
  location: string;
  is_indoor: number;
  capacity: number;
  hourly_rate: number;
  facility_status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface MemoryOperatingHour {
  operating_hour_id: number;
  facility_id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
}

export interface MemoryEquipment {
  equipment_id: number;
  facility_id: number;
  asset_tag: string;
  name: string;
  quantity: number;
  condition_status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'NEEDS_REPAIR';
  notes: string | null;
  created_at: string;
}

export interface MemoryBooking {
  booking_id: number;
  member_id: number;
  facility_id: number;
  start_at: string;
  end_at: string;
  participant_count: number;
  purpose: string;
  hourly_rate_at_booking: number;
  total_price: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  decided_by: number | null;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface MemoryMaintenanceReport {
  report_id: number;
  facility_id: number;
  submitted_by: number;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUBMITTED' | 'IN_REVIEW' | 'WORK_ORDER_CREATED' | 'RESOLVED' | 'CLOSED';
  created_at: string;
}

export interface MemoryWorkOrder {
  work_order_id: number;
  report_id: number;
  assigned_to: number | null;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution_notes: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface MemoryAuditLog {
  audit_id: number;
  actor_user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string;
  created_at: string;
}

// Initial seed password hash: $2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG (password123)
const SEED_USERS: MemoryUser[] = [
  {
    user_id: 1,
    full_name: 'Dr. Marcus Vance',
    email: 'admin@campus.edu',
    password_hash: '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG',
    role: 'ADMIN',
    account_status: 'ACTIVE',
    phone: '+1-555-0101',
    department: 'Athletics & Facilities Directorate',
    created_at: '2026-01-01 08:00:00',
  },
  {
    user_id: 2,
    full_name: 'Elena Rostova',
    email: 'staff@campus.edu',
    password_hash: '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG',
    role: 'MAINTENANCE_STAFF',
    account_status: 'ACTIVE',
    phone: '+1-555-0102',
    department: 'Campus Physical Plant',
    created_at: '2026-01-02 08:00:00',
  },
  {
    user_id: 3,
    full_name: 'James Miller',
    email: 'staff2@campus.edu',
    password_hash: '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG',
    role: 'MAINTENANCE_STAFF',
    account_status: 'ACTIVE',
    phone: '+1-555-0103',
    department: 'Campus Physical Plant',
    created_at: '2026-01-02 08:00:00',
  },
  {
    user_id: 4,
    full_name: 'Sarah Chen',
    email: 'member@campus.edu',
    password_hash: '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG',
    role: 'MEMBER',
    account_status: 'ACTIVE',
    phone: '+1-555-0104',
    department: 'Computer Science Dept',
    created_at: '2026-01-10 09:30:00',
  },
  {
    user_id: 5,
    full_name: 'Alex Rivera',
    email: 'alex.student@campus.edu',
    password_hash: '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG',
    role: 'MEMBER',
    account_status: 'ACTIVE',
    phone: '+1-555-0105',
    department: 'Electrical Engineering Dept',
    created_at: '2026-01-12 11:15:00',
  },
  {
    user_id: 6,
    full_name: 'Priya Patel',
    email: 'priya.patel@campus.edu',
    password_hash: '$2b$10$j8n0UndyQetfiqwOm9VELunKibJJw9KcMBbeIQeUA18hPRTz9pwbG',
    role: 'MEMBER',
    account_status: 'ACTIVE',
    phone: '+1-555-0106',
    department: 'Bioengineering Dept',
    created_at: '2026-01-15 14:00:00',
  },
];

const SEED_SPORT_TYPES: MemorySportType[] = [
  { sport_type_id: 1, name: 'Badminton', description: 'Indoor racket sport played with shuttlecocks on hardwood/synthetic courts.', icon_name: 'activity' },
  { sport_type_id: 2, name: 'Basketball', description: 'Regulation hardwood court equipped with shock-absorbing backboards.', icon_name: 'dribble' },
  { sport_type_id: 3, name: 'Tennis', description: 'Championship hard outdoor and indoor synthetic tennis courts.', icon_name: 'circle-dot' },
  { sport_type_id: 4, name: 'Swimming', description: 'Standard 50m Olympic competition pool with automated lane lines.', icon_name: 'waves' },
  { sport_type_id: 5, name: 'Volleyball', description: 'Indoor spring floor court and outdoor sand beach volleyball courts.', icon_name: 'target' },
  { sport_type_id: 6, name: 'Squash', description: 'Enclosed glass-back squash courts with tournament-grade maple floors.', icon_name: 'box' },
];

const SEED_FACILITIES: MemoryFacility[] = [
  {
    facility_id: 1,
    sport_type_id: 4,
    name: 'Olympic Aquatics Center',
    location: 'Sports Complex - Building C, Lower Level',
    is_indoor: 1,
    capacity: 50,
    hourly_rate: 2500.0,
    facility_status: 'ACTIVE',
    description: 'Heated 10-lane 50m pool with electronic timing and spectator gallery.',
    image_url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 2,
    sport_type_id: 2,
    name: 'Varsity Court 1 - Main Arena',
    location: 'Fieldhouse North Wing, Floor 1',
    is_indoor: 1,
    capacity: 30,
    hourly_rate: 3000.0,
    facility_status: 'ACTIVE',
    description: 'FIBA regulation hardwood basketball arena with electronic shot clocks.',
    image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 3,
    sport_type_id: 2,
    name: 'Varsity Court 2 - West Annex',
    location: 'Fieldhouse North Wing, Annex B',
    is_indoor: 1,
    capacity: 25,
    hourly_rate: 2250.0,
    facility_status: 'ACTIVE',
    description: 'Multi-purpose practice basketball court with adjustable rim heights.',
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 4,
    sport_type_id: 1,
    name: 'Badminton Hall Court A',
    location: 'Racquet Sports Center, Hall 1',
    is_indoor: 1,
    capacity: 8,
    hourly_rate: 1500.0,
    facility_status: 'ACTIVE',
    description: 'Tournament-spec Yonex synthetic mat court with anti-glare LED lighting.',
    image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 5,
    sport_type_id: 1,
    name: 'Badminton Hall Court B',
    location: 'Racquet Sports Center, Hall 1',
    is_indoor: 1,
    capacity: 8,
    hourly_rate: 1500.0,
    facility_status: 'ACTIVE',
    description: 'Adjacent tournament badminton court with electronic scoring panel.',
    image_url: '/src/assets/images/badminton_court_b.webp',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 6,
    sport_type_id: 3,
    name: 'Outdoor Tennis Court 1',
    location: 'East Campus Athletic Grounds',
    is_indoor: 0,
    capacity: 4,
    hourly_rate: 1750.0,
    facility_status: 'ACTIVE',
    description: 'Hard court with floodlight system for evening training sessions.',
    image_url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 7,
    sport_type_id: 3,
    name: 'Outdoor Tennis Court 2',
    location: 'East Campus Athletic Grounds',
    is_indoor: 0,
    capacity: 4,
    hourly_rate: 1750.0,
    facility_status: 'ACTIVE',
    description: 'Standard Plexipave acrylic hard court alongside Court 1.',
    image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 8,
    sport_type_id: 5,
    name: 'South Beach Volleyball Court',
    location: 'Student Recreation Lawn South',
    is_indoor: 0,
    capacity: 12,
    hourly_rate: 1250.0,
    facility_status: 'ACTIVE',
    description: 'White sand outdoor regulation court with safety netting.',
    image_url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
  {
    facility_id: 9,
    sport_type_id: 6,
    name: 'Squash Court Alpha',
    location: 'Racquet Sports Center, Lower Concourse',
    is_indoor: 1,
    capacity: 4,
    hourly_rate: 2000.0,
    facility_status: 'MAINTENANCE',
    description: 'High-speed glass-back squash court currently undergoing floor sanding.',
    image_url: 'https://images.unsplash.com/photo-1558365849-6ebd8b0454b2?auto=format&fit=crop&w=1200&q=80',
    created_at: '2026-01-01 08:00:00',
  },
];

// Seed operating hours for facilities 1..9, days 0..6
const SEED_OPERATING_HOURS: MemoryOperatingHour[] = [];
let hourId = 1;
for (let fid = 1; fid <= 9; fid++) {
  for (let d = 0; d <= 6; d++) {
    SEED_OPERATING_HOURS.push({
      operating_hour_id: hourId++,
      facility_id: fid,
      day_of_week: d,
      opens_at: '06:00:00',
      closes_at: '22:00:00',
    });
  }
}

const SEED_EQUIPMENT: MemoryEquipment[] = [
  { equipment_id: 1, facility_id: 1, asset_tag: 'EQ-SWIM-001', name: 'Speedo Competition Kickboards', quantity: 25, condition_status: 'EXCELLENT', notes: 'Numbered 1-25 in locker room C', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 2, facility_id: 1, asset_tag: 'EQ-SWIM-002', name: 'Rescue Torpedo Float', quantity: 4, condition_status: 'EXCELLENT', notes: 'Lifeguard tower emergency gear', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 3, facility_id: 2, asset_tag: 'EQ-BB-101', name: 'Spalding TF-1000 Basketballs', quantity: 16, condition_status: 'GOOD', notes: 'Varsity game balls', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 4, facility_id: 2, asset_tag: 'EQ-BB-102', name: 'Adjustable Team Benches', quantity: 4, condition_status: 'GOOD', notes: 'Home and visitor side seating', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 5, facility_id: 4, asset_tag: 'EQ-BDM-201', name: 'Yonex Aerobite Shuttlecock Tubes', quantity: 30, condition_status: 'EXCELLENT', notes: 'Tournament grade feather shuttlecocks', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 6, facility_id: 4, asset_tag: 'EQ-BDM-202', name: 'Yonex Carbonex Rackets', quantity: 12, condition_status: 'GOOD', notes: 'Available for equipment rental', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 7, facility_id: 6, asset_tag: 'EQ-TNS-301', name: 'Wilson US Open Tennis Ball Cases', quantity: 18, condition_status: 'EXCELLENT', notes: 'Stored in equipment shed', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 8, facility_id: 6, asset_tag: 'EQ-TNS-302', name: 'Court Squeegee Roller', quantity: 2, condition_status: 'FAIR', notes: 'Rubber blade has minor wear', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 9, facility_id: 8, asset_tag: 'EQ-VB-401', name: 'Mikasa V200W Olympic Volleyballs', quantity: 8, condition_status: 'GOOD', notes: 'All-weather synthetic cover', created_at: '2026-01-01 08:00:00' },
  { equipment_id: 10, facility_id: 9, asset_tag: 'EQ-SQ-501', name: 'Dunlop Pro Double Yellow Dot Balls', quantity: 14, condition_status: 'GOOD', notes: 'Standard competition squash balls', created_at: '2026-01-01 08:00:00' },
];

const SEED_BOOKINGS: MemoryBooking[] = [
  { booking_id: 1, member_id: 4, facility_id: 2, start_at: '2026-10-16 09:00:00', end_at: '2026-10-16 10:00:00', participant_count: 10, purpose: 'Intramural Basketball Practice', hourly_rate_at_booking: 3000.0, total_price: 3000.0, status: 'APPROVED', decided_by: 1, decision_note: 'Approved for university intramurals.', decided_at: '2026-10-14 10:00:00', created_at: '2026-10-13 14:00:00' },
  { booking_id: 2, member_id: 5, facility_id: 2, start_at: '2026-10-16 10:00:00', end_at: '2026-10-16 11:30:00', participant_count: 12, purpose: 'Engineering Society Pick-up Game', hourly_rate_at_booking: 3000.0, total_price: 4500.0, status: 'APPROVED', decided_by: 1, decision_note: 'Approved, adjacent to intramural slot.', decided_at: '2026-10-14 11:00:00', created_at: '2026-10-14 08:30:00' },
  { booking_id: 3, member_id: 6, facility_id: 2, start_at: '2026-10-16 14:00:00', end_at: '2026-10-16 16:00:00', participant_count: 8, purpose: 'Women Basketball Club Training', hourly_rate_at_booking: 3000.0, total_price: 6000.0, status: 'PENDING', decided_by: null, decision_note: null, decided_at: null, created_at: '2026-10-15 09:00:00' },
  { booking_id: 4, member_id: 4, facility_id: 4, start_at: '2026-10-16 18:00:00', end_at: '2026-10-16 19:30:00', participant_count: 4, purpose: 'Evening Doubles Match', hourly_rate_at_booking: 1500.0, total_price: 2250.0, status: 'APPROVED', decided_by: 1, decision_note: 'Confirmed court A booking.', decided_at: '2026-10-14 12:00:00', created_at: '2026-10-14 09:00:00' },
  { booking_id: 5, member_id: 5, facility_id: 4, start_at: '2026-10-17 10:00:00', end_at: '2026-10-17 11:00:00', participant_count: 2, purpose: 'Singles Ladder Tournament Match', hourly_rate_at_booking: 1500.0, total_price: 1500.0, status: 'PENDING', decided_by: null, decision_note: null, decided_at: null, created_at: '2026-10-15 08:00:00' },
  { booking_id: 6, member_id: 6, facility_id: 1, start_at: '2026-10-17 07:00:00', end_at: '2026-10-17 08:30:00', participant_count: 15, purpose: 'Swim Club Masters Conditioning', hourly_rate_at_booking: 2500.0, total_price: 3750.0, status: 'APPROVED', decided_by: 1, decision_note: 'Lifeguards on duty confirmed.', decided_at: '2026-10-14 15:00:00', created_at: '2026-10-13 11:00:00' },
  { booking_id: 7, member_id: 4, facility_id: 1, start_at: '2026-10-18 16:00:00', end_at: '2026-10-18 17:30:00', participant_count: 6, purpose: 'Water Polo Skills Clinic', hourly_rate_at_booking: 2500.0, total_price: 3750.0, status: 'PENDING', decided_by: null, decision_note: null, decided_at: null, created_at: '2026-10-15 09:30:00' },
  { booking_id: 8, member_id: 5, facility_id: 6, start_at: '2026-10-18 09:00:00', end_at: '2026-10-18 10:30:00', participant_count: 2, purpose: 'Grad Student Tennis Friendly', hourly_rate_at_booking: 1750.0, total_price: 2625.0, status: 'APPROVED', decided_by: 1, decision_note: 'Authorized court reservation.', decided_at: '2026-10-14 16:00:00', created_at: '2026-10-13 16:45:00' },
  { booking_id: 9, member_id: 4, facility_id: 2, start_at: '2026-09-10 14:00:00', end_at: '2026-09-10 16:00:00', participant_count: 12, purpose: 'September Opening Tournament', hourly_rate_at_booking: 3000.0, total_price: 6000.0, status: 'COMPLETED', decided_by: 1, decision_note: 'Completed event', decided_at: '2026-09-08 10:00:00', created_at: '2026-09-07 10:00:00' },
  { booking_id: 10, member_id: 5, facility_id: 1, start_at: '2026-09-15 08:00:00', end_at: '2026-09-15 10:00:00', participant_count: 20, purpose: 'Fall Swim Time Trials', hourly_rate_at_booking: 2500.0, total_price: 5000.0, status: 'COMPLETED', decided_by: 1, decision_note: 'Completed event', decided_at: '2026-09-12 11:00:00', created_at: '2026-09-11 09:00:00' },
  { booking_id: 11, member_id: 6, facility_id: 4, start_at: '2026-09-22 17:00:00', end_at: '2026-09-22 19:00:00', participant_count: 4, purpose: 'Badminton Intra-Dept Scrimmage', hourly_rate_at_booking: 1500.0, total_price: 3000.0, status: 'COMPLETED', decided_by: 1, decision_note: 'Completed event', decided_at: '2026-09-20 10:00:00', created_at: '2026-09-19 14:00:00' },
  { booking_id: 12, member_id: 6, facility_id: 6, start_at: '2026-10-16 11:00:00', end_at: '2026-10-16 13:00:00', participant_count: 4, purpose: 'Requested Tennis Clinic', hourly_rate_at_booking: 1750.0, total_price: 3500.0, status: 'REJECTED', decided_by: 1, decision_note: 'Facility allocated to collegiate athletics team.', decided_at: '2026-10-14 17:00:00', created_at: '2026-10-14 14:00:00' },
  { booking_id: 13, member_id: 5, facility_id: 4, start_at: '2026-10-16 14:00:00', end_at: '2026-10-16 15:00:00', participant_count: 2, purpose: 'Personal Practice', hourly_rate_at_booking: 1500.0, total_price: 1500.0, status: 'CANCELLED', decided_by: null, decision_note: 'Cancelled by user due to schedule conflict.', decided_at: '2026-10-15 07:00:00', created_at: '2026-10-14 18:00:00' },
];

const SEED_MAINTENANCE_REPORTS: MemoryMaintenanceReport[] = [
  { report_id: 1, facility_id: 1, submitted_by: 4, title: 'Chlorine filtration system pressure drop', description: 'The digital monitor near Pump Room 2 indicates filter pressure at 12 PSI below the safety threshold. Water clarity is acceptable but needs inspection.', severity: 'HIGH', status: 'WORK_ORDER_CREATED', created_at: '2026-10-14 08:30:00' },
  { report_id: 2, facility_id: 9, submitted_by: 2, title: 'Back wall safety glass micro-fracture', description: 'Visual hairline fracture detected on the lower left tempered glass panel. Court has been marked MAINTENANCE until panel replacement.', severity: 'CRITICAL', status: 'WORK_ORDER_CREATED', created_at: '2026-10-13 10:00:00' },
  { report_id: 3, facility_id: 7, submitted_by: 5, title: 'Tennis net tension wire slipping', description: 'The turnbuckle mechanism on the center net crank slips when tensioning to regulation 36-inch height.', severity: 'MEDIUM', status: 'SUBMITTED', created_at: '2026-10-15 08:15:00' },
  { report_id: 4, facility_id: 2, submitted_by: 4, title: 'Scoreboard digital digit segments flickering', description: 'Segments 3 and 7 on the home score panel flicker intermittently when buzzer sounds.', severity: 'LOW', status: 'RESOLVED', created_at: '2026-10-10 11:00:00' },
];

const SEED_WORK_ORDERS: MemoryWorkOrder[] = [
  { work_order_id: 1, report_id: 1, assigned_to: 2, status: 'IN_PROGRESS', resolution_notes: 'Backwashed main sand filters. Replacing secondary pressure transducer valve today.', assigned_at: '2026-10-14 09:00:00', resolved_at: null, created_at: '2026-10-14 08:45:00' },
  { work_order_id: 2, report_id: 2, assigned_to: 3, status: 'ASSIGNED', resolution_notes: 'Manufacturer glass panel shipment ordered. ETA Oct 18.', assigned_at: '2026-10-13 11:00:00', resolved_at: null, created_at: '2026-10-13 10:30:00' },
  { work_order_id: 3, report_id: 4, assigned_to: 2, status: 'RESOLVED', resolution_notes: 'Disassembled scoreboard display panel and re-seated ribbon harness cable. Tested buzzer cycle 10 times without dropouts.', assigned_at: '2026-10-10 13:00:00', resolved_at: '2026-10-11 15:30:00', created_at: '2026-10-10 11:30:00' },
];

const SEED_AUDIT_LOGS: MemoryAuditLog[] = [
  { audit_id: 1, actor_user_id: 1, action: 'SYSTEM_INIT', entity_type: 'DATABASE', entity_id: 1, details: 'Database schema initialized with 3NF tables and indexes.', ip_address: '127.0.0.1', created_at: '2026-01-01 00:00:00' },
  { audit_id: 2, actor_user_id: 1, action: 'FACILITY_STATUS_CHANGE', entity_type: 'FACILITY', entity_id: 9, details: 'Changed status of Squash Court Alpha from ACTIVE to MAINTENANCE due to safety glass defect.', ip_address: '127.0.0.1', created_at: '2026-10-13 10:15:00' },
  { audit_id: 3, actor_user_id: 1, action: 'BOOKING_APPROVAL', entity_type: 'BOOKING', entity_id: 1, details: 'Approved booking #1 for Sarah Chen on Varsity Court 1.', ip_address: '127.0.0.1', created_at: '2026-10-14 10:00:00' },
  { audit_id: 4, actor_user_id: 1, action: 'WORK_ORDER_ASSIGN', entity_type: 'WORK_ORDER', entity_id: 1, details: 'Assigned chlorine filtration repair to Elena Rostova.', ip_address: '127.0.0.1', created_at: '2026-10-14 09:00:00' },
];

class InMemoryDatabase {
  users = [...SEED_USERS];
  sportTypes = [...SEED_SPORT_TYPES];
  facilities = [...SEED_FACILITIES];
  operatingHours = [...SEED_OPERATING_HOURS];
  equipment = [...SEED_EQUIPMENT];
  bookings = [...SEED_BOOKINGS];
  maintenanceReports = [...SEED_MAINTENANCE_REPORTS];
  workOrders = [...SEED_WORK_ORDERS];
  auditLogs = [...SEED_AUDIT_LOGS];

  private nextUserId = 7;
  private nextFacilityId = 10;
  private nextHourId = 100;
  private nextEquipmentId = 11;
  private nextBookingId = 14;
  private nextReportId = 5;
  private nextWorkOrderId = 4;
  private nextAuditId = 5;

  private nowIso(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date()).replace(', ', ' ');
  }

  // Execute query against in-memory state
  async execute(rawSql: string, params: any[] = []): Promise<any> {
    const sql = rawSql.trim();
    const normalized = sql.replace(/\s+/g, ' ');

    // 1. SELECT 1 AS alive
    if (/^SELECT 1 AS alive/i.test(normalized)) {
      return [{ alive: 1 }];
    }

    // Dashboard summary
    if (/total_facilities/i.test(normalized) && /active_facilities/i.test(normalized)) {
      const total_facilities = this.facilities.length;
      const active_facilities = this.facilities.filter((f) => f.facility_status === 'ACTIVE').length;
      const total_bookings = this.bookings.length;
      const pending_bookings = this.bookings.filter((b) => b.status === 'PENDING').length;
      const approved_bookings = this.bookings.filter((b) => b.status === 'APPROVED').length;
      const total_revenue_estimate = this.bookings
        .filter((b) => b.status === 'APPROVED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.total_price), 0);
      const open_maintenance_issues = this.maintenanceReports.filter((r) => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;
      const active_work_orders = this.workOrders.filter((w) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(w.status)).length;
      const registered_members = this.users.filter((u) => u.role === 'MEMBER').length;
      const pending_user_registrations = this.users.filter((u) => u.account_status === 'PENDING_APPROVAL').length;

      return [{
        total_facilities,
        active_facilities,
        total_bookings,
        pending_bookings,
        approved_bookings,
        total_revenue_estimate,
        open_maintenance_issues,
        active_work_orders,
        registered_members,
        pending_user_registrations,
      }];
    }

    // 2. Active demo users
    if (/SELECT user_id, full_name, email, role, department FROM users WHERE account_status = "ACTIVE"/i.test(normalized) ||
        /FROM users WHERE account_status = 'ACTIVE'/i.test(normalized)) {
      return this.users
        .filter((u) => u.account_status === 'ACTIVE')
        .sort((a, b) => a.role.localeCompare(b.role) || a.user_id - b.user_id)
        .map((u) => ({
          user_id: u.user_id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          department: u.department,
        }));
    }

    // 3. User by email for login/registration check
    if (/FROM users WHERE email = \?/i.test(normalized)) {
      const email = String(params[0]).trim().toLowerCase();
      const user = this.users.find((u) => u.email.toLowerCase() === email);
      return user ? [{ ...user }] : [];
    }

    // 4. User by user_id
    if (/FROM users WHERE user_id = \?/i.test(normalized)) {
      const userId = Number(params[0]);
      const user = this.users.find((u) => u.user_id === userId);
      return user ? [{ ...user }] : [];
    }

    // 5. Pending users list
    if (/^SELECT\s+user_id.+FROM users WHERE account_status = 'PENDING_APPROVAL'/i.test(normalized)) {
      return this.users
        .filter((u) => u.account_status === 'PENDING_APPROVAL')
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((u) => ({ ...u }));
    }

    // 6. Users list with optional status
    if (/SELECT user_id, full_name, email, role, account_status, phone, department, created_at FROM users/i.test(normalized)) {
      let list = [...this.users];
      if (/WHERE account_status = \?/i.test(normalized) && params[0]) {
        list = list.filter((u) => u.account_status === params[0]);
      }
      return list.sort((a, b) => b.user_id - a.user_id).map((u) => ({ ...u }));
    }

    // 7. Insert user
    if (/INSERT INTO users/i.test(normalized)) {
      const [full_name, email, password_hash, role, phone, department] = params;
      const newUser: MemoryUser = {
        user_id: this.nextUserId++,
        full_name,
        email: String(email).trim().toLowerCase(),
        password_hash,
        role,
        account_status: 'PENDING_APPROVAL',
        phone: phone || null,
        department: department || null,
        created_at: this.nowIso(),
      };
      this.users.push(newUser);
      return { insertId: newUser.user_id, affectedRows: 1 };
    }

    // 8. Update user account status
    if (/UPDATE users SET account_status = \? WHERE user_id = \?/i.test(normalized)) {
      const [status, userId] = params;
      const user = this.users.find((u) => u.user_id === Number(userId));
      if (user) {
        user.account_status = status;
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 9. Maintenance staff users
    if (/FROM users WHERE role = 'MAINTENANCE_STAFF'/i.test(normalized)) {
      return this.users
        .filter((u) => u.role === 'MAINTENANCE_STAFF' && u.account_status === 'ACTIVE')
        .sort((a, b) => a.full_name.localeCompare(b.full_name))
        .map((u) => ({ user_id: u.user_id, full_name: u.full_name, email: u.email, department: u.department }));
    }

    // 10. Sport types
    if (/FROM sport_types/i.test(normalized)) {
      return this.sportTypes.sort((a, b) => a.name.localeCompare(b.name));
    }

    // 11. List facilities with sport name
    if (/FROM facilities f\s+JOIN sport_types st ON st\.sport_type_id = f\.sport_type_id/i.test(normalized)) {
      let results = this.facilities.map((f) => {
        const sport = this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id);
        return {
          ...f,
          sport_name: sport ? sport.name : '',
        };
      });

      // Facility by ID
      if (/WHERE f\.facility_id = \?/i.test(normalized)) {
        const fid = Number(params[0]);
        const found = results.find((r) => r.facility_id === fid);
        return found ? [found] : [];
      }

      // Check filters in WHERE
      let paramIdx = 0;
      if (/f\.sport_type_id = \?/i.test(normalized)) {
        const sportId = Number(params[paramIdx++]);
        results = results.filter((r) => r.sport_type_id === sportId);
      }
      if (/LIKE \?/i.test(normalized)) {
        const searchTerm = String(params[paramIdx++] || '').replace(/%/g, '').toLowerCase();
        if (searchTerm) {
          results = results.filter(
            (r) =>
              r.name.toLowerCase().includes(searchTerm) ||
              r.location.toLowerCase().includes(searchTerm) ||
              r.sport_name.toLowerCase().includes(searchTerm)
          );
        }
      }

      return results.sort((a, b) => a.facility_status.localeCompare(b.facility_status) || a.name.localeCompare(b.name));
    }

    // 12. Single facility for update / lock
    if (/FROM facilities WHERE facility_id = \?/i.test(normalized)) {
      const fid = Number(params[0]);
      const fac = this.facilities.find((f) => f.facility_id === fid);
      return fac ? [{ ...fac }] : [];
    }

    // 13. Facility operating hours
    if (/FROM operating_hours WHERE facility_id = \? AND day_of_week = \?/i.test(normalized)) {
      const [facilityId, dayOfWeek] = params;
      const row = this.operatingHours.find(
        (oh) => oh.facility_id === Number(facilityId) && oh.day_of_week === Number(dayOfWeek)
      );
      return row ? [{ opens_at: row.opens_at, closes_at: row.closes_at }] : [];
    }

    if (/FROM operating_hours WHERE facility_id = \?/i.test(normalized)) {
      const facilityId = Number(params[0]);
      return this.operatingHours
        .filter((oh) => oh.facility_id === facilityId)
        .sort((a, b) => a.day_of_week - b.day_of_week);
    }

    // 14. Upsert operating hours
    if (/INSERT INTO operating_hours/i.test(normalized)) {
      const [facility_id, day_of_week, opens_at, closes_at] = params;
      const existing = this.operatingHours.find(
        (oh) => oh.facility_id === Number(facility_id) && oh.day_of_week === Number(day_of_week)
      );
      if (existing) {
        existing.opens_at = opens_at;
        existing.closes_at = closes_at;
      } else {
        this.operatingHours.push({
          operating_hour_id: this.nextHourId++,
          facility_id: Number(facility_id),
          day_of_week: Number(day_of_week),
          opens_at,
          closes_at,
        });
      }
      return { affectedRows: 1 };
    }

    // 15. Create facility
    if (/INSERT INTO facilities/i.test(normalized)) {
      const [sport_type_id, name, location, is_indoor, capacity, hourly_rate, description, image_url] = params;
      const newFacility: MemoryFacility = {
        facility_id: this.nextFacilityId++,
        sport_type_id: Number(sport_type_id),
        name,
        location,
        is_indoor: Number(is_indoor),
        capacity: Number(capacity),
        hourly_rate: Number(hourly_rate),
        facility_status: 'ACTIVE',
        description: description || null,
        image_url: image_url || null,
        created_at: this.nowIso(),
      };
      this.facilities.push(newFacility);
      return { insertId: newFacility.facility_id, affectedRows: 1 };
    }

    // 16. Update facility status
    if (/UPDATE facilities SET facility_status = \? WHERE facility_id = \?/i.test(normalized)) {
      const [status, facilityId] = params;
      const fac = this.facilities.find((f) => f.facility_id === Number(facilityId));
      if (fac) {
        fac.facility_status = status;
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 17. Update facility generic
    if (/UPDATE facilities SET/i.test(normalized)) {
      const facilityId = Number(params[params.length - 1]);
      const fac = this.facilities.find((f) => f.facility_id === facilityId);
      if (fac) {
        // parse fields updated
        const matchSet = normalized.match(/SET (.+?) WHERE/i);
        if (matchSet) {
          const assignments = matchSet[1].split(',').map((s) => s.trim());
          for (let i = 0; i < assignments.length; i++) {
            const field = assignments[i].split('=')[0].trim();
            (fac as any)[field] = params[i];
          }
        }
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 18. Check booking conflicts
    if (/FROM bookings\s+WHERE facility_id = \?\s+AND status IN \('PENDING', 'APPROVED'\)\s+AND start_at < \?\s+AND end_at > \?/i.test(normalized)) {
      const [facilityId, end_at, start_at] = params;
      const conflicts = this.bookings.filter(
        (b) =>
          b.facility_id === Number(facilityId) &&
          (b.status === 'PENDING' || b.status === 'APPROVED') &&
          b.start_at < end_at &&
          b.end_at > start_at
      );
      return conflicts.map((c) => ({
        booking_id: c.booking_id,
        start_at: c.start_at,
        end_at: c.end_at,
        status: c.status,
        purpose: c.purpose,
      }));
    }

    // 19. Insert booking
    if (/INSERT INTO bookings/i.test(normalized)) {
      const [member_id, facility_id, start_at, end_at, participant_count, purpose, hourly_rate_at_booking, total_price] = params;
      const newBooking: MemoryBooking = {
        booking_id: this.nextBookingId++,
        member_id: Number(member_id),
        facility_id: Number(facility_id),
        start_at,
        end_at,
        participant_count: Number(participant_count),
        purpose,
        hourly_rate_at_booking: Number(hourly_rate_at_booking),
        total_price: Number(total_price),
        status: 'PENDING',
        decided_by: null,
        decision_note: null,
        decided_at: null,
        created_at: this.nowIso(),
      };
      this.bookings.push(newBooking);
      return { insertId: newBooking.booking_id, affectedRows: 1 };
    }

    // 20. Insert audit log
    if (/INSERT INTO audit_logs/i.test(normalized)) {
      const [actor_user_id, action, entity_type, entity_id, details] = params;
      const newLog: MemoryAuditLog = {
        audit_id: this.nextAuditId++,
        actor_user_id: Number(actor_user_id),
        action,
        entity_type,
        entity_id: Number(entity_id),
        details,
        ip_address: '127.0.0.1',
        created_at: this.nowIso(),
      };
      this.auditLogs.push(newLog);
      return { insertId: newLog.audit_id, affectedRows: 1 };
    }

    // 21. Single booking by booking_id
    if (/FROM bookings b\s+JOIN facilities f ON f\.facility_id = b\.facility_id\s+JOIN sport_types st ON st\.sport_type_id = f\.sport_type_id\s+WHERE b\.booking_id = \?/i.test(normalized)) {
      const bid = Number(params[0]);
      const b = this.bookings.find((item) => item.booking_id === bid);
      if (!b) return [];
      const f = this.facilities.find((fac) => fac.facility_id === b.facility_id);
      const st = f ? this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id) : null;
      return [{
        ...b,
        facility_name: f ? f.name : '',
        sport_name: st ? st.name : '',
      }];
    }

    // 22. Member bookings
    if (/FROM bookings b\s+JOIN facilities f ON f\.facility_id = b\.facility_id\s+JOIN sport_types st ON st\.sport_type_id = f\.sport_type_id\s+WHERE b\.member_id = \?/i.test(normalized)) {
      const mid = Number(params[0]);
      return this.bookings
        .filter((b) => b.member_id === mid)
        .map((b) => {
          const f = this.facilities.find((fac) => fac.facility_id === b.facility_id);
          const st = f ? this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id) : null;
          return {
            ...b,
            facility_name: f ? f.name : '',
            sport_name: st ? st.name : '',
          };
        })
        .sort((a, b) => b.start_at.localeCompare(a.start_at));
    }

    // 23. Active bookings for a date
    if (/FROM bookings\s+WHERE facility_id = \?\s+AND status IN \('PENDING', 'APPROVED'\)\s+AND DATE\(start_at\) = \?/i.test(normalized)) {
      const [facilityId, dateStr] = params;
      return this.bookings
        .filter(
          (b) =>
            b.facility_id === Number(facilityId) &&
            (b.status === 'PENDING' || b.status === 'APPROVED') &&
            b.start_at.startsWith(dateStr)
        )
        .sort((a, b) => a.start_at.localeCompare(b.start_at))
        .map((b) => ({
          booking_id: b.booking_id,
          facility_id: b.facility_id,
          start_at: b.start_at,
          end_at: b.end_at,
          status: b.status,
          purpose: b.purpose,
          participant_count: b.participant_count,
        }));
    }

    // 24. Admin list all bookings
    if (/FROM bookings b\s+JOIN users u ON u\.user_id = b\.member_id/i.test(normalized)) {
      let results = this.bookings.map((b) => {
        const u = this.users.find((user) => user.user_id === b.member_id);
        const f = this.facilities.find((fac) => fac.facility_id === b.facility_id);
        const st = f ? this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id) : null;
        const decider = b.decided_by ? this.users.find((user) => user.user_id === b.decided_by) : null;
        return {
          ...b,
          member_name: u ? u.full_name : '',
          member_email: u ? u.email : '',
          facility_name: f ? f.name : '',
          sport_name: st ? st.name : '',
          decider_name: decider ? decider.full_name : null,
        };
      });

      if (/b\.status = \?/i.test(normalized) && params[0]) {
        results = results.filter((b) => b.status === params[0]);
      }

      return results.sort((a, b) => b.start_at.localeCompare(a.start_at));
    }

    // 25. Select booking for update
    if (/FROM bookings WHERE booking_id = \?/i.test(normalized)) {
      const bid = Number(params[0]);
      const b = this.bookings.find((item) => item.booking_id === bid);
      return b ? [{ ...b }] : [];
    }

    // 26. Update booking decision (approve / reject)
    if (/UPDATE bookings\s+SET status = \?, decided_by = \?, decision_note = \?, decided_at = CURRENT_TIMESTAMP\s+WHERE booking_id = \?/i.test(normalized)) {
      const [status, adminUserId, decisionNote, bookingId] = params;
      const b = this.bookings.find((item) => item.booking_id === Number(bookingId));
      if (b) {
        b.status = status;
        b.decided_by = Number(adminUserId);
        b.decision_note = decisionNote || null;
        b.decided_at = this.nowIso();
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 27. Cancel booking
    if (/UPDATE bookings\s+SET status = 'CANCELLED'/i.test(normalized)) {
      const [reason, bookingId] = params;
      const b = this.bookings.find((item) => item.booking_id === Number(bookingId));
      if (b) {
        b.status = 'CANCELLED';
        b.decision_note = `${b.decision_note || ''} [Cancelled: ${reason || 'User requested'}]`.trim();
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 28. Equipment list
    if (/FROM equipment e\s+JOIN facilities f ON f\.facility_id = e\.facility_id/i.test(normalized)) {
      let results = this.equipment.map((e) => {
        const f = this.facilities.find((fac) => fac.facility_id === e.facility_id);
        return {
          ...e,
          facility_name: f ? f.name : '',
        };
      });

      if (/e\.facility_id = \?/i.test(normalized) && params[0]) {
        results = results.filter((e) => e.facility_id === Number(params[0]));
      }

      return results.sort((a, b) => a.facility_name.localeCompare(b.facility_name) || a.name.localeCompare(b.name));
    }

    // 29. Insert equipment
    if (/INSERT INTO equipment/i.test(normalized)) {
      const [facility_id, asset_tag, name, quantity, condition_status, notes] = params;
      const newEq: MemoryEquipment = {
        equipment_id: this.nextEquipmentId++,
        facility_id: Number(facility_id),
        asset_tag,
        name,
        quantity: Number(quantity),
        condition_status,
        notes: notes || null,
        created_at: this.nowIso(),
      };
      this.equipment.push(newEq);
      return { insertId: newEq.equipment_id, affectedRows: 1 };
    }

    // 30. Update equipment
    if (/UPDATE equipment SET/i.test(normalized)) {
      const eqId = Number(params[params.length - 1]);
      const eq = this.equipment.find((item) => item.equipment_id === eqId);
      if (eq) {
        const matchSet = normalized.match(/SET (.+?) WHERE/i);
        if (matchSet) {
          const assignments = matchSet[1].split(',').map((s) => s.trim());
          for (let i = 0; i < assignments.length; i++) {
            const field = assignments[i].split('=')[0].trim();
            (eq as any)[field] = params[i];
          }
        }
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 31. Delete equipment
    if (/DELETE FROM equipment WHERE equipment_id = \?/i.test(normalized)) {
      const id = Number(params[0]);
      const idx = this.equipment.findIndex((e) => e.equipment_id === id);
      if (idx !== -1) {
        this.equipment.splice(idx, 1);
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 32. Maintenance reports list
    if (/FROM maintenance_reports mr\s+JOIN facilities f/i.test(normalized)) {
      return this.maintenanceReports
        .map((mr) => {
          const f = this.facilities.find((fac) => fac.facility_id === mr.facility_id);
          const u = this.users.find((user) => user.user_id === mr.submitted_by);
          const wo = this.workOrders.find((w) => w.report_id === mr.report_id);
          const staff = wo?.assigned_to ? this.users.find((user) => user.user_id === wo.assigned_to) : null;
          return {
            report_id: mr.report_id,
            facility_id: mr.facility_id,
            facility_name: f ? f.name : '',
            submitted_by: mr.submitted_by,
            submitter_name: u ? u.full_name : '',
            title: mr.title,
            description: mr.description,
            severity: mr.severity,
            status: mr.status,
            created_at: mr.created_at,
            work_order_id: wo ? wo.work_order_id : null,
            work_order_status: wo ? wo.status : null,
            assigned_to: wo ? wo.assigned_to : null,
            assigned_to_name: staff ? staff.full_name : null,
          };
        })
        .sort((a, b) => {
          const severityOrder: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
          return (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5) || b.created_at.localeCompare(a.created_at);
        });
    }

    // 33. Insert maintenance report
    if (/INSERT INTO maintenance_reports/i.test(normalized)) {
      const [facility_id, submitted_by, title, description, severity] = params;
      const newReport: MemoryMaintenanceReport = {
        report_id: this.nextReportId++,
        facility_id: Number(facility_id),
        submitted_by: Number(submitted_by),
        title,
        description,
        severity,
        status: 'SUBMITTED',
        created_at: this.nowIso(),
      };
      this.maintenanceReports.push(newReport);
      return { insertId: newReport.report_id, affectedRows: 1 };
    }

    // 34. List work orders
    if (/FROM work_orders wo\s+JOIN maintenance_reports mr/i.test(normalized)) {
      let results = this.workOrders.map((wo) => {
        const mr = this.maintenanceReports.find((r) => r.report_id === wo.report_id);
        const f = mr ? this.facilities.find((fac) => fac.facility_id === mr.facility_id) : null;
        const submitter = mr ? this.users.find((u) => u.user_id === mr.submitted_by) : null;
        const staff = wo.assigned_to ? this.users.find((u) => u.user_id === wo.assigned_to) : null;
        return {
          work_order_id: wo.work_order_id,
          report_id: wo.report_id,
          facility_id: f ? f.facility_id : 0,
          facility_name: f ? f.name : '',
          report_title: mr ? mr.title : '',
          report_description: mr ? mr.description : '',
          report_severity: mr ? mr.severity : '',
          assigned_to: wo.assigned_to,
          assigned_name: staff ? staff.full_name : null,
          assigned_staff_name: staff ? staff.full_name : null,
          submitted_by_name: submitter ? submitter.full_name : null,
          status: wo.status,
          resolution_notes: wo.resolution_notes,
          assigned_at: wo.assigned_at,
          resolved_at: wo.resolved_at,
          created_at: wo.created_at,
        };
      });

      if (/wo\.assigned_to = \?/i.test(normalized) && params[0]) {
        results = results.filter((w) => w.assigned_to === Number(params[0]));
      }

      return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    // 35. Work order existing check
    if (/FROM work_orders WHERE report_id = \?/i.test(normalized)) {
      const repId = Number(params[0]);
      const wo = this.workOrders.find((w) => w.report_id === repId);
      return wo ? [{ work_order_id: wo.work_order_id }] : [];
    }

    // 36. Reassign work order
    if (/UPDATE work_orders\s+SET assigned_to = \?, status = 'ASSIGNED', assigned_at = CURRENT_TIMESTAMP\s+WHERE work_order_id = \?/i.test(normalized)) {
      const [assignedTo, woId] = params;
      const wo = this.workOrders.find((w) => w.work_order_id === Number(woId));
      if (wo) {
        wo.assigned_to = Number(assignedTo);
        wo.status = 'ASSIGNED';
        wo.assigned_at = this.nowIso();
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 37. Insert work order
    if (/INSERT INTO work_orders/i.test(normalized)) {
      const [report_id, assigned_to] = params;
      const newWo: MemoryWorkOrder = {
        work_order_id: this.nextWorkOrderId++,
        report_id: Number(report_id),
        assigned_to: Number(assigned_to),
        status: 'ASSIGNED',
        resolution_notes: null,
        assigned_at: this.nowIso(),
        resolved_at: null,
        created_at: this.nowIso(),
      };
      this.workOrders.push(newWo);
      return { insertId: newWo.work_order_id, affectedRows: 1 };
    }

    // 38. Update report status to WORK_ORDER_CREATED
    if (/UPDATE maintenance_reports SET status = 'WORK_ORDER_CREATED' WHERE report_id = \?/i.test(normalized)) {
      const repId = Number(params[0]);
      const rep = this.maintenanceReports.find((r) => r.report_id === repId);
      if (rep) {
        rep.status = 'WORK_ORDER_CREATED';
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 39. Update work order status
    if (/UPDATE work_orders\s+SET status = \?,/i.test(normalized)) {
      const [status, resolutionNotes, isResolved, woId] = params;
      const wo = this.workOrders.find((w) => w.work_order_id === Number(woId));
      if (wo) {
        wo.status = status;
        if (resolutionNotes) wo.resolution_notes = resolutionNotes;
        if (Number(isResolved) === 1) wo.resolved_at = this.nowIso();
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 40. Update report status when work order resolved
    if (/UPDATE maintenance_reports mr\s+JOIN work_orders wo ON wo\.report_id = mr\.report_id\s+SET mr\.status = 'RESOLVED'/i.test(normalized)) {
      const woId = Number(params[0]);
      const wo = this.workOrders.find((w) => w.work_order_id === woId);
      if (wo) {
        const mr = this.maintenanceReports.find((r) => r.report_id === wo.report_id);
        if (mr) mr.status = 'RESOLVED';
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }

    // 41. Dashboard summary
    if (/total_facilities/i.test(normalized) && /active_facilities/i.test(normalized)) {
      const total_facilities = this.facilities.length;
      const active_facilities = this.facilities.filter((f) => f.facility_status === 'ACTIVE').length;
      const total_bookings = this.bookings.length;
      const pending_bookings = this.bookings.filter((b) => b.status === 'PENDING').length;
      const approved_bookings = this.bookings.filter((b) => b.status === 'APPROVED').length;
      const total_revenue_estimate = this.bookings
        .filter((b) => b.status === 'APPROVED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.total_price), 0);
      const open_maintenance_issues = this.maintenanceReports.filter((r) => r.status !== 'RESOLVED' && r.status !== 'CLOSED').length;
      const active_work_orders = this.workOrders.filter((w) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(w.status)).length;
      const registered_members = this.users.filter((u) => u.role === 'MEMBER').length;
      const pending_user_registrations = this.users.filter((u) => u.account_status === 'PENDING_APPROVAL').length;

      return [{
        total_facilities,
        active_facilities,
        total_bookings,
        pending_bookings,
        approved_bookings,
        total_revenue_estimate,
        open_maintenance_issues,
        active_work_orders,
        registered_members,
        pending_user_registrations,
      }];
    }

    // 42. Bookings by status
    if (/FROM bookings\s+GROUP BY status/i.test(normalized)) {
      const total = this.bookings.length || 1;
      const counts: Record<string, number> = {};
      for (const b of this.bookings) {
        counts[b.status] = (counts[b.status] || 0) + 1;
      }
      return Object.entries(counts).map(([status, count]) => ({
        status,
        count,
        percentage: Number(((count * 100) / total).toFixed(1)),
      })).sort((a, b) => b.count - a.count);
    }

    // 43. Most booked facilities
    if (/COUNT\(b\.booking_id\) AS approved_booking_count/i.test(normalized)) {
      return this.facilities.map((f) => {
        const sport = this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id);
        const booked = this.bookings.filter((b) => b.facility_id === f.facility_id && (b.status === 'APPROVED' || b.status === 'COMPLETED'));
        const rev = booked.reduce((sum, b) => sum + Number(b.total_price), 0);
        return {
          facility_id: f.facility_id,
          facility_name: f.name,
          sport: sport ? sport.name : '',
          capacity: f.capacity,
          hourly_rate: f.hourly_rate,
          approved_booking_count: booked.length,
          total_revenue: rev,
        };
      }).sort((a, b) => b.approved_booking_count - a.approved_booking_count || b.total_revenue - a.total_revenue);
    }

    // 44. Monthly reservation volume
    if (/DATE_FORMAT\(start_at, '%Y-%m'\) AS booking_month/i.test(normalized)) {
      const months: Record<string, { total_reservations: number; approved_count: number; pending_count: number; revenue_estimate: number }> = {};
      for (const b of this.bookings) {
        if (!['PENDING', 'APPROVED', 'COMPLETED'].includes(b.status)) continue;
        const m = b.start_at.substring(0, 7);
        if (!months[m]) months[m] = { total_reservations: 0, approved_count: 0, pending_count: 0, revenue_estimate: 0 };
        months[m].total_reservations++;
        if (b.status === 'APPROVED') months[m].approved_count++;
        if (b.status === 'PENDING') months[m].pending_count++;
        months[m].revenue_estimate += Number(b.total_price);
      }
      return Object.entries(months).map(([booking_month, data]) => ({
        booking_month,
        ...data,
      })).sort((a, b) => a.booking_month.localeCompare(b.booking_month));
    }

    // 45. Facility utilization
    if (/utilization_percentage/i.test(normalized)) {
      const weeklyMinutes = 7 * 16 * 60; // 6720 mins
      return this.facilities.map((f) => {
        const sport = this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id);
        const booked = this.bookings.filter((b) => b.facility_id === f.facility_id && (b.status === 'APPROVED' || b.status === 'COMPLETED'));
        let bookedMinutes = 0;
        for (const b of booked) {
          const s = new Date(b.start_at).getTime();
          const e = new Date(b.end_at).getTime();
          if (e > s) {
            bookedMinutes += Math.round((e - s) / 60000);
          }
        }
        return {
          facility_id: f.facility_id,
          facility_name: f.name,
          sport: sport ? sport.name : '',
          facility_status: f.facility_status,
          booked_minutes: bookedMinutes,
          weekly_available_minutes: weeklyMinutes,
          utilization_percentage: Number(((bookedMinutes * 100) / weeklyMinutes).toFixed(2)),
        };
      }).sort((a, b) => b.utilization_percentage - a.utilization_percentage);
    }

    // 46. Maintenance backlog summary
    if (/FROM maintenance_reports mr\s+WHERE mr\.status NOT IN \('RESOLVED', 'CLOSED'\)/i.test(normalized) && /GROUP BY mr\.severity/i.test(normalized)) {
      const backlog: Record<string, { severity: string; status: string; issue_count: number; oldest_unresolved: string }> = {};
      for (const r of this.maintenanceReports) {
        if (r.status === 'RESOLVED' || r.status === 'CLOSED') continue;
        const key = `${r.severity}-${r.status}`;
        if (!backlog[key]) {
          backlog[key] = { severity: r.severity, status: r.status, issue_count: 0, oldest_unresolved: r.created_at };
        }
        backlog[key].issue_count++;
        if (r.created_at < backlog[key].oldest_unresolved) backlog[key].oldest_unresolved = r.created_at;
      }
      return Object.values(backlog);
    }

    // 47. Views
    if (/FROM v_pending_bookings/i.test(normalized)) {
      return this.bookings
        .filter((b) => b.status === 'PENDING')
        .map((b) => {
          const u = this.users.find((user) => user.user_id === b.member_id);
          const f = this.facilities.find((fac) => fac.facility_id === b.facility_id);
          const st = f ? this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id) : null;
          return {
            booking_id: b.booking_id,
            member_id: b.member_id,
            member_name: u ? u.full_name : '',
            member_email: u ? u.email : '',
            facility_id: b.facility_id,
            facility_name: f ? f.name : '',
            sport_name: st ? st.name : '',
            start_at: b.start_at,
            end_at: b.end_at,
            participant_count: b.participant_count,
            purpose: b.purpose,
            total_price: b.total_price,
            created_at: b.created_at,
          };
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    if (/FROM v_facility_booking_summary/i.test(normalized)) {
      return this.facilities.map((f) => {
        const sport = this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id);
        const fBookings = this.bookings.filter((b) => b.facility_id === f.facility_id);
        const approved = fBookings.filter((b) => b.status === 'APPROVED').length;
        const pending = fBookings.filter((b) => b.status === 'PENDING').length;
        const cancelled = fBookings.filter((b) => b.status === 'CANCELLED').length;
        const revenue = fBookings
          .filter((b) => b.status === 'APPROVED' || b.status === 'COMPLETED')
          .reduce((sum, b) => sum + Number(b.total_price), 0);
        const recent = fBookings
          .filter((b) => b.status === 'PENDING' || b.status === 'APPROVED')
          .map((b) => b.start_at)
          .sort()
          .pop() || null;
        return {
          facility_id: f.facility_id,
          facility_name: f.name,
          sport_name: sport ? sport.name : '',
          capacity: f.capacity,
          hourly_rate: f.hourly_rate,
          facility_status: f.facility_status,
          total_bookings: fBookings.length,
          approved_bookings: approved,
          pending_bookings: pending,
          cancelled_bookings: cancelled,
          estimated_revenue: revenue,
          most_recent_booking: recent,
        };
      }).sort((a, b) => b.total_bookings - a.total_bookings);
    }

    if (/FROM v_maintenance_backlog/i.test(normalized)) {
      return this.maintenanceReports
        .filter((mr) => mr.status !== 'RESOLVED' && mr.status !== 'CLOSED')
        .map((mr) => {
          const f = this.facilities.find((fac) => fac.facility_id === mr.facility_id);
          const u_sub = this.users.find((u) => u.user_id === mr.submitted_by);
          const wo = this.workOrders.find((w) => w.report_id === mr.report_id);
          const u_staff = wo?.assigned_to ? this.users.find((u) => u.user_id === wo.assigned_to) : null;
          return {
            report_id: mr.report_id,
            facility_id: mr.facility_id,
            facility_name: f ? f.name : '',
            title: mr.title,
            description: mr.description,
            severity: mr.severity,
            report_status: mr.status,
            reported_at: mr.created_at,
            reported_by: u_sub ? u_sub.full_name : '',
            work_order_id: wo ? wo.work_order_id : null,
            work_order_status: wo ? wo.status : null,
            assigned_to_name: u_staff ? u_staff.full_name : null,
            assigned_to_email: u_staff ? u_staff.email : null,
            assigned_at: wo ? wo.assigned_at : null,
          };
        })
        .sort((a, b) => b.reported_at.localeCompare(a.reported_at));
    }

    // 48. Stored procedure call
    if (/CALL sp_get_facility_booking_summary/i.test(normalized)) {
      const summary = this.facilities.map((f) => {
        const sport = this.sportTypes.find((s) => s.sport_type_id === f.sport_type_id);
        const fBookings = this.bookings.filter((b) => b.facility_id === f.facility_id);
        return {
          facility_id: f.facility_id,
          facility_name: f.name,
          sport_name: sport ? sport.name : '',
          total_bookings: fBookings.length,
        };
      });
      return [[summary]];
    }

    console.warn('[InMemoryDB] Unhandled query pattern:', sql);
    return [];
  }
}

export const memoryDb = new InMemoryDatabase();
