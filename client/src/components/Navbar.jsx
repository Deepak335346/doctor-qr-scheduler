import React from 'react';
import { Stethoscope, Calendar, Clock } from 'lucide-react';

export default function Navbar({ doctor, currentPath, onNavigate }) {
  const isMyBookings = currentPath?.startsWith('/my-bookings');

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Clinic Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onNavigate('/')}
            title="Return to clinic booking home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  {doctor?.clinicName || 'Aura Health & Care Clinic'}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Live Slots
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {doctor?.name || 'Dr. Sarah Jenkins'} • {doctor?.specialty || 'Consultant Physician'}
              </p>
            </div>
          </div>

          {/* Navigation Controls: Only Patient-Safe Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isMyBookings ? (
              <button
                onClick={() => onNavigate('/')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Book Slot</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/my-bookings')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                title="View all your previous and upcoming appointments"
              >
                <Clock className="w-4 h-4 text-teal-600" />
                <span>My Bookings</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
