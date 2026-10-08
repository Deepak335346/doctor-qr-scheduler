import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PatientBooking from './components/PatientBooking';
import DoctorPortal from './components/DoctorPortal';
import DoctorLogin from './components/DoctorLogin';
import MyBookingsPage from './components/MyBookingsPage';
import { Heart, Lock } from 'lucide-react';
import { authFetch } from './utils/api';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [doctorToken, setDoctorToken] = useState(() => sessionStorage.getItem('doctor_token'));
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Path navigation helper
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Listen for session expiry event
  useEffect(() => {
    const handleSessionExpired = () => {
      setDoctorToken(null);
      if (currentPath.startsWith('/doctor')) {
        navigate('/doctor');
      }
    };
    window.addEventListener('doctor_session_expired', handleSessionExpired);
    return () => window.removeEventListener('doctor_session_expired', handleSessionExpired);
  }, [currentPath]);

  // Fetch doctor data depending on route and auth
  useEffect(() => {
    const loadDoctorData = async () => {
      setLoading(true);
      try {
        if (currentPath.startsWith('/doctor') && doctorToken) {
          // Doctor is logged in -> fetch full admin profile
          const res = await authFetch('/api/doctor');
          if (res.ok) {
            const data = await res.json();
            setDoctor(data);
          } else {
            // Invalid/expired token
            sessionStorage.removeItem('doctor_token');
            setDoctorToken(null);
          }
        } else {
          // Public view -> fetch sanitized public doctor profile
          const res = await fetch('/api/doctor/public');
          if (res.ok) {
            const data = await res.json();
            setDoctor(data);
          }
        }
      } catch (err) {
        console.error('Failed to load clinic profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDoctorData();
  }, [currentPath, doctorToken]);

  // Handle doctor login
  const handleLoginSuccess = (token) => {
    setDoctorToken(token);
    navigate('/doctor');
  };

  // Handle doctor logout
  const handleLogout = () => {
    sessionStorage.removeItem('doctor_token');
    setDoctorToken(null);
    navigate('/doctor');
  };

  const isDoctorRoute = currentPath.startsWith('/doctor');
  const isMyBookingsRoute = currentPath.startsWith('/my-bookings');

  // Loading state
  if (loading && !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold">Loading Clinic Portal...</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 1: Doctor Portal Route (/doctor)
  // -------------------------------------------------------------
  if (isDoctorRoute) {
    if (!doctorToken) {
      // Doctor not authenticated -> show secure login screen
      return (
        <DoctorLogin
          onLoginSuccess={handleLoginSuccess}
          onBackToPatientView={() => navigate('/')}
        />
      );
    }

    // Doctor authenticated -> show full Doctor Portal
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
        <main className="flex-1 pb-16">
          <DoctorPortal
            doctor={doctor}
            onUpdateDoctor={(updated) => setDoctor(updated)}
            onLogout={handleLogout}
          />
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 2: Patient My Bookings Route (/my-bookings)
  // -------------------------------------------------------------
  if (isMyBookingsRoute) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar
          doctor={doctor}
          currentPath={currentPath}
          onNavigate={navigate}
        />

        <main className="flex-1 pb-16">
          <MyBookingsPage
            doctor={doctor}
            onBackToBooking={() => navigate('/')}
          />
        </main>

        <Footer onDoctorLoginClick={() => navigate('/doctor')} clinicName={doctor?.clinicName} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 3: Public Patient Booking Route (/)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        doctor={doctor}
        currentPath={currentPath}
        onNavigate={navigate}
      />

      <main className="flex-1 pb-16">
        <PatientBooking doctor={doctor} onNavigate={navigate} />
      </main>

      <Footer onDoctorLoginClick={() => navigate('/doctor')} clinicName={doctor?.clinicName} />
    </div>
  );
}

// Reusable Footer
function Footer({ onDoctorLoginClick, clinicName }) {
  return (
    <footer className="no-print bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{clinicName || 'Aura Health & Care Clinic'}</span>
          <span>• Scannable QR Appointment Scheduling</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Smart Clinic Scheduler</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>

          <button
            onClick={onDoctorLoginClick}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-[11px]"
            title="Doctor and Staff Login"
          >
            <Lock className="w-3 h-3" />
            <span>Doctor Login</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
