import React, { useEffect, useState } from 'react';
import { CheckCircle2, Calendar, Clock, MapPin, User, Phone, FileText, Printer, Copy, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BookingConfirmationModal({ appointment, doctor, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if confetti fails
    }

    // Fetch mini QR code for this appointment pass
    if (appointment?.id) {
      const passInfo = JSON.stringify({
        id: appointment.id,
        token: appointment.tokenNumber,
        patient: appointment.patientName,
        slot: appointment.timeSlot,
        date: appointment.date
      });
      fetch(`/api/qr?url=${encodeURIComponent(passInfo)}`)
        .then(r => r.json())
        .then(data => {
          if (data.dataUrl) setQrDataUrl(data.dataUrl);
        })
        .catch(console.error);
    }
  }, [appointment]);

  if (!appointment) return null;

  const handleCopy = () => {
    const text = `${doctor?.clinicName || 'Aura Health & Care Clinic'} Appointment Pass
Token: #${appointment.tokenNumber}
ID: ${appointment.id}
Doctor: ${doctor?.name} (${doctor?.chamber})
Patient: ${appointment.patientName}
Date & Time: ${appointment.date} at ${appointment.timeSlot}
Address: ${doctor?.address}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoogleCalendar = () => {
    const title = encodeURIComponent(`Doctor Appointment with ${doctor?.name}`);
    const details = encodeURIComponent(`Token #${appointment.tokenNumber} | Booking ID: ${appointment.id}\nPatient: ${appointment.patientName}\nClinic: ${doctor?.clinicName}\nChamber: ${doctor?.chamber}`);
    const location = encodeURIComponent(`${doctor?.clinicName}, ${doctor?.address}`);
    
    // Format YYYYMMDD
    const dateFormatted = appointment.date.replace(/-/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateFormatted}T090000Z/${dateFormatted}T100000Z`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-teal-100">
                Booking Confirmed
              </span>
              <h2 className="text-xl font-bold">Appointment Digital Pass</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Token Badge */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/80 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide">Queue Token Number</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl font-extrabold text-teal-900 tracking-tight">
                  #{String(appointment.tokenNumber).padStart(2, '0')}
                </span>
                <span className="text-xs text-teal-700 font-medium">for {appointment.date}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Ref ID: <span className="font-mono font-semibold text-slate-800">{appointment.id}</span></p>
            </div>

            {/* Reception Check-in QR */}
            {qrDataUrl && (
              <div className="flex flex-col items-center bg-white p-2 rounded-xl shadow-xs border border-teal-100">
                <img src={qrDataUrl} alt="Appointment QR Pass" className="w-20 h-20" />
                <span className="text-[10px] text-slate-500 font-medium mt-1">Reception QR</span>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Calendar className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Date & Time Slot</p>
                <p className="font-semibold text-slate-900">{appointment.date} at <span className="text-teal-700">{appointment.timeSlot}</span></p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <User className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Patient Details</p>
                <p className="font-semibold text-slate-900">
                  {appointment.patientName} {appointment.age ? `(${appointment.age} yrs, ${appointment.gender})` : ''}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {appointment.patientPhone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Doctor & Consultation Location</p>
                <p className="font-semibold text-slate-900">{doctor?.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{doctor?.chamber} • {doctor?.clinicName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{doctor?.address}</p>
              </div>
            </div>

            {appointment.reason && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <FileText className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-medium">Visit Reason / Symptoms</p>
                  <p className="text-xs text-slate-700 italic mt-0.5">"{appointment.reason}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Please arrive <strong>5-10 minutes</strong> before your scheduled time slot. Show this digital pass or mention your Token <strong className="text-amber-900">#{appointment.tokenNumber}</strong> at the reception counter.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Pass</span>
            </button>

            <button
              onClick={handleGoogleCalendar}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-teal-300 text-teal-800 bg-teal-50/50 font-medium text-xs hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Google Calendar</span>
            </button>

            <button
              onClick={handleCopy}
              className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-600 text-white font-medium text-xs hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Appointment Details'}</span>
            </button>

            <a
              href={`/my-bookings?phone=${encodeURIComponent(appointment.patientPhone || '')}`}
              onClick={(e) => {
                e.preventDefault();
                onClose();
                window.history.pushState({}, '', `/my-bookings?phone=${encodeURIComponent(appointment.patientPhone || '')}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>View All My Bookings & History</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
