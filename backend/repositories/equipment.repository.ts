import { query } from '../db/pool.ts';

export interface EquipmentRow {
  equipment_id: number;
  facility_id: number;
  facility_name: string;
  asset_tag: string;
  name: string;
  quantity: number;
  condition_status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'NEEDS_REPAIR';
  notes: string | null;
  created_at: string;
}

export async function listEquipment(facilityId?: number): Promise<EquipmentRow[]> {
  let sql = `
    SELECT 
      e.equipment_id,
      e.facility_id,
      f.name AS facility_name,
      e.asset_tag,
      e.name,
      e.quantity,
      e.condition_status,
      e.notes,
      e.created_at
    FROM equipment e
    JOIN facilities f ON f.facility_id = e.facility_id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (facilityId) {
    sql += ' AND e.facility_id = ?';
    params.push(facilityId);
  }
  sql += ' ORDER BY f.name ASC, e.name ASC';

  return await query<EquipmentRow[]>(sql, params);
}

export async function createEquipment(data: {
  facility_id: number;
  asset_tag: string;
  name: string;
  quantity: number;
  condition_status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'NEEDS_REPAIR';
  notes?: string;
}): Promise<number> {
  const sql = `
    INSERT INTO equipment (facility_id, asset_tag, name, quantity, condition_status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const res: any = await query(sql, [
    data.facility_id,
    data.asset_tag,
    data.name,
    data.quantity,
    data.condition_status,
    data.notes || null,
  ]);
  return res.insertId;
}

export async function updateEquipment(
  equipmentId: number,
  data: Partial<{
    quantity: number;
    condition_status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | 'NEEDS_REPAIR';
    notes: string;
  }>
): Promise<boolean> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.quantity !== undefined) { fields.push('quantity = ?'); params.push(data.quantity); }
  if (data.condition_status !== undefined) { fields.push('condition_status = ?'); params.push(data.condition_status); }
  if (data.notes !== undefined) { fields.push('notes = ?'); params.push(data.notes); }

  if (fields.length === 0) return false;

  params.push(equipmentId);
  const sql = `UPDATE equipment SET ${fields.join(', ')} WHERE equipment_id = ?`;
  const res: any = await query(sql, params);
  return res.affectedRows > 0;
}
