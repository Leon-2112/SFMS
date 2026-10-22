import React, { useState } from 'react';
import { Facility, Booking } from '../types.ts';
import { api } from '../api.ts';
import { calculateBookingPrice, formatCurrency, isParticipantCountValid, formatDateTimeRange, toLocalDateString } from '../utils/rules.ts';
import { X, Calendar, Clock, Users, FileText, AlertCircle, ShieldAlert } from 'lucide-react';

interface BookingModalProps {
  facility: Facility | null;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ facility, onClose, onSuccess }) => {
  if (!facility) return null;

  // Default: tomorrow 10:00 to 11:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = toLocalDateString(tomorrow);
  const minDate = toLocalDateString(new Date());

  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [participantCount, setParticipantCount] = useState(Math.min(2, facility.capacity) || 1);
  const [purpose, setPurpose] = useState('Campus Recreation & Training');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conflictDetails, setConflictDetails] = useState<any[] | null>(null);

  // Quick preset helper
  const setQuickDuration = (minutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const startMins = h * 60 + (m || 0);
    const endMins = startMins + minutes;
    const endH = Math.floor(endMins / 60) % 24;
    const endM = endMins % 60;
    const formatted = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    setEndTime(formatted);
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const [sh, sm] = newStart.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const sMins = sh * 60 + (sm || 0);
    const eMins = eh * 60 + (em || 0);
    if (isNaN(eMins) || eMins <= sMins) {
      const nextMins = sMins + 60;
      const nextH = Math.floor(nextMins / 60) % 24;
      const nextM = nextMins % 60;
      setEndTime(`${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`);
    }
  };

  // Robust Price and Duration calculation
  let estimatedPrice = 0;
  let durationMinutes = 0;
  let invalidTimeOrder = false;

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
    invalidTimeOrder = true;
  } else {
    const sMinutes = sh * 60 + sm;
    const eMinutes = eh * 60 + em;
    if (sMinutes >= eMinutes) {
      invalidTimeOrder = true;
    } else {
      durationMinutes = eMinutes - sMinutes;
      estimatedPrice = Math.round(((durationMinutes / 60) * Number(facility.hourly_rate)) * 100) / 100;
    }
  }

  const isCapacityExceeded = !isParticipantCountValid(participantCount, facility.capacity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConflictDetails(null);

    if (invalidTimeOrder) {
      setErrorMsg('Start time must be strictly before end time.');
      return;
    }

    if (isCapacityExceeded) {
      setErrorMsg(`Participant count exceeds facility capacity of ${facility.capacity}.`);
      return;
    }

    if (!purpose.trim()) {
      setErrorMsg('Please state the purpose for this reservation.');
      return;
    }

    setLoading(true);
    try {
      const formattedStart = `${date} ${startTime}:00`;
      const formattedEnd = `${date} ${endTime}:00`;

      const booking = await api.createBooking({
        facility_id: facility.facility_id,
        start_at: formattedStart,
        end_at: formattedEnd,
        participant_count: Number(participantCount),
        purpose: purpose.trim(),
      });

      onSuccess(booking);
      onClose();
    } catch (err: any) {
      console.error('Booking submission error:', err);
      if (err.status === 409 || err.code === 'BOOKING_CONFLICT') {
        setErrorMsg(err.message || 'Time Collision: Conflicting reservation detected.');
        setConflictDetails(err.conflicts || []);
      } else {
        setErrorMsg(err.message || 'Failed to submit reservation request.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Reserve Facility
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{facility.name} ({facility.sport_name})</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Facility Specs summary pill */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Hourly Rate</span>
              <span className="font-bold text-emerald-400 text-sm">{formatCurrency(Number(facility.hourly_rate))}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Max Capacity</span>
              <span className="font-bold text-white text-sm">{facility.capacity} persons</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Type</span>
              <span className="font-bold text-slate-200 text-sm">{Boolean(facility.is_indoor) ? 'Indoor' : 'Outdoor'}</span>
            </div>
          </div>

          {/* Conflict Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                {conflictDetails && conflictDetails.length > 0 && (
                  <div className="mt-2 text-[11px] space-y-1 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
                    <p className="font-bold text-rose-200">Active Collisions in MySQL:</p>
                    {conflictDetails.map((c, i) => (
                      <p key={i} className="text-rose-300">
                        • Booking #{c.booking_id}: {formatDateTimeRange(c.start_at, c.end_at)} [{c.status}]
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reservation Date</label>
            <input
              type="date"
              required
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Time Interval Pickers + Quick Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Time Interval [start_at, end_at)</label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-1">Duration:</span>
                <button
                  type="button"
                  onClick={() => setQuickDuration(60)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700"
                >
                  1 hr
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDuration(90)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700"
                >
                  1.5 hrs
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDuration(120)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 border border-slate-700"
                >
                  2 hrs
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Start Time</span>
                <input
                  type="time"
                  required
                  step="900"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">End Time</span>
                <input
                  type="time"
                  required
                  step="900"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Participant Count & Purpose */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Participants
              </label>
              <input
                type="number"
                min="1"
                max={facility.capacity}
                required
                value={participantCount}
                onChange={(e) => setParticipantCount(Number(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border text-sm text-white focus:outline-none ${
                  isCapacityExceeded
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-700 focus:border-emerald-500'
                }`}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Purpose / Event</label>
              <input
                type="text"
                required
                placeholder="e.g. Club practice, friendly game"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Calculated Cost & Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Total Estimated Fee</span>
              <span className="text-base font-extrabold text-emerald-400">
                {invalidTimeOrder ? '--' : formatCurrency(estimatedPrice)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-300 block">
                {durationMinutes > 0 ? `${durationMinutes} minutes` : 'Invalid Range'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">[{startTime} - {endTime})</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || invalidTimeOrder || isCapacityExceeded}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
                loading || invalidTimeOrder || isCapacityExceeded
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:scale-[1.02]'
              }`}
            >
              {loading ? 'Processing Reservation...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
