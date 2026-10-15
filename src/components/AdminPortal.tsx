import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Booking, Facility, Equipment, MaintenanceReport, DashboardSummary, SportType, OperatingHour } from '../types.ts';
import { formatCurrency, formatDateTimeRange } from '../utils/rules.ts';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Wrench,
  BarChart3,
  Building,
  Package,
  Layers,
  Sparkles,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [subTab, setSubTab] = useState<'queue' | 'facilities' | 'equipment' | 'maintenance' | 'reports'>('queue');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [sports, setSports] = useState<SportType[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Analytics states
  const [statusStats, setStatusStats] = useState<any[]>([]);
  const [mostBooked, setMostBooked] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);

  // Modals
  const [decisionModal, setDecisionModal] = useState<{ booking: Booking; status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const [assignModal, setAssignModal] = useState<{ report: MaintenanceReport } | null>(null);
  const [assignedStaffId, setAssignedStaffId] = useState<number>(2);

  const [newFacilityModal, setNewFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    sport_type_id: 1,
    location: '',
    capacity: 10,
    hourly_rate: 400.0,
    is_indoor: true,
    description: '',
    image_url: '',
  });

  const [hoursModalFacility, setHoursModalFacility] = useState<Facility | null>(null);
  const [operatingHoursDraft, setOperatingHoursDraft] = useState<OperatingHour[]>([]);

  const [newEquipmentModal, setNewEquipmentModal] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState({
    facility_id: 1,
    asset_tag: '',
    name: '',
    quantity: 5,
    condition_status: 'GOOD' as const,
    notes: '',
  });

  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, f, eq, rep, staff, sp, sum] = await Promise.all([
        api.getAllBookings(),
        api.getFacilities(),
        api.getEquipment(),
        api.getMaintenanceReports(),
        api.getMaintenanceStaffList(),
        api.getSportTypes(),
        api.getDashboardSummary(),
      ]);
      setBookings(b);
      setFacilities(f);
      setEquipmentList(eq);
      setReports(rep);
      setStaffList(staff);
      setSports(sp);
      setSummary(sum);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [byStat, topFac, month, util] = await Promise.all([
        api.getBookingsByStatus(),
        api.getMostBookedFacilities(),
        api.getMonthlyVolume(),
        api.getUtilization(),
      ]);
      setStatusStats(byStat);
      setMostBooked(topFac);
      setMonthlyStats(month);
      setUtilization(util);
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadAnalytics();
  }, []);

  const handleDecisionSubmit = async () => {
    if (!decisionModal) return;
    try {
      await api.decideBooking(decisionModal.booking.booking_id, decisionModal.status, decisionNote);
      setMsg({ type: 'success', text: `Booking #${decisionModal.booking.booking_id} marked as ${decisionModal.status}.` });
      setDecisionModal(null);
      setDecisionNote('');
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to submit decision.' });
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignModal) return;
    try {
      await api.assignWorkOrder(assignModal.report.report_id, assignedStaffId);
      setMsg({ type: 'success', text: `Work order assigned to staff #${assignedStaffId}.` });
      setAssignModal(null);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to assign work order.' });
    }
  };

  const handleFacilityStatusToggle = async (facId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    try {
      await api.updateFacilityStatus(facId, nextStatus);
      setMsg({ type: 'success', text: `Facility #${facId} status updated to ${nextStatus}.` });
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update facility status.' });
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFacility(facilityForm);
      setMsg({ type: 'success', text: `New facility '${facilityForm.name}' created.` });
      setNewFacilityModal(false);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to create facility.' });
    }
  };

  const handleEditFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility) return;
    try {
      await api.updateFacility(editingFacility.facility_id, facilityForm);
      setMsg({ type: 'success', text: `Facility '${facilityForm.name}' updated successfully.` });
      setEditingFacility(null);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update facility.' });
    }
  };

  const openEditFacilityModal = (fac: Facility) => {
    setEditingFacility(fac);
    setFacilityForm({
      name: fac.name,
      sport_type_id: fac.sport_type_id,
      location: fac.location,
      capacity: fac.capacity,
      hourly_rate: Number(fac.hourly_rate),
      is_indoor: Boolean(fac.is_indoor),
      description: fac.description || '',
      image_url: fac.image_url || '',
    });
  };

  const openHoursModal = async (fac: Facility) => {
    setHoursModalFacility(fac);
    try {
      const full = await api.getFacility(fac.facility_id);
      if (full && full.operating_hours) {
        setOperatingHoursDraft(full.operating_hours);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveOperatingHours = async () => {
    if (!hoursModalFacility) return;
    try {
      await api.updateOperatingHours(hoursModalFacility.facility_id, operatingHoursDraft);
      setMsg({ type: 'success', text: `Operating schedule updated for ${hoursModalFacility.name}.` });
      setHoursModalFacility(null);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update operating hours.' });
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEquipment(equipmentForm);
      setMsg({ type: 'success', text: `New equipment asset '${equipmentForm.asset_tag}' registered.` });
      setNewEquipmentModal(false);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to add equipment.' });
    }
  };

  const confirmDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    try {
      await api.deleteEquipment(equipmentToDelete.equipment_id);
      setMsg({ type: 'success', text: `Equipment asset '${equipmentToDelete.asset_tag}' deleted.` });
      setEquipmentToDelete(null);
      loadData();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to delete equipment.' });
    }
  };

  // Export CSV safely using standard Blob
  const exportBookingsCSV = () => {
    const headers = ['Booking ID', 'Member', 'Email', 'Facility', 'Sport', 'Start', 'End', 'Participants', 'Total Price', 'Status', 'Purpose'];
    const rows = bookings.map((b) => [
      b.booking_id,
      `"${(b.member_name || '').replace(/"/g, '""')}"`,
      `"${(b.member_email || '').replace(/"/g, '""')}"`,
      `"${(b.facility_name || '').replace(/"/g, '""')}"`,
      `"${(b.sport_name || '').replace(/"/g, '""')}"`,
      `"${b.start_at}"`,
      `"${b.end_at}"`,
      b.participant_count,
      Number(b.total_price).toFixed(2),
      b.status,
      `"${(b.purpose || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sfms_bookings_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      {/* Admin Title & KPI Cards */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/30 border border-slate-700/80 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <ShieldCheck className="w-4 h-4" />
          Administrative Control Center
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">Campus Operations & Management</h2>
        <p className="text-xs text-slate-400 mt-1">
          Review reservations, configure venues, manage physical plant work orders, and analyze facility metrics.
        </p>

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Pending Requests</span>
              <span className="text-xl font-extrabold text-amber-400">{summary.pending_bookings}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Active Facilities</span>
              <span className="text-xl font-extrabold text-emerald-400">
                {summary.active_facilities} / {summary.total_facilities}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Est. Revenue</span>
              <span className="text-xl font-extrabold text-teal-400">
                {formatCurrency(Number(summary.total_revenue_estimate))}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Open Defects</span>
              <span className="text-xl font-extrabold text-rose-400">{summary.open_maintenance_issues}</span>
            </div>
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('queue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'queue'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Approvals Queue ({pendingBookings.length})
        </button>

        <button
          onClick={() => setSubTab('facilities')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'facilities'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Building className="w-3.5 h-3.5 text-emerald-400" />
          Facilities Manager ({facilities.length})
        </button>

        <button
          onClick={() => setSubTab('equipment')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'equipment'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-teal-400" />
          Equipment Inventory ({equipmentList.length})
        </button>

        <button
          onClick={() => setSubTab('maintenance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'maintenance'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 text-cyan-400" />
          Work Orders ({reports.length})
        </button>

        <button
          onClick={() => setSubTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'reports'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          Analytics & Reports
        </button>
      </div>

      {/* Subtab 1: Approvals Queue */}
      {subTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Pending Approval Queue</h3>
            <span className="text-xs text-slate-400">{pendingBookings.length} request(s) awaiting review</span>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-850/50 border border-slate-800">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-300">Queue Clear</p>
              <p className="text-xs text-slate-500 mt-1">There are no pending booking requests awaiting approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-850">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Booking #</th>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Facility</th>
                    <th className="py-3 px-4">Reserved Window</th>
                    <th className="py-3 px-4">Participants</th>
                    <th className="py-3 px-4">Est. Price</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {pendingBookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">#{b.booking_id}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{b.member_name || `User #${b.member_id}`}</span>
                        <span className="text-[11px] text-slate-400">{b.member_email}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{b.facility_name}</td>
                      <td className="py-3 px-4 text-slate-200">
                        {formatDateTimeRange(b.start_at, b.end_at)}
                      </td>
                      <td className="py-3 px-4">{b.participant_count}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{formatCurrency(Number(b.total_price))}</td>
                      <td className="py-3 px-4 text-slate-300 italic max-w-xs truncate">{b.purpose}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setDecisionModal({ booking: b, status: 'APPROVED' });
                              setDecisionNote('Approved per department guidelines.');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setDecisionModal({ booking: b, status: 'REJECTED' });
                              setDecisionNote('Facility allocated for campus athletic tournament.');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Facilities Manager */}
      {subTab === 'facilities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Campus Athletic Venues</h3>
            <button
              onClick={() => setNewFacilityModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Venue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((f) => (
              <div key={f.facility_id} className="p-4 rounded-xl bg-slate-850 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">{f.sport_name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      f.facility_status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : f.facility_status === 'MAINTENANCE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-600 text-slate-300 border-slate-500'
                    }`}
                  >
                    {f.facility_status}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{f.name}</h4>
                  <p className="text-xs text-slate-400">{f.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Capacity</span>
                    <strong>{f.capacity} persons</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Rate</span>
                    <strong className="text-emerald-400">{formatCurrency(Number(f.hourly_rate))}/hr</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => openEditFacilityModal(f)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 transition-colors"
                  >
                    <Edit className="w-3 h-3 text-emerald-400" />
                    Edit
                  </button>
                  <button
                    onClick={() => openHoursModal(f)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 transition-colors"
                  >
                    <Clock className="w-3 h-3 text-teal-400" />
                    Hours
                  </button>
                  <button
                    onClick={() => handleFacilityStatusToggle(f.facility_id, f.facility_status)}
                    className="text-slate-300 hover:text-amber-300 px-2 py-1 rounded bg-slate-800 hover:bg-slate-750 transition-colors text-[11px]"
                  >
                    Set {f.facility_status === 'ACTIVE' ? 'MAINT.' : 'ACTIVE'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Equipment Inventory */}
      {subTab === 'equipment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Equipment Assets & Condition</h3>
            <button
              onClick={() => setNewEquipmentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Equipment
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-850">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Asset Tag</th>
                  <th className="py-3 px-4">Equipment Name</th>
                  <th className="py-3 px-4">Venue Assignment</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {equipmentList.map((eq) => (
                  <tr key={eq.equipment_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-teal-300">{eq.asset_tag}</td>
                    <td className="py-3 px-4 font-bold text-white">{eq.name}</td>
                    <td className="py-3 px-4">{eq.facility_name}</td>
                    <td className="py-3 px-4 font-bold text-white">{eq.quantity}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          eq.condition_status === 'EXCELLENT'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : eq.condition_status === 'GOOD'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : eq.condition_status === 'FAIR'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {eq.condition_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic">{eq.notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEquipmentToDelete(eq)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Maintenance Work Orders */}
      {subTab === 'maintenance' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Facility Issue Reports & Work Order Dispatch</h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-850">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Report #</th>
                  <th className="py-3 px-4">Facility</th>
                  <th className="py-3 px-4">Title & Description</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Report Status</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4 text-right">Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {reports.map((r) => (
                  <tr key={r.report_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">#{r.report_id}</td>
                    <td className="py-3 px-4 font-bold text-white">{r.facility_name}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <span className="font-bold text-white block">{r.title}</span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">{r.description}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                          r.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : r.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {r.assigned_to_name ? (
                        <span className="font-semibold text-cyan-300">{r.assigned_to_name}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status !== 'RESOLVED' && r.status !== 'CLOSED' && (
                        <button
                          onClick={() => setAssignModal({ report: r })}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
                        >
                          Assign Technician
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 5: Analytics Reports */}
      {subTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">System Analytics & Utilization Reports</h3>
            <button
              onClick={exportBookingsCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export Bookings (CSV)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bookings by Status */}
            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700/80">
              <h4 className="text-sm font-bold text-white mb-3">Reservations by Status</h4>
              <div className="space-y-2.5">
                {statusStats.map((st) => (
                  <div key={st.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{st.status}</span>
                      <span className="text-slate-400">
                        <strong>{st.count}</strong> ({st.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          st.status === 'APPROVED'
                            ? 'bg-emerald-500'
                            : st.status === 'PENDING'
                            ? 'bg-amber-500'
                            : st.status === 'CANCELLED'
                            ? 'bg-slate-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${st.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Booked Facilities */}
            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700/80">
              <h4 className="text-sm font-bold text-white mb-3">Top Venues by Approved Reservations</h4>
              <div className="space-y-2">
                {mostBooked.slice(0, 5).map((mf, idx) => (
                  <div
                    key={mf.facility_id}
                    className="p-2.5 rounded-xl bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-700 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-white block">{mf.facility_name}</span>
                        <span className="text-[11px] text-slate-400">{mf.sport}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">{mf.approved_booking_count} bookings</span>
                      <span className="text-[10px] text-slate-500">{formatCurrency(Number(mf.total_revenue))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Facility Utilization Rate */}
          <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700/80">
            <h4 className="text-sm font-bold text-white mb-1">
              Facility Utilization Analysis (Booked Minutes / Operating Capacity)
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Calculates operational efficiency percentage against 112 weekly operating hours.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-700 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Facility</th>
                    <th className="py-2.5 px-3">Sport</th>
                    <th className="py-2.5 px-3">Booked Minutes</th>
                    <th className="py-2.5 px-3">Weekly Available</th>
                    <th className="py-2.5 px-3">Utilization %</th>
                    <th className="py-2.5 px-3">Capacity Gauge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {utilization.map((u) => (
                    <tr key={u.facility_id}>
                      <td className="py-2.5 px-3 font-bold text-white">{u.facility_name}</td>
                      <td className="py-2.5 px-3 text-emerald-400">{u.sport}</td>
                      <td className="py-2.5 px-3">{u.booked_minutes} mins</td>
                      <td className="py-2.5 px-3 text-slate-400">{u.weekly_available_minutes} mins</td>
                      <td className="py-2.5 px-3 font-bold text-teal-300">{u.utilization_percentage}%</td>
                      <td className="py-2.5 px-3 w-40">
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${Math.min(Number(u.utilization_percentage) * 5, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">
              Confirm Decision: Booking #{decisionModal.booking.booking_id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Mark reservation as <strong className="text-white">{decisionModal.status}</strong> for facility{' '}
              <strong className="text-emerald-300">{decisionModal.booking.facility_name}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Administrative Note</label>
              <input
                type="text"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Reason or authorization note"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDecisionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDecisionSubmit}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md ${
                  decisionModal.status === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                Confirm {decisionModal.status}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Assign Maintenance Work Order</h3>
            <p className="text-xs text-slate-400 mb-4">
              Report #{assignModal.report.report_id}: {assignModal.report.title}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Technician</label>
              <select
                value={assignedStaffId}
                onChange={(e) => setAssignedStaffId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {staffList.map((s) => (
                  <option key={s.user_id} value={s.user_id}>
                    {s.full_name} ({s.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
              >
                Assign Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Facility Modal */}
      {(newFacilityModal || editingFacility) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white mb-3">
              {editingFacility ? `Edit Venue: ${editingFacility.name}` : 'Add New Campus Venue'}
            </h3>
            <form onSubmit={editingFacility ? handleEditFacilitySubmit : handleCreateFacility} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Facility Name</label>
                <input
                  required
                  type="text"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Sport Category</label>
                <select
                  value={facilityForm.sport_type_id}
                  onChange={(e) => setFacilityForm({ ...facilityForm, sport_type_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {sports.map((sp) => (
                    <option key={sp.sport_type_id} value={sp.sport_type_id}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Campus Location</label>
                <input
                  required
                  type="text"
                  value={facilityForm.location}
                  onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Capacity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={facilityForm.capacity}
                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Hourly Rate (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.5"
                    min="0"
                    value={facilityForm.hourly_rate}
                    onChange={(e) => setFacilityForm({ ...facilityForm, hourly_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={facilityForm.image_url}
                  onChange={(e) => setFacilityForm({ ...facilityForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={facilityForm.description}
                  onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="indoorCheck"
                  checked={facilityForm.is_indoor}
                  onChange={(e) => setFacilityForm({ ...facilityForm, is_indoor: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="indoorCheck" className="text-xs text-slate-300">
                  Indoor Facility (Climate Controlled)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewFacilityModal(false);
                    setEditingFacility(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
                >
                  {editingFacility ? 'Update Venue' : 'Save Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Operating Hours Editor Modal */}
      {hoursModalFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Configure Operating Hours: {hoursModalFacility.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Set the opening and closing windows for each day of the week.
            </p>

            <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
              {daysOfWeek.map((dayName, idx) => {
                const hourRecord = operatingHoursDraft.find((h) => h.day_of_week === idx) || {
                  operating_hour_id: 0,
                  facility_id: hoursModalFacility.facility_id,
                  day_of_week: idx,
                  opens_at: '06:00:00',
                  closes_at: '22:00:00',
                };

                return (
                  <div key={dayName} className="flex items-center justify-between p-2 rounded-xl bg-slate-850 text-xs">
                    <span className="font-bold text-white w-28">{dayName}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hourRecord.opens_at.substring(0, 5)}
                        onChange={(e) => {
                          const newHours = [...operatingHoursDraft];
                          const existingIdx = newHours.findIndex((h) => h.day_of_week === idx);
                          if (existingIdx >= 0) {
                            newHours[existingIdx].opens_at = `${e.target.value}:00`;
                          } else {
                            newHours.push({
                              operating_hour_id: 0,
                              facility_id: hoursModalFacility.facility_id,
                              day_of_week: idx,
                              opens_at: `${e.target.value}:00`,
                              closes_at: '22:00:00',
                            });
                          }
                          setOperatingHoursDraft(newHours);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="time"
                        value={hourRecord.closes_at.substring(0, 5)}
                        onChange={(e) => {
                          const newHours = [...operatingHoursDraft];
                          const existingIdx = newHours.findIndex((h) => h.day_of_week === idx);
                          if (existingIdx >= 0) {
                            newHours[existingIdx].closes_at = `${e.target.value}:00`;
                          } else {
                            newHours.push({
                              operating_hour_id: 0,
                              facility_id: hoursModalFacility.facility_id,
                              day_of_week: idx,
                              opens_at: '06:00:00',
                              closes_at: `${e.target.value}:00`,
                            });
                          }
                          setOperatingHoursDraft(newHours);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setHoursModalFacility(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveOperatingHours}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Equipment Modal */}
      {newEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Register Equipment Asset</h3>
            <form onSubmit={handleCreateEquipment} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Asset Barcode / Tag</label>
                <input
                  required
                  placeholder="e.g. EQ-BB-105"
                  type="text"
                  value={equipmentForm.asset_tag}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, asset_tag: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Equipment Name</label>
                <input
                  required
                  placeholder="e.g. Regulation Game Balls"
                  type="text"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Assigned Venue</label>
                <select
                  value={equipmentForm.facility_id}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, facility_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  {facilities.map((fac) => (
                    <option key={fac.facility_id} value={fac.facility_id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Quantity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={equipmentForm.quantity}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Condition</label>
                  <select
                    value={equipmentForm.condition_status}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, condition_status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="FAIR">FAIR</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="NEEDS_REPAIR">NEEDS_REPAIR</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEquipmentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 shadow-md shadow-teal-600/20"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Equipment Confirmation Modal */}
      {equipmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Delete Equipment Asset?</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{equipmentToDelete.name}</strong> (Tag: <span className="font-mono text-emerald-400">{equipmentToDelete.asset_tag}</span>)? This action will remove the record from inventory.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEquipmentToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteEquipment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
