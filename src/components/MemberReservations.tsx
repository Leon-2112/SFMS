import React, { useState } from 'react';
import { Booking } from '../types.ts';
import { api } from '../api.ts';
import { formatCurrency, formatDateTimeRange } from '../utils/rules.ts';
import { BookingConfirmationModal } from './BookingConfirmationModal.tsx';
import {
  CalendarCheck,
  Clock,
  MapPin,
  XCircle,
  AlertCircle,
  CheckCircle2,
  FileQuestion,
  Users,
  Sparkles,
  Receipt,
  Search,
} from 'lucide-react';

interface MemberReservationsProps {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
  onReportIssue: () => void;
}

export const MemberReservations: React.FC<MemberReservationsProps> = ({
  bookings,
  loading,
  onRefresh,
  onReportIssue,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Schedule conflict');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (filter !== 'ALL' && b.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchVenue = b.facility_name?.toLowerCase().includes(q);
      const matchSport = b.sport_name?.toLowerCase().includes(q);
      const matchPurpose = b.purpose?.toLowerCase().includes(q);
      const matchId = String(b.booking_id).includes(q);
      return matchVenue || matchSport || matchPurpose || matchId;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'CANCELLED':
        return 'bg-slate-700 text-slate-400 border-slate-600';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'COMPLETED':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancellingId) return;
    try {
      await api.cancelBooking(cancellingId, cancelReason);
      setActionMsg({ type: 'success', text: `Reservation #${cancellingId} cancelled. The time slot is now open.` });
      setShowCancelModal(false);
      setCancellingId(null);
      onRefresh();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to cancel reservation.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Sparkles className="w-4 h-4" />
            Member Self-Service
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">My Booking History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track active reservation requests, view approval notes, cancel eligible bookings, or view passes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReportIssue}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Report Issue
          </button>
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            Refresh List
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-white ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'PENDING', 'APPROVED', 'CANCELLED', 'REJECTED', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search venue, purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading your reservation history...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-850/50 border border-slate-800 p-8">
          <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Reservations Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'ALL' && !search
              ? 'You have not submitted any sports facility bookings yet.'
              : 'No bookings match your current filter or search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => {
            const canCancel = b.status === 'PENDING' || b.status === 'APPROVED';

            return (
              <div
                key={b.booking_id}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  {/* Top Bar: ID + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      Booking #{b.booking_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{b.facility_name}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mb-3">{b.sport_name}</p>

                  <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Time Window:
                      </span>
                      <span className="font-semibold text-white">
                        {formatDateTimeRange(b.start_at, b.end_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        Participants:
                      </span>
                      <span className="font-semibold text-white">{b.participant_count}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Price:</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(Number(b.total_price))}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Purpose:</span>
                      <span className="text-xs text-slate-200 italic">{b.purpose}</span>
                    </div>

                    {b.decision_note && (
                      <div className="pt-1.5 border-t border-slate-800 text-[11px]">
                        <span className="text-amber-400 font-bold block">Decision Note:</span>
                        <span className="text-slate-300">{b.decision_note}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedReceiptBooking(b)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    View Slip
                  </button>

                  {canCancel ? (
                    <button
                      onClick={() => {
                        setCancellingId(b.booking_id);
                        setShowCancelModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Booking
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No further actions</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              Confirm Booking Cancellation
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to cancel booking #{cancellingId}? The reservation status will update to CANCELLED and immediately free up the time slot.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for cancellation</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-md shadow-rose-600/20"
              >
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation / Slip Modal */}
      {selectedReceiptBooking && (
        <BookingConfirmationModal
          booking={selectedReceiptBooking}
          onClose={() => setSelectedReceiptBooking(null)}
        />
      )}
    </div>
  );
};
