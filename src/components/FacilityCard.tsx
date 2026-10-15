import React from 'react';
import { Facility } from '../types.ts';
import { Users, Clock, MapPin, Sparkles, AlertTriangle, Calendar, Info } from 'lucide-react';
import { formatCurrency } from '../utils/rules.ts';

interface FacilityCardProps {
  facility: Facility;
  onBook: (facility: Facility) => void;
  onCheckAvailability: (facility: Facility) => void;
  onViewDetails: (facility: Facility) => void;
  onReportIssue?: (facility: Facility) => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  onBook,
  onCheckAvailability,
  onViewDetails,
  onReportIssue,
}) => {
  const isAvailable = facility.facility_status === 'ACTIVE';

  return (
    <div className="group rounded-2xl bg-slate-800/80 border border-slate-700/80 overflow-hidden hover:border-slate-600 transition-all duration-300 flex flex-col shadow-lg shadow-black/20 hover:shadow-emerald-950/20">
      {/* Venue Header Image / Banner */}
      <div
        onClick={() => onViewDetails(facility)}
        className="relative h-44 w-full bg-slate-950 overflow-hidden cursor-pointer"
      >
        {facility.image_url ? (
          <img
            src={facility.image_url}
            alt={facility.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-600 font-bold">
            Campus Venue
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-md shadow-md ${
              facility.facility_status === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : facility.facility_status === 'MAINTENANCE'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
            }`}
          >
            {facility.facility_status}
          </span>
        </div>

        {/* Sport Type Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900/80 text-white border border-slate-700 backdrop-blur-md flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {facility.sport_name}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-300 border border-slate-800 backdrop-blur-md">
            {Boolean(facility.is_indoor) ? 'Indoor' : 'Outdoor'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={() => onViewDetails(facility)}
            className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {facility.name}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{facility.location}</span>
          </p>

          <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
            {facility.description || 'Modern campus athletic venue with regulation flooring and dedicated maintenance.'}
          </p>
        </div>

        {/* Specifications & Price */}
        <div className="mt-5 pt-4 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs mb-4">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Cap: <strong className="text-white">{facility.capacity}</strong> persons</span>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-400">
                {formatCurrency(Number(facility.hourly_rate))}
              </span>
              <span className="text-slate-400 text-[11px]"> / hour</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onViewDetails(facility)}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Details
            </button>
            <button
              onClick={() => onCheckAvailability(facility)}
              className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600/50 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              Schedule
            </button>
            <button
              disabled={!isAvailable}
              onClick={() => onBook(facility)}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-700/20 hover:scale-[1.02]'
                  : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-800'
              }`}
            >
              {isAvailable ? 'Book' : 'Closed'}
            </button>
          </div>

          {onReportIssue && (
            <button
              onClick={() => onReportIssue(facility)}
              className="w-full mt-2.5 text-[11px] text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1 py-1 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              Report Facility Issue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
