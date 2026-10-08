import React, { useState } from 'react';
import { Lock, KeyRound, User, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function DoctorLogin({ onLoginSuccess, onBackToPatientView }) {
  const [loginMethod, setLoginMethod] = useState('pin'); // 'pin' | 'credentials'
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('doctor');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = loginMethod === 'pin' 
        ? { pin: pin.trim() }
        : { username: username.trim(), password };

      const res = await fetch('/api/auth/doctor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid doctor login credentials');
      }

      // Save token in sessionStorage
      sessionStorage.setItem('doctor_token', data.token);
      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-900 p-8 text-white text-center relative">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 backdrop-blur-md flex items-center justify-center text-teal-400 mx-auto shadow-lg mb-3">
            <Lock className="w-8 h-8" />
          </div>
          <span className="text-[11px] uppercase tracking-widest font-black text-teal-300">
            Authorized Personnel Only
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-1">Doctor Admin Portal</h2>
          <p className="text-xs text-slate-300 mt-1">
            Access appointment queue, slot schedules, and patient records
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 pb-2">
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => { setLoginMethod('pin'); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginMethod === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>Doctor PIN</span>
            </button>

            <button
              type="button"
              onClick={() => { setLoginMethod('credentials'); setError(null); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                loginMethod === 'credentials'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Username & Password</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === 'pin' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Doctor Security PIN
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 6-digit PIN"
                    className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 text-center tracking-widest font-mono font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                  Default PIN: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">782104</code> (Configurable in .env)
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">doctor</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Doctor@2026</code>
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Log In to Doctor Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to public link */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onBackToPatientView}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Patient Booking Page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
