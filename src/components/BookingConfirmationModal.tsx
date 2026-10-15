import React from 'react';
import { Booking } from '../types.ts';
import { formatCurrency, formatDate, formatTime } from '../utils/rules.ts';
import { X, CheckCircle2, Calendar, Clock, MapPin, Users, DollarSign, Printer, Download } from 'lucide-react';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({ booking, onClose }) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-950 to-slate-900 border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-white">Campus Reservation Slip</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">Reference ID: #{booking.booking_id}</p>
        </div>

        {/* Slip Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <span className="text-slate-400">Venue:</span>
              <span className="font-bold text-white text-sm">{booking.facility_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sport Category:</span>
              <span className="font-semibold text-emerald-400">{booking.sport_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Scheduled Date:</span>
              <span className="font-semibold text-white">{formatDate(booking.start_at)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Time Interval:</span>
              <span className="font-mono font-bold text-teal-300">
                {formatTime(booking.start_at)} → {formatTime(booking.end_at)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Participants:</span>
              <span className="font-semibold text-white">{booking.participant_count} persons</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <span className="text-slate-400 font-bold">Total Price:</span>
              <span className="font-black text-emerald-400 text-base">
                {formatCurrency(Number(booking.total_price))}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Booking Status:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  booking.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : booking.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 block mb-0.5">Purpose:</span>
            <span className="italic">{booking.purpose}</span>
          </div>

          <div className="text-center pt-2">
            <div className="inline-block p-2 rounded-lg bg-white border border-slate-300">
              {/* Clean decorative barcode representation */}
              <div className="flex items-center gap-0.5 h-7">
                {[4, 2, 6, 2, 8, 3, 5, 2, 7, 4, 3, 6, 2, 8, 4, 3, 6, 2, 5, 4, 7, 2, 4].map((w, idx) => (
                  <div key={idx} className="bg-black h-full" style={{ width: `${w}px` }} />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">AUTH-CODE-SFMS-{booking.booking_id}-2026</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
