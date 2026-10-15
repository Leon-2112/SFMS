import React, { useState, useEffect } from 'react';
import { WorkOrder } from '../types.ts';
import { api } from '../api.ts';
import { formatDate, formatTime } from '../utils/rules.ts';
import { Wrench, CheckCircle2, AlertTriangle, Clock, MapPin, FileText, Check, Filter } from 'lucide-react';

export const StaffPortal: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<WorkOrder | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const orders = await api.getWorkOrders();
      setWorkOrders(orders);
    } catch (err: any) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const handleUpdate = async () => {
    if (!activeModal) return;
    try {
      await api.updateWorkOrderStatus(activeModal.work_order_id, selectedStatus, notes);
      setFeedbackMsg({ type: 'success', text: `Work order #${activeModal.work_order_id} updated to ${selectedStatus}.` });
      setActiveModal(null);
      loadWorkOrders();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update work order.' });
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredOrders = workOrders.filter((wo) => {
    if (filter === 'ALL') return true;
    return wo.status === filter;
  });

  const totalAssigned = workOrders.filter((w) => w.status === 'ASSIGNED').length;
  const totalInProgress = workOrders.filter((w) => w.status === 'IN_PROGRESS').length;
  const totalResolved = workOrders.filter((w) => w.status === 'RESOLVED' || w.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/30 border border-slate-700/80 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <Wrench className="w-4 h-4" />
          Campus Physical Plant Maintenance
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">Maintenance Technician Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1">
          Track work orders assigned to campus athletic venues, log technician diagnosis notes, and record resolution status.
        </p>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Pending Assignments</span>
            <span className="text-xl font-extrabold text-amber-400">{totalAssigned}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">In Progress</span>
            <span className="text-xl font-extrabold text-cyan-400">{totalInProgress}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Resolved / Completed</span>
            <span className="text-xl font-extrabold text-emerald-400">{totalResolved}</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800">
        <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          Filter:
        </span>
        {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === st
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading assigned work orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-850/50 border border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-cyan-500 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-bold text-slate-300">No Orders in this View</h4>
          <p className="text-xs text-slate-500 mt-1">There are currently no work orders matching status '{filter}'.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((wo) => (
            <div
              key={wo.work_order_id}
              className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-cyan-300">Work Order #{wo.work_order_id}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(wo.report_severity)}`}>
                      {wo.report_severity}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-200 border border-slate-600 uppercase">
                      {wo.status}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{wo.facility_name}</h4>
                <p className="text-xs font-semibold text-amber-300 mb-3">{wo.report_title}</p>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Technician:</span>
                    <span className="font-semibold text-white">{wo.assigned_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Date:</span>
                    <span className="font-mono text-slate-300">
                      {wo.assigned_at ? `${formatDate(wo.assigned_at)} ${formatTime(wo.assigned_at)}` : '—'}
                    </span>
                  </div>
                  {wo.resolution_notes && (
                    <div className="pt-1.5 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400 block font-semibold">Technician Notes:</span>
                      <span className="text-xs text-cyan-200 italic">{wo.resolution_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Report #{wo.report_id}</span>
                <button
                  onClick={() => {
                    setActiveModal(wo);
                    setSelectedStatus(wo.status === 'ASSIGNED' ? 'IN_PROGRESS' : wo.status);
                    setNotes(wo.resolution_notes || '');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  Update Progress
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Work Order Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Update Work Order #{activeModal.work_order_id}</h3>
            <p className="text-xs text-slate-400 mb-4">{activeModal.facility_name}: {activeModal.report_title}</p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED (Complete)</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record parts replaced, test cycles executed, or current diagnostic state"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
