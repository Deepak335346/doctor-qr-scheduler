import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, MapPin, ArrowLeft, AlertCircle, XCircle, Printer, Plus } from 'lucide-react';
import BookingConfirmationModal from './BookingConfirmationModal';

export default function MyBookingsPage({ doctor, onBackToBooking }) {
  const [phone, setPhone] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('phone') || localStorage.getItem('patient_phone') || '';
  });
  const [searchedPhone, setSearchedPhone] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [selectedPass, setSelectedPass] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  // Search bookings for phone
  const fetchMyBookings = async (phoneToSearch) => {
    if (!phoneToSearch || phoneToSearch.trim().length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/patient/my-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToSearch.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve bookings.');
      }

      setAppointments(data.appointments || []);
      setSearchedPhone(data.phone || phoneToSearch);
      localStorage.setItem('patient_phone', phoneToSearch.trim());
    } catch (err) {
      setError(err.message);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if phone is already set on mount
  useEffect(() => {
    if (phone && phone.trim().length >= 10) {
      fetchMyBookings(phone);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMyBookings(phone);
  };

  // Handle patient cancellation
  const handleCancelBooking = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment slot?')) {
      return;
    }

    setCancelLoadingId(apptId);

    try {
      const res = await fetch('/api/patient/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apptId,
          phone: searchedPhone || phone
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel appointment');
      }

      // Update state locally
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      alert(err.message);
    } finally {
      setCancelLoadingId(null);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') return a.status === 'booked' || a.status === 'checked_in' || a.status === 'in_consultation';
    if (statusFilter === 'completed') return a.status === 'completed';
    if (statusFilter === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  const upcomingCount = appointments.filter(a => a.status === 'booked' || a.status === 'checked_in' || a.status === 'in_consultation').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToBooking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-teal-600" />
          <span>Back to Slot Booking</span>
        </button>

        <button
          onClick={onBackToBooking}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Slot</span>
        </button>
      </div>

      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Appointments & Booking History
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered mobile number to view active tokens, past visits, or download digital passes.
            </p>
          </div>
        </div>

        {/* Phone Lookup Input Bar */}
        <form onSubmit={handleSearchSubmit} className="pt-2">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 flex rounded-2xl border border-slate-300 focus-within:ring-2 focus-within:ring-teal-500 overflow-hidden shadow-2xs">
              <span className="inline-flex items-center px-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 gap-1.5 select-none">
                <span>🇮🇳</span>
                <span>+91</span>
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s+-]/g, ''))}
                placeholder="Enter 10-digit Indian Mobile Number (e.g. 98765 43210)"
                maxLength={15}
                className="w-full px-3.5 py-3 text-sm focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-teal-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Searching...' : 'Find My Bookings'}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {searchedPhone && (
        <div className="space-y-4">
          {/* Status Filter Tabs & Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs text-slate-600">
              Showing bookings for: <strong className="text-slate-900 font-mono">{searchedPhone}</strong>
            </div>

            <div className="flex gap-1.5 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({appointments.length})
              </button>

              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'upcoming' ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>

              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed ({completedCount})
              </button>

              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === 'cancelled' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>
          </div>

          {/* Appointments Cards List */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No Bookings Found in this Category</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {statusFilter === 'all'
                  ? `No previous bookings found for ${searchedPhone}. You can book a new slot anytime.`
                  : `No ${statusFilter} appointments found for this mobile number.`}
              </p>
              <button
                onClick={onBackToBooking}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Book an Appointment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appt) => {
                const isUpcoming = appt.status === 'booked' || appt.status === 'checked_in' || appt.status === 'in_consultation';

                return (
                  <div
                    key={appt.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-2xs hover:shadow-sm ${
                      isUpcoming ? 'border-teal-300 ring-2 ring-teal-50' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Token & Booking Details */}
                      <div className="flex items-start gap-4">
                        {/* Token Badge */}
                        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] uppercase font-bold text-teal-600">Token</span>
                          <span className="text-2xl font-black text-teal-900 leading-tight">
                            #{String(appt.tokenNumber).padStart(2, '0')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                              {appt.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              appt.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : appt.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : appt.status === 'in_consultation'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse'
                                : appt.status === 'checked_in'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-teal-100 text-teal-800 border border-teal-200'
                            }`}>
                              {appt.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              • {appt.visitType}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-slate-900 text-base mt-1">
                            {appt.patientName} {appt.age ? `(${appt.age} yrs, ${appt.gender})` : ''}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                            <span className="flex items-center gap-1 font-bold text-teal-800">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              {appt.date} at {appt.timeSlot}
                            </span>
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {doctor?.chamber} • {doctor?.clinicName}
                            </span>
                          </div>

                          {appt.reason && (
                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                              <strong className="text-slate-500">Reason:</strong> "{appt.reason}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          onClick={() => setSelectedPass(appt)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Digital Pass</span>
                        </button>

                        {isUpcoming && (
                          <button
                            onClick={() => handleCancelBooking(appt.id)}
                            disabled={cancelLoadingId === appt.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{cancelLoadingId === appt.id ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Digital Pass Modal (Reopened when patient clicks View Digital Pass) */}
      {selectedPass && (
        <BookingConfirmationModal
          appointment={selectedPass}
          doctor={doctor}
          onClose={() => setSelectedPass(null)}
        />
      )}
    </div>
  );
}
