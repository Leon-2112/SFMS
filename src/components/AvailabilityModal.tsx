import React, { useState, useEffect } from 'react';
import { Facility } from '../types.ts';
import { api } from '../api.ts';
import { formatTime, formatCurrency } from '../utils/rules.ts';
import { X, Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface AvailabilityModalProps {
  facility: Facility | null;
  onClose: () => void;
  onBookSlot: (facility: Facility) => void;
}

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  facility,
  onClose,
  onBookSlot,
}) => {
  if (!facility) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<any>(null);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    api
      .getFacilityAvailability(facility.facility_id, selectedDate)
      .then((data) => {
        if (isCurrent) {
          setAvailabilityData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching availability:', err);
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [facility.facility_id, selectedDate]);

  // Operating windows: typically 06:00 to 22:00
  const hours = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              Facility Schedule & Availability
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {facility.name} • Half-Open Interval Check [start_at, end_at)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-slate-800 bg-slate-850 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">View Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60" />
              <span className="text-slate-300 text-[11px]">Free Slot</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60" />
              <span className="text-slate-300 text-[11px]">Pending Request</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/60" />
              <span className="text-slate-300 text-[11px]">Approved Reservation</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Querying active reservations in MySQL...
            </div>
          ) : (
            <>
              {/* Active reservations list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Active Reservations for {selectedDate} ({availabilityData?.reserved_slots?.length || 0})
                </h4>

                {availabilityData?.reserved_slots?.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    All operating hours are completely open for reservation on this date!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availabilityData?.reserved_slots?.map((slot: any) => (
                      <div
                        key={slot.booking_id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          slot.status === 'APPROVED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="font-bold text-white">
                              {formatTime(slot.start_at)} – {formatTime(slot.end_at)}
                            </span>
                            <span className="text-slate-400 text-[11px] ml-2">
                              ({slot.purpose || 'Campus Event'})
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            slot.status === 'APPROVED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {slot.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Operating hours note */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                <Clock className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-300">Standard Operating Schedule</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Daily open hours: 06:00:00 to 22:00:00. Adjacent reservations (e.g., 09:00 - 10:00 and 10:00 - 11:00)
                    are accepted because half-open intervals [s, e) do not collide at endpoints.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <span className="text-xs text-slate-400">
            Rate: <strong className="text-emerald-400">{formatCurrency(Number(facility.hourly_rate))}/hr</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookSlot(facility);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
            >
              Request Booking
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
