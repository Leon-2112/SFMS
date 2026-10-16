import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { query, testConnection, getConnection } from './backend/db/pool.ts';
import { authenticate, authorize, AuthRequest } from './backend/middleware/auth.ts';
import * as facilityRepo from './backend/repositories/facility.repository.ts';
import * as bookingRepo from './backend/repositories/booking.repository.ts';
import * as maintenanceRepo from './backend/repositories/maintenance.repository.ts';
import * as equipmentRepo from './backend/repositories/equipment.repository.ts';
import * as reportRepo from './backend/repositories/report.repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Background database health assurance
async function ensureDatabaseRunning() {
  const isAlive = await testConnection();
  if (isAlive) {
    console.log('[Server] Database layer operational (active data store ready).');
    return;
  }
}

// ----------------------------------------------------------------------------
// API: AUTHENTICATION & DEMO USERS
// ----------------------------------------------------------------------------
app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, email, password, role, phone, department } = req.body;
    if (!full_name || !email || !password || !role) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Full name, email, password, and role are required.' },
      });
      return;
    }

    const sanitizedRole = String(role).trim().toUpperCase();
    if (sanitizedRole !== 'MEMBER' && sanitizedRole !== 'MAINTENANCE_STAFF') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_ROLE', message: 'Registration is permitted for Member or Maintenance Staff roles.' },
      });
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' },
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await query<any[]>('SELECT user_id, account_status FROM users WHERE email = ? LIMIT 1', [trimmedEmail]);
    if (existing.length > 0) {
      const status = existing[0].account_status;
      if (status === 'PENDING_APPROVAL') {
        res.status(409).json({
          success: false,
          error: { code: 'REGISTRATION_ALREADY_PENDING', message: 'A registration request with this email is already awaiting administrator review.' },
        });
        return;
      }
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email address already exists. Please sign in.' },
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result: any = await query(
      `INSERT INTO users (full_name, email, password_hash, role, account_status, phone, department, created_at)
       VALUES (?, ?, ?, ?, 'PENDING_APPROVAL', ?, ?, NOW())`,
      [full_name.trim(), trimmedEmail, passwordHash, sanitizedRole, phone?.trim() || null, department?.trim() || null]
    );

    res.status(201).json({
      success: true,
      message: 'Registration request submitted! Your account is pending administrator approval before you can sign in.',
      data: {
        user_id: result.insertId,
        full_name: full_name.trim(),
        email: trimmedEmail,
        role: sanitizedRole,
        account_status: 'PENDING_APPROVAL',
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' },
      });
      return;
    }

    const rows = await query<any[]>(
      'SELECT user_id, full_name, email, password_hash, role, account_status, department FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    const user = rows[0];
    if (user.account_status !== 'ACTIVE') {
      let message = `Account is ${user.account_status}. Please contact administrator.`;
      if (user.account_status === 'PENDING_APPROVAL') {
        message = 'Your registration is currently pending administrator approval. Please wait for the Campus Athletics Directorate to review and activate your account.';
      } else if (user.account_status === 'REJECTED') {
        message = 'Your registration request was not approved by the administrator. Please contact the Athletics Directorate.';
      }
      res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_ACTIVE',
          status: user.account_status,
          message,
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    // Base64 session token
    const token = Buffer.from(JSON.stringify({ user_id: user.user_id, email: user.email, role: user.role })).toString('base64');

    res.json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          account_status: user.account_status,
          department: user.department,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

app.get('/api/auth/demo-users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await query(
      'SELECT user_id, full_name, email, role, department FROM users WHERE account_status = "ACTIVE" ORDER BY role ASC, user_id ASC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: FACILITIES & AVAILABILITY
// ----------------------------------------------------------------------------
app.get('/api/facilities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sportId = req.query.sport_type_id ? Number(req.query.sport_type_id) : undefined;
    const search = req.query.q as string | undefined;
    const facilities = await facilityRepo.listActiveFacilities(sportId, search);
    res.json({ success: true, data: facilities });
  } catch (error) {
    next(error);
  }
});

app.get('/api/facilities/sport-types', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sports = await facilityRepo.listAllSportTypes();
    res.json({ success: true, data: sports });
  } catch (error) {
    next(error);
  }
});

