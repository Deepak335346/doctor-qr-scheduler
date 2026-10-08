import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Phone, Award, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import BookingFormModal from './BookingFormModal';
import BookingConfirmationModal from './BookingConfirmationModal';

// Helper to generate next 14 dates starting from today
function getUpcomingDays(count = 14) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    days.push({
      dateStr,
      dayName,
      fullDayName,
      dayNum,
      month,
      isToday: i === 0,
      isTomorrow: i === 1
    });
  }
  return days;
}

export default function PatientBooking({ doctor }) {
  const upcomingDays = getUpcomingDays(14);
  const [selectedDate, setSelectedDate] = useState(upcomingDays[0].dateStr);
  const [slotsData, setSlotsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  // Fetch slots for selected date
  const fetchSlots = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/slots?date=${date}`);
      if (!res.ok) throw new Error('Failed to load available slots');
      const data = await res.json();
      setSlotsData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const handleBookingSuccess = (newAppt) => {
    setSelectedSlotForBooking(null);
    setConfirmedAppointment(newAppt);
    // Refresh slots
    fetchSlots(selectedDate);
  };

  // Group slots by period
  const morningSlots = slotsData?.slots?.filter(s => s.periodCategory === 'Morning') || [];
  const afternoonSlots = slotsData?.slots?.filter(s => s.periodCategory === 'Afternoon') || [];
  const eveningSlots = slotsData?.slots?.filter(s => s.periodCategory === 'Evening') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Doctor Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full pointer-events-none -mr-16 -mt-16"></div>
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative">
          <div className="relative">
            <img
              src={doctor?.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350"}
              alt={doctor?.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-teal-50 shadow-md"
            />
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-xs" title="Verified Practitioner">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {doctor?.name || 'Dr. Sarah Jenkins'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                {doctor?.experience || '12+ Years Exp'}
              </span>
            </div>

            <p className="text-teal-700 font-medium text-sm sm:text-base">
              {doctor?.specialty || 'General Physician & Family Medicine'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {doctor?.qualifications || 'MBBS, MD'}
            </p>

            <p className="text-xs text-slate-600 mt-3 max-w-xl line-clamp-2">
              {doctor?.bio}
            </p>

            {/* Quick Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="truncate">{doctor?.chamber}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <Award className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Fee: <strong className="text-slate-800">{doctor?.consultationFee || '₹500 / Consultation'}</strong></span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{doctor?.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Instructions Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-100">Direct QR Booking</p>
            <p className="text-sm font-medium">Select your date and preferred available slot below to confirm instantly</p>
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Choose Appointment Date
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Next 14 Days
          </span>
        </div>

        {/* Horizontal Scrollable Days */}
        <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {upcomingDays.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                onClick={() => setSelectedDate(d.dateStr)}
                className={`flex-shrink-0 w-20 py-3 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/20 scale-102'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                  {d.isToday ? 'Today' : d.isTomorrow ? 'Tmrw' : d.dayName}
                </span>
                <span className="text-xl font-extrabold my-0.5">
                  {d.dayNum}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                  {d.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slot Availability Section */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Select Available Time Slot
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Available slots for <strong>{selectedDate}</strong>
            </p>
          </div>

          {/* Slot Legend */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-md bg-teal-50 border border-teal-300"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200"></span> Booked
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-3 h-3 rounded-md bg-amber-50 border border-amber-300"></span> Reserved
            </span>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <span>Checking doctor's real-time schedule...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Day Off / Closed */}
        {!loading && slotsData?.isDayOff && (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Doctor Not Available On This Date</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {slotsData.dayOffReason || 'The clinic is closed or the doctor is on scheduled leave for this date.'}
            </p>
            <p className="text-xs text-teal-700 font-medium mt-3">
              Please select another date from the calendar above.
            </p>
          </div>
        )}

        {/* Slots Content */}
        {!loading && !slotsData?.isDayOff && slotsData?.slots && (
          <div className="space-y-6">
            {/* Morning Shift */}
            {morningSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                  <span>🌅 Morning Shift</span>
                  <span className="text-slate-400 font-normal">
                    ({morningSlots.filter(s => s.status === 'available').length} free)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {morningSlots.map(slot => (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      onSelect={() => setSelectedSlotForBooking(slot)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Afternoon Shift */}
            {afternoonSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                  <span>☀️ Afternoon Shift</span>
                  <span className="text-slate-400 font-normal">
                    ({afternoonSlots.filter(s => s.status === 'available').length} free)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {afternoonSlots.map(slot => (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      onSelect={() => setSelectedSlotForBooking(slot)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Evening Shift */}
            {eveningSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                  <span>🌙 Evening Shift</span>
                  <span className="text-slate-400 font-normal">
                    ({eveningSlots.filter(s => s.status === 'available').length} free)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {eveningSlots.map(slot => (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      onSelect={() => setSelectedSlotForBooking(slot)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* If all slots are full */}
            {slotsData.summary.available === 0 && (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                All slots for this day are fully booked. Please select another date.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {selectedSlotForBooking && (
        <BookingFormModal
          slot={selectedSlotForBooking}
          dateStr={selectedDate}
          doctor={doctor}
          onClose={() => setSelectedSlotForBooking(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Digital Confirmation Pass Modal */}
      {confirmedAppointment && (
        <BookingConfirmationModal
          appointment={confirmedAppointment}
          doctor={doctor}
          onClose={() => setConfirmedAppointment(null)}
        />
      )}
    </div>
  );
}

// Single Slot Button Component
function SlotButton({ slot, onSelect }) {
  if (slot.status === 'available') {
    return (
      <button
        onClick={onSelect}
        className="group p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-600 hover:border-teal-600 transition-all text-center cursor-pointer shadow-2xs hover:shadow-md"
      >
        <span className="block text-xs font-bold text-teal-900 group-hover:text-white transition-colors">
          {slot.time}
        </span>
        <span className="block text-[10px] text-teal-700 font-medium group-hover:text-teal-100 transition-colors mt-0.5">
          Available
        </span>
      </button>
    );
  }

  if (slot.status === 'booked') {
    return (
      <div
        className="p-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-center cursor-not-allowed opacity-75"
        title="This slot is already booked"
      >
        <span className="block text-xs font-semibold text-slate-400 line-through">
          {slot.time}
        </span>
        <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
          Booked
        </span>
      </div>
    );
  }

  // Blocked / Reserved by Doctor
  return (
    <div
      className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 text-center cursor-not-allowed"
      title={slot.reason || 'Reserved / Unavailable'}
    >
      <span className="block text-xs font-semibold text-amber-700">
        {slot.time}
      </span>
      <span className="block text-[10px] text-amber-600 font-medium truncate mt-0.5">
        Reserved
      </span>
    </div>
  );
}
