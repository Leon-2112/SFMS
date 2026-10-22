import React, { useState, useEffect } from 'react';
import { Facility, Equipment, OperatingHour } from '../types.ts';
import { api } from '../api.ts';
import { formatCurrency } from '../utils/rules.ts';
import {
  X,
  MapPin,
  Users,
  Clock,
  Sparkles,
  Package,
  Calendar,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface VenueDetailModalProps {
  facility: Facility | null;
  onClose: () => void;
  onBook: (facility: Facility) => void;
  onCheckAvailability: (facility: Facility) => void;
}

export const VenueDetailModal: React.FC<VenueDetailModalProps> = ({
  facility,
  onClose,
  onBook,
  onCheckAvailability,
}) => {
  if (!facility) return null;

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.getFacility(facility.facility_id),
      api.getEquipment(facility.facility_id),
    ])
      .then(([facData, eqData]) => {
        if (isMounted) {
          if (facData && facData.operating_hours) {
            setOperatingHours(facData.operating_hours);
          }
          setEquipment(eqData || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load venue detail:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [facility.facility_id]);

  const isAvailable = facility.facility_status === 'ACTIVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner Image */}
        <div className="relative h-56 w-full bg-slate-950 overflow-hidden flex-shrink-0">
          {facility.image_url ? (
            <img
              src={facility.image_url}
              alt={facility.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-500 font-bold">
              Campus Athletic Facility
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Badges */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                {facility.sport_name}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700 backdrop-blur-md">
                {Boolean(facility.is_indoor) ? 'Indoor Facility' : 'Outdoor Facility'}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-lg border uppercase backdrop-blur-md ${
                  facility.facility_status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {facility.facility_status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{facility.name}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {facility.location}
            </p>
          </div>
        </div>

        {/* Scrollable Details */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Key Specs */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Hourly Rate</span>
              <span className="text-base font-extrabold text-emerald-400">
                {formatCurrency(Number(facility.hourly_rate))}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Venue Capacity</span>
              <span className="text-base font-extrabold text-white">{facility.capacity} persons</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Environment</span>
              <span className="text-base font-extrabold text-slate-200">
                {Boolean(facility.is_indoor) ? 'Climate Controlled' : 'Open Air'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">About This Venue</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {facility.description || 'Championship-grade campus athletic facility with regulation equipment and dedicated maintenance.'}
            </p>
          </div>

          {/* Operating Hours Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              Weekly Operating Schedule
            </h4>
            <div className="rounded-xl border border-slate-800 bg-slate-850 overflow-hidden">
              <div className="grid grid-cols-7 divide-x divide-slate-800 text-center text-xs">
                {daysOfWeek.map((day, idx) => {
                  const hour = operatingHours.find((h) => h.day_of_week === idx);
                  const openStr = hour ? hour.opens_at.substring(0, 5) : '06:00';
                  const closeStr = hour ? hour.closes_at.substring(0, 5) : '22:00';
                  return (
                    <div key={day} className="p-2.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        {day.substring(0, 3)}
                      </span>
                      <span className="text-[11px] font-semibold text-white block">{openStr}</span>
                      <span className="text-[10px] text-slate-500 block">to</span>
                      <span className="text-[11px] font-semibold text-white block">{closeStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Equipment Inventory */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              On-Site Equipment Assets ({equipment.length})
            </h4>
            {equipment.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No equipment stock registered for this venue.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {equipment.map((eq) => (
                  <div
                    key={eq.equipment_id}
                    className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{eq.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Tag: {eq.asset_tag}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 block">Qty: {eq.quantity}</span>
                      <span className="text-[9px] uppercase font-semibold text-slate-400">{eq.condition_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onCheckAvailability(facility);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            Check Availability
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              disabled={!isAvailable}
              onClick={() => {
                onClose();
                onBook(facility);
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAvailable ? 'Book This Venue' : 'Currently Unavailable'}
              {isAvailable && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
