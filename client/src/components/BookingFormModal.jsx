import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, AlertCircle, X, ShieldAlert, Check } from 'lucide-react';

export default function BookingFormModal({ slot, dateStr, doctor, onClose, onBookingSuccess }) {
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    age: '',
    gender: 'Male',
    visitType: 'First Visit',
    reason: ''
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Phone must be strictly 10 numeric digits starting with 6, 7, 8, 9
  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.patientPhone);

  // Email format validation (optional, but must be valid if entered)
  const emailTrimmed = formData.patientEmail.trim();
  const isEmailValid = !emailTrimmed || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailTrimmed);

  const handlePhoneChange = (e) => {
    // Only allow numeric digits and restrict strictly to 10 numbers
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, patientPhone: digitsOnly });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPhoneTouched(true);
    setEmailTouched(true);

    // Everything is mandatory EXCEPT email
    if (!formData.patientName.trim()) {
      setError('Patient Full Name is mandatory.');
      return;
    }

    if (!formData.patientPhone || formData.patientPhone.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!isPhoneValid) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!formData.age || Number(formData.age) < 1 || Number(formData.age) > 120) {
      setError('Patient Age is mandatory (must be between 1 and 120 years).');
      return;
    }

    if (!formData.gender) {
      setError('Patient Gender is mandatory.');
      return;
    }

    if (!formData.visitType) {
      setError('Visit Type is mandatory.');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Symptoms / Reason for visit is mandatory.');
      return;
    }

    // Email is optional, but if entered, must satisfy standard email format
    if (emailTrimmed && !isEmailValid) {
      setError('Please enter a valid email address format (e.g. name@example.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          patientName: formData.patientName.trim(),
          patientPhone: formData.patientPhone.trim(),
          patientEmail: emailTrimmed,
          age: Number(formData.age),
          reason: formData.reason.trim(),
          date: dateStr,
          timeSlot: slot.time
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      onBookingSuccess(data.appointment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Confirm Your Appointment</h2>
              <p className="text-xs text-teal-100">Step 2: Enter Patient Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Slot Summary Bar */}
        <div className="bg-teal-50 border-b border-teal-100 px-6 py-3 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Time: <strong>{slot.time}</strong> ({dateStr})</span>
          </div>
          <span className="font-semibold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
            {slot.periodCategory} Slot
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Name - Mandatory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* 10-Digit Mobile Number & Optional Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
                <span className="text-[10px] text-slate-400 font-normal ml-1">(10 digits only)</span>
              </label>
              <div className="relative flex rounded-xl border border-slate-300 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 overflow-hidden">
                <span className="inline-flex items-center px-2.5 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 gap-1 select-none">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </span>
                <input
                  type="tel"
                  required
                  value={formData.patientPhone}
                  onChange={handlePhoneChange}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm focus:outline-hidden font-mono font-medium tracking-wide"
                />
              </div>
              {phoneTouched && (!formData.patientPhone || formData.patientPhone.length !== 10 || !isPhoneValid) && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Must be exactly 10 digits starting with 6-9</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
              {emailTouched && emailTrimmed && !isEmailValid && (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Please enter a valid email format</span>
                </p>
              )}
            </div>
          </div>

          {/* Age (Mandatory) & Gender (Mandatory) & Visit Type (Mandatory) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Years"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-2 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Visit Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.visitType}
                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                className="w-full px-2 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white font-medium"
              >
                <option value="First Visit">First Visit</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Routine Review">Routine</option>
              </select>
            </div>
          </div>

          {/* Symptoms / Chief Complaint - Mandatory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Symptoms / Reason for Visit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                rows={2}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Mild fever, dry cough for 2 days, seasonal allergy..."
                className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none font-medium"
              ></textarea>
            </div>
          </div>

          {/* Fee & Emergency Notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Consultation fee is payable at the clinic counter (<strong>{doctor?.consultationFee || '₹500 / Consultation'}</strong>).
            </span>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Confirming Slot...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
