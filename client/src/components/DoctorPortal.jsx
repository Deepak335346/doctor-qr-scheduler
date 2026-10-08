import React, { useState } from 'react';
import { Users, QrCode, Clock, UserCog, ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
import AppointmentsTab from './AppointmentsTab';
import QrStandeeTab from './QrStandeeTab';
import AvailabilityTab from './AvailabilityTab';
import ProfileTab from './ProfileTab';

export default function DoctorPortal({ doctor, onUpdateDoctor, onLogout }) {
  const [activeTab, setActiveTab] = useState('appointments');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Welcome & Administration Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={doctor?.avatar || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350"}
              alt={doctor?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-400/40 shadow-md bg-slate-800"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Doctor Administration Session Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {doctor?.name || 'Doctor Portal'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              {doctor?.chamber} • {doctor?.clinicName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer"
            title="Open patient booking page in new tab"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Preview Patient View</span>
          </a>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Doctor Tabs Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-teal-500" />
          <span>Queue & Appointments</span>
        </button>

        <button
          onClick={() => setActiveTab('qr')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'qr'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <QrCode className="w-4 h-4 text-cyan-500" />
          <span>QR Code & Desk Standee</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'availability'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Slots & Availability</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UserCog className="w-4 h-4 text-indigo-400" />
          <span>Clinic & Doctor Profile</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'appointments' && (
          <AppointmentsTab
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {activeTab === 'qr' && (
          <QrStandeeTab doctor={doctor} />
        )}

        {activeTab === 'availability' && (
          <AvailabilityTab />
        )}

        {activeTab === 'profile' && (
          <ProfileTab doctor={doctor} onUpdateDoctor={onUpdateDoctor} />
        )}
      </div>
    </div>
  );
}
