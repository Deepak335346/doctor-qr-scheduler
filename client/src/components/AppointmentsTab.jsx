import React, { useState, useEffect } from 'react';
import { Calendar, Search, UserCheck, Play, CheckCircle2, XCircle, Clock, Plus, Phone, FileText } from 'lucide-react';
import { authFetch } from '../utils/api.js';

export default function AppointmentsTab({ selectedDate, setSelectedDate }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeNotesId, setActiveNotesId] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInData, setWalkInData] = useState({
    patientName: '',
    patientPhone: '',
    age: '',
    gender: 'Male',
    timeSlot: '',
    reason: 'Walk-in Consultation'
  });
  const [walkInError, setWalkInError] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url = `/api/appointments?date=${selectedDate}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      
      const res = await authFetch(url);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, statusFilter, search]);

  // Update status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await authFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save notes
  const handleSaveNotes = async (id) => {
    setSavingNotes(true);
    try {
      const res = await authFetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorNotes: notesText })
      });
      if (res.ok) {
        setActiveNotesId(null);
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Open walk in modal and fetch free slots
  const handleOpenWalkIn = async () => {
    try {
      const res = await fetch(`/api/slots?date=${selectedDate}`);
      const data = await res.json();
      const free = data.slots?.filter(s => s.status === 'available') || [];
      setAvailableSlots(free);
      if (free.length > 0) {
        setWalkInData(prev => ({ ...prev, timeSlot: free[0].time }));
      }
      setWalkInError(null);
      setShowWalkInModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWalkIn = async (e) => {
    e.preventDefault();
    setWalkInError(null);
    if (!walkInData.patientName || !walkInData.patientPhone || !walkInData.timeSlot) return;

    try {
      const res = await authFetch('/api/appointments/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...walkInData,
          date: selectedDate
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book walk-in patient');
      }

      setShowWalkInModal(false);
      setWalkInData({
        patientName: '',
        patientPhone: '',
        age: '',
        gender: 'Male',
        timeSlot: '',
        reason: 'Walk-in Consultation'
      });
      fetchAppointments();
    } catch (err) {
      setWalkInError(err.message);
    }
  };

  // Stats calculation
  const total = appointments.length;
  const checkedIn = appointments.filter(a => a.status === 'checked_in').length;
  const inConsultation = appointments.filter(a => a.status === 'in_consultation').length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Search & Walk-In Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, token..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            onClick={handleOpenWalkIn}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Walk-In Patient</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Bookings</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Checked In (Waiting)
          </p>
          <p className="text-2xl font-black text-amber-900 mt-1">{checkedIn}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/20 shadow-xs">
          <p className="text-xs font-medium text-indigo-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> In Consultation
          </p>
          <p className="text-2xl font-black text-indigo-900 mt-1">{inConsultation}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
          </p>
          <p className="text-2xl font-black text-emerald-900 mt-1">{completed}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
        {['all', 'booked', 'checked_in', 'in_consultation', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-xl font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Appointments List / Queue Cards */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-slate-400 text-sm">Loading queue...</div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Appointments Found</h4>
            <p className="text-xs text-slate-400 mt-1">There are no bookings matching this date or filter.</p>
          </div>
        )}

        {!loading && appointments.map((appt) => {
          const isNotesOpen = activeNotesId === appt.id;

          return (
            <div
              key={appt.id}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs hover:shadow-sm ${
                appt.status === 'in_consultation'
                  ? 'border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50/10'
                  : appt.status === 'checked_in'
                  ? 'border-amber-300'
                  : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Token & Patient Info */}
                <div className="flex items-start gap-4">
                  {/* Token Badge */}
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-teal-600">Token</span>
                    <span className="text-lg font-black text-teal-900 leading-tight">
                      #{String(appt.tokenNumber).padStart(2, '0')}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">
                        {appt.patientName}
                      </h3>
                      {appt.age && (
                        <span className="text-xs text-slate-500">
                          ({appt.age} yrs, {appt.gender})
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        appt.status === 'in_consultation'
                          ? 'bg-indigo-100 text-indigo-800'
                          : appt.status === 'checked_in'
                          ? 'bg-amber-100 text-amber-800'
                          : appt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : appt.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-teal-50 text-teal-800'
                      }`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {appt.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1 font-semibold text-teal-800">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {appt.timeSlot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {appt.patientPhone}
                      </span>
                      <span className="text-slate-400">• {appt.visitType}</span>
                    </div>

                    {appt.reason && (
                      <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 mt-2">
                        <strong className="text-slate-500 font-medium">Complaint:</strong> "{appt.reason}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Status progression buttons */}
                  {appt.status === 'booked' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'checked_in')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Mark Arrived</span>
                    </button>
                  )}

                  {appt.status === 'checked_in' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'in_consultation')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Consultation</span>
                    </button>
                  )}

                  {appt.status === 'in_consultation' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'completed')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}

                  {/* Notes button */}
                  <button
                    onClick={() => {
                      if (isNotesOpen) {
                        setActiveNotesId(null);
                      } else {
                        setActiveNotesId(appt.id);
                        setNotesText(appt.doctorNotes || '');
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      appt.doctorNotes
                        ? 'border-teal-300 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{appt.doctorNotes ? 'Notes (Saved)' : 'Add Note'}</span>
                  </button>

                  {/* Cancel */}
                  {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Cancel Booking"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Doctor Notes Section */}
              {isNotesOpen && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-slate-700">
                    Clinical / Prescription Notes for {appt.patientName}
                  </label>
                  <textarea
                    rows={2}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="e.g. Prescribed Amoxicillin 500mg, review in 5 days, BP checked 120/80..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  ></textarea>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActiveNotesId(null)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleSaveNotes(appt.id)}
                      disabled={savingNotes}
                      className="px-4 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {savingNotes ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Walk-In Patient</h3>
            <p className="text-xs text-slate-500 mb-4">Assigns immediate queue token for {selectedDate}</p>

            {walkInError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-1.5 mb-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{walkInError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWalkIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={walkInData.patientName}
                  onChange={(e) => setWalkInData({ ...walkInData, patientName: e.target.value })}
                  placeholder="e.g. Anand Verma"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <div className="relative flex rounded-xl border border-slate-300 overflow-hidden">
                    <span className="inline-flex items-center px-2 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={walkInData.patientPhone}
                      onChange={(e) => setWalkInData({ ...walkInData, patientPhone: e.target.value })}
                      placeholder="98765 43210"
                      maxLength={15}
                      className="w-full px-2 py-2 text-sm focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={walkInData.age}
                    onChange={(e) => setWalkInData({ ...walkInData, age: e.target.value })}
                    placeholder="Years"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Time Slot *</label>
                <select
                  required
                  value={walkInData.timeSlot}
                  onChange={(e) => setWalkInData({ ...walkInData, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                >
                  {availableSlots.length === 0 ? (
                    <option value="">No free slots available today</option>
                  ) : (
                    availableSlots.map(s => (
                      <option key={s.id} value={s.time}>
                        {s.time} ({s.periodCategory})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms / Reason</label>
                <input
                  type="text"
                  value={walkInData.reason}
                  onChange={(e) => setWalkInData({ ...walkInData, reason: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!walkInData.timeSlot}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  Confirm & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
