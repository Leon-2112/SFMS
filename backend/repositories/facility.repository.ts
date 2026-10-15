import { query } from '../db/pool.ts';

export interface FacilityRow {
  facility_id: number;
  sport_type_id: number;
  sport_name: string;
  name: string;
  location: string;
  is_indoor: number | boolean;
  capacity: number;
  hourly_rate: string | number;
  facility_status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface OperatingHourRow {
  operating_hour_id: number;
  facility_id: number;
  day_of_week: number;
  opens_at: string;
  closes_at: string;
}

export async function listActiveFacilities(sportId?: number, search?: string): Promise<FacilityRow[]> {
  let sql = `
    SELECT 
      f.facility_id,
      f.sport_type_id,
      st.name AS sport_name,
      f.name,
      f.location,
      f.is_indoor,
      f.capacity,
      f.hourly_rate,
      f.facility_status,
      f.description,
      f.image_url,
      f.created_at
    FROM facilities f
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (sportId) {
    sql += ' AND f.sport_type_id = ?';
    params.push(sportId);
  }

  if (search && search.trim()) {
    sql += ' AND (f.name LIKE ? OR f.location LIKE ? OR st.name LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY f.facility_status ASC, f.name ASC';

  return await query<FacilityRow[]>(sql, params);
}

export async function getFacilityById(facilityId: number): Promise<FacilityRow | null> {
  const sql = `
    SELECT 
      f.facility_id,
      f.sport_type_id,
      st.name AS sport_name,
      f.name,
      f.location,
      f.is_indoor,
      f.capacity,
      f.hourly_rate,
      f.facility_status,
      f.description,
      f.image_url,
      f.created_at
    FROM facilities f
    JOIN sport_types st ON st.sport_type_id = f.sport_type_id
    WHERE f.facility_id = ?
    LIMIT 1
  `;
  const rows = await query<FacilityRow[]>(sql, [facilityId]);
  return rows[0] || null;
}

export async function getFacilityOperatingHours(facilityId: number): Promise<OperatingHourRow[]> {
  const sql = `
    SELECT operating_hour_id, facility_id, day_of_week, opens_at, closes_at
    FROM operating_hours
    WHERE facility_id = ?
    ORDER BY day_of_week ASC
  `;
  return await query<OperatingHourRow[]>(sql, [facilityId]);
}

export async function listAllSportTypes(): Promise<Array<{ sport_type_id: number; name: string; description: string; icon_name: string }>> {
  return await query('SELECT sport_type_id, name, description, icon_name FROM sport_types ORDER BY name ASC');
}

export async function createFacility(data: {
  sport_type_id: number;
  name: string;
  location: string;
  is_indoor: boolean;
  capacity: number;
  hourly_rate: number;
  description?: string;
  image_url?: string;
}): Promise<number> {
  const sql = `
    INSERT INTO facilities (sport_type_id, name, location, is_indoor, capacity, hourly_rate, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const res: any = await query(sql, [
    data.sport_type_id,
    data.name,
    data.location,
    data.is_indoor ? 1 : 0,
    data.capacity,
    data.hourly_rate,
    data.description || null,
    data.image_url || null,
  ]);
  return res.insertId;
}

export async function updateFacilityStatus(facilityId: number, status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'): Promise<boolean> {
  const sql = 'UPDATE facilities SET facility_status = ? WHERE facility_id = ?';
  const res: any = await query(sql, [status, facilityId]);
  return res.affectedRows > 0;
}

export async function updateFacility(
  facilityId: number,
  data: Partial<{
    name: string;
    location: string;
    capacity: number;
    hourly_rate: number;
    is_indoor: boolean;
    description: string;
    image_url: string;
    facility_status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  }>
): Promise<boolean> {
  const fields: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
  if (data.location !== undefined) { fields.push('location = ?'); params.push(data.location); }
  if (data.capacity !== undefined) { fields.push('capacity = ?'); params.push(data.capacity); }
  if (data.hourly_rate !== undefined) { fields.push('hourly_rate = ?'); params.push(data.hourly_rate); }
  if (data.is_indoor !== undefined) { fields.push('is_indoor = ?'); params.push(data.is_indoor ? 1 : 0); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.image_url !== undefined) { fields.push('image_url = ?'); params.push(data.image_url); }
  if (data.facility_status !== undefined) { fields.push('facility_status = ?'); params.push(data.facility_status); }

  if (fields.length === 0) return false;

  params.push(facilityId);
  const sql = `UPDATE facilities SET ${fields.join(', ')} WHERE facility_id = ?`;
  const res: any = await query(sql, params);
  return res.affectedRows > 0;
}
