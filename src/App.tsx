import React, { useState, useEffect } from 'react';
import { User, Facility, Booking, SportType } from './types.ts';
import { api, getStoredUser, setStoredAuth, clearStoredAuth } from './api.ts';
import { Navbar } from './components/Navbar.tsx';
import { FacilityCard } from './components/FacilityCard.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { BookingConfirmationModal } from './components/BookingConfirmationModal.tsx';
import { AvailabilityModal } from './components/AvailabilityModal.tsx';
import { VenueDetailModal } from './components/VenueDetailModal.tsx';
import { MemberReservations } from './components/MemberReservations.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { StaffPortal } from './components/StaffPortal.tsx';
import { ReportIssueModal } from './components/ReportIssueModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import {
  Search,
  Filter,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  Home,
  Check,
  Sun,
  Warehouse,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('facilities');

  // Facilities catalog & filters
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [sportTypes, setSportTypes] = useState<SportType[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<number | undefined>(undefined);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'ALL' | 'INDOOR' | 'OUTDOOR'>('ALL');
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState<'ALL' | 'SMALL' | 'MEDIUM' | 'LARGE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);

  // Member reservations
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState<boolean>(false);

  // Modal triggers
  const [bookingFacility, setBookingFacility] = useState<Facility | null>(null);
  const [availabilityFacility, setAvailabilityFacility] = useState<Facility | null>(null);
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [reportIssueFacility, setReportIssueFacility] = useState<Facility | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // 1. Initial Load: Demo users and default login
  useEffect(() => {
    api
      .getDemoUsers()
      .then(async (users) => {
        setDemoUsers(users);
        const stored = getStoredUser();
        if (stored) {
          setCurrentUser(stored);
        } else if (users.length > 0) {
          // Default to Member "Sarah Chen" (user_id 4)
          const defaultUser = users.find((u) => u.email === 'member@campus.edu') || users[0];
          try {
            const authRes = await api.login(defaultUser.email, 'password123');
            setStoredAuth(authRes.token, authRes.user);
            setCurrentUser(authRes.user);
          } catch {
            setCurrentUser(defaultUser);
          }
        }
      })
      .catch((err) => console.error('Demo users load failed:', err));

    api
      .getSportTypes()
      .then((sp) => setSportTypes(sp))
      .catch((err) => console.error('Sport types load failed:', err));
  }, []);

  // 2. Fetch facilities
  const fetchFacilities = () => {
    setLoadingFacilities(true);
    api
      .getFacilities(selectedSportId, searchQuery)
      .then((data) => {
        setFacilities(data);
        setLoadingFacilities(false);
      })
      .catch((err) => {
        console.error('Facilities fetch error:', err);
        setLoadingFacilities(false);
      });
  };

  useEffect(() => {
    fetchFacilities();
  }, [selectedSportId, searchQuery]);

  // 3. Fetch member reservations
  const fetchMyBookings = () => {
    if (!currentUser) return;
    setLoadingBookings(true);
    api
      .getMyBookings()
      .then((data) => {
        setMyBookings(data);
        setLoadingBookings(false);
      })
      .catch((err) => {
        console.error('Bookings fetch error:', err);
        setLoadingBookings(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'reservations') {
      fetchMyBookings();
    }
  }, [activeTab, currentUser]);

  const handleSwitchUser = async (user: User) => {
    try {
      const res = await api.login(user.email, 'password123');
      setStoredAuth(res.token, res.user);
      setCurrentUser(res.user);
      showToast(`Switched active profile to ${res.user.full_name} (${res.user.role})`);
      if (res.user.role === 'ADMIN' && activeTab === 'staff') {
        setActiveTab('admin');
      } else if (res.user.role === 'MAINTENANCE_STAFF') {
        setActiveTab('staff');
      } else if (res.user.role === 'MEMBER' && (activeTab === 'admin' || activeTab === 'staff')) {
        setActiveTab('facilities');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to switch user', 'error');
    }
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
    showToast('Signed out of campus session.');
    setShowLoginModal(true);
  };

  // Filter facilities by Environment and Capacity
  const filteredFacilities = facilities.filter((fac) => {
    if (selectedEnvironment === 'INDOOR' && !Boolean(fac.is_indoor)) return false;
    if (selectedEnvironment === 'OUTDOOR' && Boolean(fac.is_indoor)) return false;

    if (selectedCapacityFilter === 'SMALL' && fac.capacity > 10) return false;
    if (selectedCapacityFilter === 'MEDIUM' && (fac.capacity < 11 || fac.capacity > 25)) return false;
    if (selectedCapacityFilter === 'LARGE' && fac.capacity <= 25) return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        onSwitchUser={handleSwitchUser}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        demoUsers={demoUsers}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: FACILITIES CATALOG */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            {/* Hero & Search Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/30 border border-slate-700/80 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    Campus Athletic Complexes & Arenas
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                    Sports Venues & Facility Booking
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Discover Olympic pools, basketball courts, badminton halls, and tennis grounds. Reserve time slots with live availability checks.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search venue or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Sport Category Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  Sport:
                </span>
                <button
                  onClick={() => setSelectedSportId(undefined)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSportId === undefined
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
                  }`}
                >
                  All Sports
                </button>
                {sportTypes.map((sp) => (
                  <button
                    key={sp.sport_type_id}
                    onClick={() => setSelectedSportId(sp.sport_type_id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedSportId === sp.sport_type_id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
                    }`}
                  >
                    {sp.name}
                  </button>
                ))}
              </div>

              {/* Secondary Filter: Environment (Indoor/Outdoor) & Capacity */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/60 text-xs">
                {/* Environment Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-semibold">Environment:</span>
                  <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
                    <button
                      onClick={() => setSelectedEnvironment('ALL')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                        selectedEnvironment === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedEnvironment('INDOOR')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        selectedEnvironment === 'INDOOR' ? 'bg-slate-700 text-emerald-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Warehouse className="w-3 h-3" />
                      Indoor
                    </button>
                    <button
                      onClick={() => setSelectedEnvironment('OUTDOOR')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                        selectedEnvironment === 'OUTDOOR' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      Outdoor
                    </button>
                  </div>
                </div>

                {/* Capacity Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px] font-semibold">Capacity:</span>
                  <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
                    <button
                      onClick={() => setSelectedCapacityFilter('ALL')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        selectedCapacityFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Any
                    </button>
                    <button
                      onClick={() => setSelectedCapacityFilter('SMALL')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        selectedCapacityFilter === 'SMALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1–10
                    </button>
                    <button
                      onClick={() => setSelectedCapacityFilter('MEDIUM')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        selectedCapacityFilter === 'MEDIUM' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      11–25
                    </button>
                    <button
                      onClick={() => setSelectedCapacityFilter('LARGE')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        selectedCapacityFilter === 'LARGE' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      26+
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Facilities Grid */}
            {loadingFacilities ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Loading campus sports venues...
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="py-20 text-center rounded-2xl bg-slate-850/50 border border-slate-800 p-8">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">No Facilities Match Your Filters</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting the sport, environment, or capacity filters above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFacilities.map((fac) => (
                  <FacilityCard
                    key={fac.facility_id}
                    facility={fac}
                    onBook={(f) => setBookingFacility(f)}
                    onCheckAvailability={(f) => setAvailabilityFacility(f)}
                    onViewDetails={(f) => setDetailFacility(f)}
                    onReportIssue={(f) => {
                      setReportIssueFacility(f);
                      setShowReportModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY RESERVATIONS (MEMBER) */}
        {activeTab === 'reservations' && (
          <MemberReservations
            bookings={myBookings}
            loading={loadingBookings}
            onRefresh={fetchMyBookings}
            onReportIssue={() => {
              setReportIssueFacility(null);
              setShowReportModal(true);
            }}
          />
        )}

        {/* TAB 3: ADMIN OPERATIONS (ADMIN) */}
        {activeTab === 'admin' && <AdminPortal />}

        {/* TAB 4: WORK ORDERS (MAINTENANCE STAFF) */}
        {activeTab === 'staff' && <StaffPortal />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            &copy; 2026 Sports Facilities Management System (SFMS) • Campus Athletics & Physical Plant
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Campus Timezone: America/Los_Angeles</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {bookingFacility && (
        <BookingModal
          facility={bookingFacility}
          onClose={() => setBookingFacility(null)}
          onSuccess={(newBooking) => {
            showToast(`Reservation request #${newBooking.booking_id} submitted successfully!`);
            setConfirmedBooking(newBooking);
            fetchMyBookings();
            fetchFacilities();
          }}
        />
      )}

      {availabilityFacility && (
        <AvailabilityModal
          facility={availabilityFacility}
          onClose={() => setAvailabilityFacility(null)}
          onBookSlot={(f) => {
            setAvailabilityFacility(null);
            setBookingFacility(f);
          }}
        />
      )}

      {detailFacility && (
        <VenueDetailModal
          facility={detailFacility}
          onClose={() => setDetailFacility(null)}
          onBook={(f) => {
            setDetailFacility(null);
            setBookingFacility(f);
          }}
          onCheckAvailability={(f) => {
            setDetailFacility(null);
            setAvailabilityFacility(f);
          }}
        />
      )}

      {showReportModal && (
        <ReportIssueModal
          facilities={facilities}
          preselectedFacility={reportIssueFacility}
          onClose={() => {
            setShowReportModal(false);
            setReportIssueFacility(null);
          }}
          onSuccess={() => {
            showToast('Maintenance defect report logged and registered.');
          }}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            showToast(`Welcome, ${u.full_name} (${u.role})!`);
          }}
          demoUsers={demoUsers}
        />
      )}

      {confirmedBooking && (
        <BookingConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </div>
  );
}
