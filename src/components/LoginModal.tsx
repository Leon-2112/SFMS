import React, { useState } from 'react';
import { User, Role } from '../types.ts';
import { api, setStoredAuth } from '../api.ts';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Wrench,
  GraduationCap,
} from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
  demoUsers: User[];
  initialMode?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onSuccess,
  demoUsers,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPendingApprovalError, setIsPendingApprovalError] = useState(false);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'MEMBER' | 'MAINTENANCE_STAFF'>('MEMBER');
  const [regDepartment, setRegDepartment] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccess, setRegSuccess] = useState<boolean>(false);
  const [regSuccessUser, setRegSuccessUser] = useState<any>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setIsPendingApprovalError(false);

    try {
      const res = await api.login(email.trim(), password);
      setStoredAuth(res.token, res.user);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      if (err.code === 'ACCOUNT_NOT_ACTIVE' && err.message?.includes('pending')) {
        setIsPendingApprovalError(true);
      }
      setErrorMsg(err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (u: User) => {
    setLoading(true);
    setErrorMsg(null);
    setIsPendingApprovalError(false);

    try {
      const res = await api.login(u.email, 'password123');
      setStoredAuth(res.token, res.user);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
        department: regDepartment.trim() || undefined,
        phone: regPhone.trim() || undefined,
      });

      setRegSuccess(true);
      setRegSuccessUser(res);
      setEmail(regEmail.trim());
      setPassword(regPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header with Tabs */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400" />
              {mode === 'login' ? 'Campus Portal Access' : 'Create SFMS Account'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'login'
                ? 'Sign in with institutional credentials or quick demo access'
                : 'New accounts require Athletics Administration approval before activation'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-bold">
          <button
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setRegSuccess(false);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            New User / Staff Registration
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex gap-2.5 items-start ${
                isPendingApprovalError
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {isPendingApprovalError ? (
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-bold">{isPendingApprovalError ? 'Registration Pending Admin Approval' : 'Access Restricted'}</p>
                <p className="text-[11px] mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* ======================= LOGIN VIEW ======================= */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* 1-Click Quick Demo Accounts */}
              <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Quick Demo Profiles (1-Click Authenticate)
                </p>
                <div className="space-y-1.5">
                  {demoUsers.map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => handleQuickSelect(u)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 text-xs text-left transition-colors"
                    >
                      <div>
                        <span className="font-bold text-white block">{u.full_name}</span>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-200 uppercase border border-slate-600">
                        {u.role.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Login Form */}
              <form onSubmit={handleCustomLogin} className="space-y-3 pt-1">
                <p className="text-xs font-bold text-slate-400">Or sign in with custom credentials:</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="name@campus.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    Need an account? Register here
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                    >
                      {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ======================= REGISTRATION VIEW ======================= */}
          {mode === 'register' && (
            <div>
              {regSuccess ? (
                <div className="p-6 rounded-2xl bg-slate-850 border border-emerald-500/40 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                    <Clock className="w-8 h-8 animate-pulse text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Registration Submitted!</h4>
                    <p className="text-xs text-emerald-300 font-semibold mt-1">
                      Awaiting Administrator Approval
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-left space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Applicant:</span>
                      <strong className="text-white">{regFullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Institutional Email:</span>
                      <strong className="text-white">{regEmail}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requested Role:</span>
                      <strong className="text-amber-400">{regRole.replace('_', ' ')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        PENDING APPROVAL
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Your account registration has been placed in the Athletic Directorate's approval queue.
                    Once an administrator verifies and activates your profile, you will be able to sign in immediately.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setRegSuccess(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Return to Sign In
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Role Selection Cards */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select Account Classification:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegRole('MEMBER')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          regRole === 'MEMBER'
                            ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className={`w-4 h-4 ${regRole === 'MEMBER' ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className="font-bold text-xs text-white">Campus Member</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Students, faculty, and university researchers</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('MAINTENANCE_STAFF')}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          regRole === 'MAINTENANCE_STAFF'
                            ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-md shadow-cyan-950/20 ring-1 ring-cyan-500'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Wrench className={`w-4 h-4 ${regRole === 'MAINTENANCE_STAFF' ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <span className="font-bold text-xs text-white">Maintenance Staff</span>
                        </div>
                        <p className="text-[11px] text-slate-400">Physical plant technicians and groundskeepers</p>
                      </button>
                    </div>
                  </div>

                  {/* Policy Notice */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>Administrator Approval Required:</strong> All new member and staff accounts are registered in <em>Pending Approval</em> state and will be activated only after verification by campus administrators.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name *</label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ananya Sharma"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          placeholder="ananya@campus.edu"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Department / Branch</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="e.g. Electrical Engineering"
                          value={regDepartment}
                          onChange={(e) => setRegDepartment(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Password (min 6 chars) *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Already registered? Sign In
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-700/20"
                      >
                        {loading ? 'Submitting...' : 'Submit for Approval'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