app.get('/api/facilities/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilityId = Number(req.params.id);
    const facility = await facilityRepo.getFacilityById(facilityId);
    if (!facility) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Facility not found' } });
      return;
    }
    const operatingHours = await facilityRepo.getFacilityOperatingHours(facilityId);
    res.json({ success: true, data: { ...facility, operating_hours: operatingHours } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/facilities/:id/availability', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilityId = Number(req.params.id);
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const bookings = await bookingRepo.getFacilityBookingsForDate(facilityId, dateStr);
    const operatingHours = await facilityRepo.getFacilityOperatingHours(facilityId);
    res.json({
      success: true,
      data: {
        facility_id: facilityId,
        date: dateStr,
        operating_hours: operatingHours,
        reserved_slots: bookings.map((b) => ({
          booking_id: b.booking_id,
          start_at: b.start_at,
          end_at: b.end_at,
          status: b.status,
          purpose: b.purpose,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: BOOKINGS (MEMBER & SHARED)
// ----------------------------------------------------------------------------
app.get('/api/bookings/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingRepo.getMemberBookings(req.user!.user_id);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

app.post('/api/bookings', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { facility_id, start_at, end_at, participant_count, purpose } = req.body;

    if (!facility_id || !start_at || !end_at || !participant_count || !purpose) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Facility, start time, end time, participant count, and purpose are required.' },
      });
      return;
    }

    const booking = await bookingRepo.createBookingWithTransaction({
      member_id: req.user!.user_id,
      facility_id: Number(facility_id),
      start_at,
      end_at,
      participant_count: Number(participant_count),
      purpose: purpose.trim(),
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error: any) {
    if (error.name === 'BookingConflictError') {
      res.status(409).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message: error.message,
          conflicts: error.conflictingBookings,
        },
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
      return;
    }
    next(error);
  }
});

const handleCancelBooking = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookingId = Number(req.params.id);
    const reason = req.body?.reason || 'Member cancelled';
    await bookingRepo.cancelBooking(bookingId, req.user!.user_id, req.user!.role, reason);
    res.json({ success: true, message: `Booking #${bookingId} has been successfully cancelled.` });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, error: { code: 'INVALID_CANCELLATION', message: error.message } });
      return;
    }
    next(error);
  }
};

app.patch('/api/bookings/:id/cancel', authenticate, handleCancelBooking);
app.post('/api/bookings/:id/cancel', authenticate, handleCancelBooking);


