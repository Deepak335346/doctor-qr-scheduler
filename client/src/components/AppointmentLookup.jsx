import React, { useState } from 'react';
import { Search, X, Clock, AlertCircle } from 'lucide-react';

export default function AppointmentLookup({ doctor, onClose }) {
  const [appointmentId, setAppointmentId] = useState('');
  const [phone, setPhone] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!appointmentId.trim() || !phone.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setAppointment(null);

    try {
      const res = await fetch('/api/appointments/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentId.trim(),
          phone: phone.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No appointment found matching these details.');
      }

      setAppointment(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold">Find Your Appointment Pass</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Enter your Booking Reference ID and the 10-digit Indian mobile number provided during booking to retrieve your pass.
          </p>

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Booking Reference ID *
              </label>
              <input
                type="text"
                required
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="e.g. APT-8823"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Mobile Number *
              </label>
              <div className="relative flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-teal-500 overflow-hidden">
                <span className="inline-flex items-center px-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 gap-1 select-none">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  maxLength={15}
                  className="w-full px-3 py-2 text-sm focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? 'Verifying Details...' : 'Lookup My Appointment'}
            </button>
          </form>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Found Appointment Card */}
          {appointment && (
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-teal-900 bg-teal-100 px-2.5 py-0.5 rounded-md">
                  {appointment.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  appointment.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : appointment.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : appointment.status === 'in_consultation'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-teal-100 text-teal-800'
                }`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <p className="font-extrabold text-slate-900 text-base">{appointment.patientName}</p>
                <div className="flex items-center gap-3 text-slate-700 mt-1">
                  <span className="flex items-center gap-1 font-semibold text-teal-700">
                    <Clock className="w-3.5 h-3.5" />
                    {appointment.date} at {appointment.timeSlot}
                  </span>
                  <span className="font-bold text-teal-900 bg-teal-100/70 px-2 py-0.5 rounded">
                    Queue Token #{String(appointment.tokenNumber).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">
                  Chamber: {doctor?.chamber} • {doctor?.clinicName}
                </p>
                {appointment.reason && (
                  <p className="text-slate-600 italic mt-1">
                    Reason: "{appointment.reason}"
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
