import { query, getConnection } from '../db/pool.ts';

export interface MaintenanceReportRow {
  report_id: number;
  facility_id: number;
  facility_name: string;
  submitted_by: number;
  submitter_name: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'SUBMITTED' | 'IN_REVIEW' | 'WORK_ORDER_CREATED' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  work_order_id?: number | null;
  work_order_status?: string | null;
  assigned_to?: number | null;
  assigned_to_name?: string | null;
}

export interface WorkOrderRow {
  work_order_id: number;
  report_id: number;
  facility_name: string;
  report_title: string;
  report_severity: string;
  assigned_to: number | null;
  assigned_name: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolution_notes: string | null;
  assigned_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export async function listMaintenanceReports(): Promise<MaintenanceReportRow[]> {
  const sql = `
    SELECT 
      mr.report_id,
      mr.facility_id,
      f.name AS facility_name,
      mr.submitted_by,
      u.full_name AS submitter_name,
      mr.title,
      mr.description,
      mr.severity,
      mr.status,
      mr.created_at,
      wo.work_order_id,
      wo.status AS work_order_status,
      wo.assigned_to,
      staff.full_name AS assigned_to_name
    FROM maintenance_reports mr
    JOIN facilities f ON f.facility_id = mr.facility_id
    JOIN users u ON u.user_id = mr.submitted_by
    LEFT JOIN work_orders wo ON wo.report_id = mr.report_id
    LEFT JOIN users staff ON staff.user_id = wo.assigned_to
    ORDER BY 
      CASE mr.severity 
        WHEN 'CRITICAL' THEN 1 
        WHEN 'HIGH' THEN 2 
        WHEN 'MEDIUM' THEN 3 
        WHEN 'LOW' THEN 4 
      END ASC,
      mr.created_at DESC
  `;
  return await query<MaintenanceReportRow[]>(sql);
}

export async function createMaintenanceReport(data: {
  facility_id: number;
  submitted_by: number;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}): Promise<number> {
  const sql = `
    INSERT INTO maintenance_reports (facility_id, submitted_by, title, description, severity, status)
    VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
  `;
  const res: any = await query(sql, [
    data.facility_id,
    data.submitted_by,
    data.title,
    data.description,
    data.severity,
  ]);
  return res.insertId;
}

export async function listWorkOrders(staffUserId?: number): Promise<WorkOrderRow[]> {
  let sql = `
    SELECT 
      wo.work_order_id,
      wo.report_id,
      f.name AS facility_name,
      mr.title AS report_title,
      mr.severity AS report_severity,
      wo.assigned_to,
      u.full_name AS assigned_name,
      wo.status,
      wo.resolution_notes,
      wo.assigned_at,
      wo.resolved_at,
      wo.created_at
    FROM work_orders wo
    JOIN maintenance_reports mr ON mr.report_id = wo.report_id
    JOIN facilities f ON f.facility_id = mr.facility_id
    LEFT JOIN users u ON u.user_id = wo.assigned_to
    WHERE 1=1
  `;
  const params: any[] = [];
  if (staffUserId) {
    sql += ' AND wo.assigned_to = ?';
    params.push(staffUserId);
  }
  sql += ' ORDER BY wo.created_at DESC';

  return await query<WorkOrderRow[]>(sql, params);
}

export async function assignWorkOrder(
  reportId: number,
  assignedToStaffId: number,
  adminUserId: number
): Promise<number> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Check if work order already exists for this report
    const [existing]: any = await conn.execute(
      'SELECT work_order_id FROM work_orders WHERE report_id = ? LIMIT 1',
      [reportId]
    );

    let workOrderId: number;
    if (existing && existing.length > 0) {
      workOrderId = existing[0].work_order_id;
      await conn.execute(
        `UPDATE work_orders 
         SET assigned_to = ?, status = 'ASSIGNED', assigned_at = CURRENT_TIMESTAMP
         WHERE work_order_id = ?`,
        [assignedToStaffId, workOrderId]
      );
    } else {
      const [res]: any = await conn.execute(
        `INSERT INTO work_orders (report_id, assigned_to, status, assigned_at)
         VALUES (?, ?, 'ASSIGNED', CURRENT_TIMESTAMP)`,
        [reportId, assignedToStaffId]
      );
      workOrderId = res.insertId;
    }

    // Update maintenance report status
    await conn.execute(
      "UPDATE maintenance_reports SET status = 'WORK_ORDER_CREATED' WHERE report_id = ?",
      [reportId]
    );

    await conn.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'WORK_ORDER_ASSIGN', 'WORK_ORDER', ?, ?)`,
      [adminUserId, workOrderId, `Assigned work order #${workOrderId} to staff #${assignedToStaffId}`]
    );

    await conn.commit();
    return workOrderId;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function updateWorkOrderStatus(
  workOrderId: number,
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
  resolutionNotes: string,
  actorUserId: number
): Promise<boolean> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const isResolved = status === 'RESOLVED' || status === 'CLOSED';
    await conn.execute(
      `UPDATE work_orders 
       SET status = ?, 
           resolution_notes = COALESCE(?, resolution_notes), 
           resolved_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE resolved_at END
       WHERE work_order_id = ?`,
      [status, resolutionNotes || null, isResolved ? 1 : 0, workOrderId]
    );

    // If resolved, update report status as well
    if (isResolved) {
      await conn.execute(
        `UPDATE maintenance_reports mr
         JOIN work_orders wo ON wo.report_id = mr.report_id
         SET mr.status = 'RESOLVED'
         WHERE wo.work_order_id = ?`,
        [workOrderId]
      );
    }

    await conn.execute(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
       VALUES (?, 'WORK_ORDER_STATUS_UPDATE', 'WORK_ORDER', ?, ?)`,
      [actorUserId, workOrderId, `Work order #${workOrderId} status updated to ${status}`]
    );

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function listMaintenanceStaffUsers(): Promise<Array<{ user_id: number; full_name: string; email: string }>> {
  return await query(
    "SELECT user_id, full_name, email FROM users WHERE role = 'MAINTENANCE_STAFF' AND account_status = 'ACTIVE' ORDER BY full_name ASC"
  );
}