// ----------------------------------------------------------------------------
// API: ADMIN BOOKINGS MANAGEMENT
// ----------------------------------------------------------------------------
app.get('/api/admin/bookings', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const bookings = await bookingRepo.listAllBookings(status);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/bookings/:id/decision', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const bookingId = Number(req.params.id);
    const { status, decision_note } = req.body;

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be APPROVED or REJECTED' } });
      return;
    }

    await bookingRepo.decideBooking(bookingId, req.user!.user_id, status, decision_note);
    res.json({ success: true, message: `Booking #${bookingId} marked as ${status}.` });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
      return;
    }
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: ADMIN FACILITY MANAGEMENT
// ----------------------------------------------------------------------------
app.post('/api/admin/facilities', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = await facilityRepo.createFacility(req.body);
    res.status(201).json({ success: true, data: { facility_id: id } });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/facilities/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilityId = Number(req.params.id);
    await facilityRepo.updateFacility(facilityId, req.body);
    res.json({ success: true, message: 'Facility updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/facilities/:id/operating-hours', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilityId = Number(req.params.id);
    const { hours } = req.body;
    if (!Array.isArray(hours)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Hours array required' } });
      return;
    }
    for (const h of hours) {
      await query(
        `INSERT INTO operating_hours (facility_id, day_of_week, opens_at, closes_at)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE opens_at = VALUES(opens_at), closes_at = VALUES(closes_at)`,
        [facilityId, h.day_of_week, h.opens_at, h.closes_at]
      );
    }
    res.json({ success: true, message: 'Operating hours updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/facilities/:id/status', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilityId = Number(req.params.id);
    const { status } = req.body;
    await facilityRepo.updateFacilityStatus(facilityId, status);
    res.json({ success: true, message: `Facility status updated to ${status}.` });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: EQUIPMENT MANAGEMENT
// ----------------------------------------------------------------------------
app.get('/api/admin/equipment', authenticate, authorize('ADMIN', 'MAINTENANCE_STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilityId = req.query.facility_id ? Number(req.query.facility_id) : undefined;
    const items = await equipmentRepo.listEquipment(facilityId);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/equipment', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = await equipmentRepo.createEquipment(req.body);
    res.status(201).json({ success: true, data: { equipment_id: id } });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/equipment/:id', authenticate, authorize('ADMIN', 'MAINTENANCE_STAFF'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await equipmentRepo.updateEquipment(id, req.body);
    res.json({ success: true, message: 'Equipment updated successfully.' });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/equipment/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM equipment WHERE equipment_id = ?', [id]);
    res.json({ success: true, message: 'Equipment deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: MAINTENANCE REPORTS & WORK ORDERS
// ----------------------------------------------------------------------------
app.get('/api/maintenance/reports', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await maintenanceRepo.listMaintenanceReports();
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

app.post('/api/maintenance/reports', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { facility_id, title, description, severity } = req.body;
    if (!facility_id || !title || !description) {
      res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Facility, title, and description are required.' } });
      return;
    }
    const reportId = await maintenanceRepo.createMaintenanceReport({
      facility_id: Number(facility_id),
      submitted_by: req.user!.user_id,
      title: title.trim(),
      description: description.trim(),
      severity: severity || 'MEDIUM',
    });
    res.status(201).json({ success: true, data: { report_id: reportId } });
  } catch (error) {
    next(error);
  }
});

app.get('/api/maintenance/work-orders', authenticate, authorize('ADMIN', 'MAINTENANCE_STAFF'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const staffId = req.user!.role === 'MAINTENANCE_STAFF' ? req.user!.user_id : (req.query.assigned_to ? Number(req.query.assigned_to) : undefined);
    const workOrders = await maintenanceRepo.listWorkOrders(staffId);
    res.json({ success: true, data: workOrders });
  } catch (error) {
    next(error);
  }
});

app.post('/api/maintenance/work-orders/assign', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { report_id, assigned_to } = req.body;
    if (!report_id || !assigned_to) {
      res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Report ID and assigned staff ID are required.' } });
      return;
    }
    const workOrderId = await maintenanceRepo.assignWorkOrder(Number(report_id), Number(assigned_to), req.user!.user_id);
    res.json({ success: true, data: { work_order_id: workOrderId } });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/maintenance/work-orders/:id/status', authenticate, authorize('ADMIN', 'MAINTENANCE_STAFF'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const workOrderId = Number(req.params.id);
    const { status, resolution_notes } = req.body;
    await maintenanceRepo.updateWorkOrderStatus(workOrderId, status, resolution_notes, req.user!.user_id);
    res.json({ success: true, message: `Work order #${workOrderId} updated to ${status}.` });
  } catch (error) {
    next(error);
  }
});

app.get('/api/maintenance/staff-list', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const staff = await maintenanceRepo.listMaintenanceStaffUsers();
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: ADMIN USER & STAFF REGISTRATION APPROVAL
// ----------------------------------------------------------------------------
app.get('/api/admin/users/pending', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await query<any[]>(
      `SELECT user_id, full_name, email, role, account_status, phone, department, created_at
       FROM users
       WHERE account_status = 'PENDING_APPROVAL'
       ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/users', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    let sql = 'SELECT user_id, full_name, email, role, account_status, phone, department, created_at FROM users';
    const params: any[] = [];
    if (status) {
      sql += ' WHERE account_status = ?';
      params.push(status);
    }
    sql += ' ORDER BY user_id DESC';
    const rows = await query<any[]>(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/admin/users/:id/decision', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;
    if (status !== 'ACTIVE' && status !== 'REJECTED') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: "Status must be 'ACTIVE' (approved) or 'REJECTED'." },
      });
      return;
    }

    const check = await query<any[]>('SELECT user_id, full_name, role, account_status FROM users WHERE user_id = ?', [userId]);
    if (check.length === 0) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
      return;
    }

    await query('UPDATE users SET account_status = ? WHERE user_id = ?', [status, userId]);
    res.json({
      success: true,
      message: `User #${userId} (${check[0].full_name}) has been ${status === 'ACTIVE' ? 'approved and activated' : 'rejected'}.`,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// API: MANAGEMENT REPORTS & ANALYTICS
// ----------------------------------------------------------------------------
app.get('/api/admin/reports/summary', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await reportRepo.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/by-status', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getBookingsByStatus();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/most-booked', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getMostBookedFacilities();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/monthly', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getMonthlyReservationVolume();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/utilization', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getFacilityUtilization();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/maintenance-backlog', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getMaintenanceBacklogSummary();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/views/pending', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getViewPendingBookings();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/views/facility-summary', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getViewFacilitySummary();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/reports/views/maintenance-backlog', authenticate, authorize('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportRepo.getViewMaintenanceBacklog();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred.',
    },
  });
});

// ----------------------------------------------------------------------------
// FRONTEND STATIC / DEV SERVER INTEGRATION
// ----------------------------------------------------------------------------
async function startServer() {
  await ensureDatabaseRunning();

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SFMS] Full-Stack Application Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal] Failed to launch server:', err);
});
