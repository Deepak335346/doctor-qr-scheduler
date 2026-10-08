import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import qrcode from 'qrcode';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from './db.js';
import { validateIndianPhone, validateEmail, sanitizeText } from './utils/validators.js';
import { requireDoctorAuth, generateDoctorToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers (configured to allow inline QR data URLs and Vite assets)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(express.json());

// Global Rate Limiting: 300 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', globalLimiter);

// Strict Rate Limiter for Login: 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many failed login attempts. Please wait 15 minutes before trying again.' }
});

// Strict Rate Limiter for Booking: 25 bookings per 15 minutes per IP
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { error: 'Booking rate limit reached. Please wait a few minutes before booking again.' }
});

// Helper: Get local network IPv4 addresses
function getLocalNetworkIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          interface: name,
          ip: iface.address
        });
      }
    }
  }
  return ips;
}

// Helper: Convert "HH:MM" (24h) to minutes from midnight
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Convert minutes from midnight to "HH:MM AM/PM"
function minutesTo12Hour(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const padM = m < 10 ? '0' + m : m;
  const padH = displayH < 10 ? '0' + displayH : displayH;
  return `${padH}:${padM} ${period}`;
}

// Helper: Generate slots for a date
function generateSlotsForDate(dateStr, db) {
  const targetDate = new Date(dateStr + 'T00:00:00');
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[targetDate.getDay()];

  // Check whole day override
  const dayBlockedOverride = db.overrides.find(
    o => o.date === dateStr && o.type === 'blocked_day'
  );

  const dayConfig = db.scheduleConfig.days[dayName];

  if (dayBlockedOverride) {
    return {
      date: dateStr,
      dayName,
      isDayOff: true,
      dayOffReason: dayBlockedOverride.reason || 'Doctor is unavailable on this date',
      slots: [],
      summary: { total: 0, available: 0, booked: 0, blocked: 0 }
    };
  }

  if (!dayConfig || !dayConfig.enabled || !dayConfig.shifts || dayConfig.shifts.length === 0) {
    return {
      date: dateStr,
      dayName,
      isDayOff: true,
      dayOffReason: `Clinic is closed on ${dayName}s`,
      slots: [],
      summary: { total: 0, available: 0, booked: 0, blocked: 0 }
    };
  }

  const duration = db.scheduleConfig.slotDuration || 15;
  const slots = [];
  const existingAppointments = db.appointments.filter(
    a => a.date === dateStr && a.status !== 'cancelled'
  );
  const slotOverrides = db.overrides.filter(
    o => o.date === dateStr && o.type === 'blocked_slot'
  );

  dayConfig.shifts.forEach((shift, shiftIndex) => {
    const startMins = timeToMinutes(shift.start);
    const endMins = timeToMinutes(shift.end);

    for (let current = startMins; current + duration <= endMins; current += duration) {
      const timeSlotStr = minutesTo12Hour(current);
      const timeSlotEndStr = minutesTo12Hour(current + duration);

      let periodCategory = 'Morning';
      if (current >= 12 * 60 && current < 16 * 60) {
        periodCategory = 'Afternoon';
      } else if (current >= 16 * 60) {
        periodCategory = 'Evening';
      }

      const bookedAppt = existingAppointments.find(a => a.timeSlot === timeSlotStr);
      const blockedOv = slotOverrides.find(o => o.time === timeSlotStr);

      let status = 'available';
      let reason = null;
      let appointmentId = null;

      if (bookedAppt) {
        status = 'booked';
        appointmentId = bookedAppt.id;
      } else if (blockedOv) {
        status = 'blocked';
        reason = blockedOv.reason || 'Slot reserved / blocked by doctor';
      }

      slots.push({
        id: `${dateStr}_${current}`,
        time: timeSlotStr,
        endTime: timeSlotEndStr,
        minutes: current,
        shiftIndex,
        periodCategory,
        status,
        reason,
        appointmentId: status === 'booked' ? appointmentId : null
      });
    }
  });

  const total = slots.length;
  const available = slots.filter(s => s.status === 'available').length;
  const booked = slots.filter(s => s.status === 'booked').length;
  const blocked = slots.filter(s => s.status === 'blocked').length;

  return {
    date: dateStr,
    dayName,
    isDayOff: false,
    dayOffReason: null,
    slots,
    summary: { total, available, booked, blocked }
  };
}

// -------------------------------------------------------------
// Health Check Endpoint (For Cloud Deployment Monitoring)
// -------------------------------------------------------------
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// Doctor Login (Username/Password or Quick PIN)
app.post('/api/auth/doctor/login', loginLimiter, (req, res) => {
  const { username, password, pin } = req.body;
  const db = getDb();
  const creds = db.credentials || {};

  const validUsername = creds.username || process.env.DOCTOR_USERNAME || 'doctor';
  const validPassword = creds.password || process.env.DOCTOR_PASSWORD || 'Doctor@2026';
  const validPin = creds.pin || process.env.DOCTOR_PIN || '782104';

  let isAuthenticated = false;

  // Check PIN login
  if (pin && pin.trim() === validPin.trim()) {
    isAuthenticated = true;
  }
  // Check Username & Password login
  else if (username && password && username.trim() === validUsername && password === validPassword) {
    isAuthenticated = true;
  }

  if (!isAuthenticated) {
    return res.status(401).json({
      error: 'Invalid credentials. Please enter the correct username and password.'
    });
  }

  const token = generateDoctorToken({
    role: 'doctor',
    doctorId: db.doctor.id,
    name: db.doctor.name
  });

  res.json({
    success: true,
    message: 'Doctor authenticated successfully',
    token,
    doctor: {
      name: db.doctor.name,
      clinicName: db.doctor.clinicName,
      username: validUsername,
      pin: validPin
    }
  });
});

// Update Doctor Login Credentials
app.put('/api/auth/doctor/credentials', requireDoctorAuth, (req, res) => {
  const { currentPasswordOrPin, newUsername, newPassword, newPin } = req.body;

  if (!currentPasswordOrPin) {
    return res.status(400).json({ error: 'Please enter your current PIN or Password to authorize changes.' });
  }

  const db = getDb();
  const creds = db.credentials || {
    username: process.env.DOCTOR_USERNAME || 'doctor',
    password: process.env.DOCTOR_PASSWORD || 'Doctor@2026',
    pin: process.env.DOCTOR_PIN || '782104'
  };

  const currentMatch = (
    currentPasswordOrPin.trim() === creds.pin ||
    currentPasswordOrPin === creds.password ||
    currentPasswordOrPin.trim() === (process.env.DOCTOR_PIN || '782104') ||
    currentPasswordOrPin === (process.env.DOCTOR_PASSWORD || 'Doctor@2026')
  );

  if (!currentMatch) {
    return res.status(401).json({ error: 'Current Password or PIN is incorrect.' });
  }

  if (newPin) {
    const cleanPin = newPin.trim();
    if (!/^\d{4,8}$/.test(cleanPin)) {
      return res.status(400).json({ error: 'New Doctor PIN must be between 4 to 8 digits.' });
    }
    creds.pin = cleanPin;
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }
    creds.password = newPassword;
  }

  if (newUsername && newUsername.trim()) {
    creds.username = newUsername.trim();
  }

  creds.updatedAt = new Date().toISOString();
  db.credentials = creds;
  saveDb(db);

  res.json({
    success: true,
    message: 'Doctor credentials updated successfully.',
    credentials: {
      username: creds.username,
      pin: creds.pin,
      updatedAt: creds.updatedAt
    }
  });
});

// Verify Doctor Session Token
app.get('/api/auth/doctor/me', requireDoctorAuth, (req, res) => {
  const db = getDb();
  res.json({
    authenticated: true,
    doctor: db.doctor,
    credentials: {
      username: db.credentials?.username || 'doctor',
      pin: db.credentials?.pin || '782104'
    }
  });
});

// -------------------------------------------------------------
// Public Endpoints (Safe for Patients & Public)
// -------------------------------------------------------------

// Public Doctor Information (Sanitized, NO admin credentials/private notes)
app.get('/api/doctor/public', (req, res) => {
  const db = getDb();
  const doc = db.doctor;
  res.json({
    id: doc.id,
    name: doc.name,
    qualifications: doc.qualifications,
    specialty: doc.specialty,
    experience: doc.experience,
    clinicName: doc.clinicName,
    chamber: doc.chamber,
    address: doc.address,
    phone: doc.phone,
    email: doc.email,
    consultationFee: doc.consultationFee,
    avatar: doc.avatar,
    bio: doc.bio,
    clinicHoursNote: doc.clinicHoursNote
  });
});

// Get slots for a specific date
app.get('/api/slots', (req, res) => {
  const dateStr = req.query.date;
  if (!dateStr) {
    return res.status(400).json({ error: 'Missing date parameter (YYYY-MM-DD)' });
  }
  const db = getDb();
  const slotData = generateSlotsForDate(dateStr, db);
  res.json(slotData);
});

// Book new appointment (Patient Booking with Indian Phone Validation)
app.post('/api/appointments', bookingLimiter, (req, res) => {
  const {
    patientName,
    patientPhone,
    patientEmail,
    age,
    gender,
    reason,
    visitType,
    date,
    timeSlot
  } = req.body;

  // Mandatory fields check: Everything is required except email
  if (!patientName?.trim()) {
    return res.status(400).json({ error: 'Patient Full Name is mandatory.' });
  }

  if (!patientPhone?.trim()) {
    return res.status(400).json({ error: '10-digit Mobile Number is mandatory.' });
  }

  if (!date || !timeSlot) {
    return res.status(400).json({ error: 'Appointment Date and Time Slot are mandatory.' });
  }

  const numAge = Number(age);
  if (!age || isNaN(numAge) || numAge < 1 || numAge > 120) {
    return res.status(400).json({ error: 'Patient Age is mandatory (must be between 1 and 120 years).' });
  }

  if (!gender || !gender.trim()) {
    return res.status(400).json({ error: 'Patient Gender is mandatory.' });
  }

  if (!visitType || !visitType.trim()) {
    return res.status(400).json({ error: 'Visit Type is mandatory.' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'Symptoms / Reason for visit is mandatory.' });
  }

  // Validate 10-digit Indian Mobile Number
  const phoneValidation = validateIndianPhone(patientPhone);
  if (!phoneValidation.isValid) {
    return res.status(400).json({
      error: phoneValidation.error || 'Please enter a valid 10-digit Indian mobile number.'
    });
  }

  // Validate Email Address (Optional, but must satisfy standard email format if provided)
  const trimmedEmail = (patientEmail || '').trim();
  if (trimmedEmail.length > 0) {
    const emailValidation = validateEmail(trimmedEmail, false);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        error: emailValidation.error || 'Please enter a valid email format (e.g. name@example.com).'
      });
    }
  }

  const db = getDb();

  // Check if slot is already taken
  const existing = db.appointments.find(
    a => a.date === date && a.timeSlot === timeSlot && a.status !== 'cancelled'
  );

  if (existing) {
    return res.status(409).json({
      error: 'This time slot was just booked by another patient. Please choose another available slot.'
    });
  }

  // Check if slot is blocked by doctor
  const blocked = db.overrides.find(
    o => o.date === date && o.type === 'blocked_slot' && o.time === timeSlot
  );
  if (blocked) {
    return res.status(409).json({
      error: `This slot is currently unavailable: ${blocked.reason || 'Doctor blocked this slot'}`
    });
  }

  // Sequential daily token number
  const todayAppts = db.appointments.filter(a => a.date === date);
  const nextToken = todayAppts.length + 1;

  // Generate unique appointment ID
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const apptId = `APT-${randomSuffix}`;

  const newAppointment = {
    id: apptId,
    tokenNumber: nextToken,
    doctorId: db.doctor.id,
    patientName: sanitizeText(patientName),
    patientPhone: phoneValidation.normalized,
    rawPhone10: phoneValidation.raw10,
    patientEmail: sanitizeText(patientEmail || ''),
    age: Number(age) || null,
    gender: sanitizeText(gender || 'Unspecified'),
    reason: sanitizeText(reason || 'General Consultation'),
    visitType: sanitizeText(visitType || 'First Visit'),
    date,
    timeSlot,
    status: 'booked',
    doctorNotes: '',
    createdAt: new Date().toISOString()
  };

  db.appointments.unshift(newAppointment);
  saveDb(db);

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    appointment: newAppointment
  });
});

// Secure Appointment Lookup for Patients (Requires BOTH Booking ID AND Phone Number)
app.post('/api/appointments/lookup', (req, res) => {
  const { appointmentId, phone } = req.body;

  if (!appointmentId || !phone) {
    return res.status(400).json({
      error: 'Both Appointment ID and Registered Mobile Number are required.'
    });
  }

  const phoneCheck = validateIndianPhone(phone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({
      error: 'Please enter a valid 10-digit Indian mobile number.'
    });
  }

  const db = getDb();
  const cleanId = appointmentId.trim().toUpperCase();

  const found = db.appointments.find(a => {
    if (a.id.toUpperCase() !== cleanId) return false;
    const cleanApptPhone = (a.rawPhone10 || a.patientPhone.replace(/\D/g, '')).slice(-10);
    return cleanApptPhone === phoneCheck.raw10;
  });

  if (!found) {
    return res.status(404).json({
      error: 'No appointment found matching this Booking ID and Mobile Number. Please verify your details.'
    });
  }

  // Return sanitized view (no internal doctor notes unless completed)
  res.json({
    id: found.id,
    tokenNumber: found.tokenNumber,
    patientName: found.patientName,
    patientPhone: found.patientPhone,
    date: found.date,
    timeSlot: found.timeSlot,
    status: found.status,
    visitType: found.visitType,
    reason: found.reason
  });
});

// Patient My Bookings: Retrieve all bookings for a patient using their 10-digit mobile number
app.post('/api/patient/my-bookings', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Please enter your registered 10-digit mobile number.' });
  }

  const phoneCheck = validateIndianPhone(phone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ error: phoneCheck.error || 'Please enter a valid 10-digit Indian mobile number.' });
  }

  const db = getDb();
  const allAppts = db.appointments || [];

  const patientBookings = allAppts.filter(a => {
    const cleanApptPhone = (a.rawPhone10 || a.patientPhone.replace(/\D/g, '')).slice(-10);
    return cleanApptPhone === phoneCheck.raw10;
  });

  // Sort: upcoming dates first, latest token
  patientBookings.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.tokenNumber || 0) - (a.tokenNumber || 0);
  });

  res.json({
    success: true,
    phone: phoneCheck.normalized,
    rawPhone10: phoneCheck.raw10,
    total: patientBookings.length,
    appointments: patientBookings
  });
});

// Patient cancels their own appointment
app.post('/api/patient/cancel-booking', (req, res) => {
  const { appointmentId, phone } = req.body;
  if (!appointmentId || !phone) {
    return res.status(400).json({ error: 'Both Booking ID and Mobile Number are required.' });
  }

  const phoneCheck = validateIndianPhone(phone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  const db = getDb();
  const cleanId = appointmentId.trim().toUpperCase();
  const apptIndex = db.appointments.findIndex(a => {
    if (a.id.toUpperCase() !== cleanId) return false;
    const cleanApptPhone = (a.rawPhone10 || a.patientPhone.replace(/\D/g, '')).slice(-10);
    return cleanApptPhone === phoneCheck.raw10;
  });

  if (apptIndex === -1) {
    return res.status(404).json({ error: 'No booking found matching this Booking ID and Mobile Number.' });
  }

  const appt = db.appointments[apptIndex];
  if (appt.status === 'completed') {
    return res.status(400).json({ error: 'Completed appointments cannot be cancelled.' });
  }

  db.appointments[apptIndex].status = 'cancelled';
  saveDb(db);

  res.json({
    success: true,
    message: 'Appointment cancelled successfully.',
    appointment: db.appointments[apptIndex]
  });
});

// QR Code image generator
app.get('/api/qr', async (req, res) => {
  try {
    const text = req.query.url;
    if (!text) {
      return res.status(400).json({ error: 'Missing url query parameter' });
    }
    const qrDataUrl = await qrcode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    res.json({ dataUrl: qrDataUrl, url: text });
  } catch (err) {
    console.error('QR code generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// -------------------------------------------------------------
// Protected Doctor Endpoints (Require requireDoctorAuth)
// -------------------------------------------------------------

// 1. Get Doctor Full Profile
app.get('/api/doctor', requireDoctorAuth, (req, res) => {
  const db = getDb();
  res.json(db.doctor);
});

// Update Doctor Profile
app.put('/api/doctor', requireDoctorAuth, (req, res) => {
  const db = getDb();
  db.doctor = { ...db.doctor, ...req.body };
  saveDb(db);
  res.json({ success: true, doctor: db.doctor });
});

// 2. Schedule Configuration
app.get('/api/schedule/config', requireDoctorAuth, (req, res) => {
  const db = getDb();
  res.json(db.scheduleConfig);
});

app.put('/api/schedule/config', requireDoctorAuth, (req, res) => {
  const db = getDb();
  db.scheduleConfig = { ...db.scheduleConfig, ...req.body };
  saveDb(db);
  res.json({ success: true, scheduleConfig: db.scheduleConfig });
});

// 3. Network IPs detection
app.get('/api/network-info', requireDoctorAuth, (req, res) => {
  const ips = getLocalNetworkIps();
  res.json({
    port: PORT,
    localhost: `http://localhost:${PORT}`,
    networkIps: ips.map(i => ({
      interface: i.interface,
      ip: i.ip,
      url: `http://${i.ip}:${PORT}`
    }))
  });
});

// 4. Appointments list with filters
app.get('/api/appointments', requireDoctorAuth, (req, res) => {
  const { date, status, search } = req.query;
  const db = getDb();
  let list = db.appointments || [];

  if (date) {
    list = list.filter(a => a.date === date);
  }
  if (status && status !== 'all') {
    list = list.filter(a => a.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a =>
      (a.patientName && a.patientName.toLowerCase().includes(q)) ||
      (a.patientPhone && a.patientPhone.includes(q)) ||
      (a.id && a.id.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.tokenNumber || 0) - (b.tokenNumber || 0);
  });

  res.json(list);
});

// 5. Add Walk-In Patient (from Doctor Portal)
app.post('/api/appointments/walkin', requireDoctorAuth, (req, res) => {
  const {
    patientName,
    patientPhone,
    patientEmail,
    age,
    gender,
    reason,
    date,
    timeSlot
  } = req.body;

  if (!patientName || !patientPhone || !date || !timeSlot) {
    return res.status(400).json({ error: 'Missing required walk-in fields.' });
  }

  const phoneCheck = validateIndianPhone(patientPhone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ error: phoneCheck.error });
  }

  const db = getDb();

  const existing = db.appointments.find(
    a => a.date === date && a.timeSlot === timeSlot && a.status !== 'cancelled'
  );
  if (existing) {
    return res.status(409).json({ error: 'Slot is already booked.' });
  }

  const todayAppts = db.appointments.filter(a => a.date === date);
  const nextToken = todayAppts.length + 1;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const apptId = `APT-${randomSuffix}`;

  const walkInAppt = {
    id: apptId,
    tokenNumber: nextToken,
    doctorId: db.doctor.id,
    patientName: sanitizeText(patientName),
    patientPhone: phoneCheck.normalized,
    rawPhone10: phoneCheck.raw10,
    patientEmail: sanitizeText(patientEmail || ''),
    age: Number(age) || null,
    gender: sanitizeText(gender || 'Unspecified'),
    reason: sanitizeText(reason || 'Walk-in Consultation'),
    visitType: 'Walk-in',
    date,
    timeSlot,
    status: 'checked_in', // Walk-ins are immediately marked checked-in!
    doctorNotes: '',
    createdAt: new Date().toISOString()
  };

  db.appointments.unshift(walkInAppt);
  saveDb(db);

  res.status(201).json({
    success: true,
    appointment: walkInAppt
  });
});

// 6. Update appointment status / doctor notes
app.patch('/api/appointments/:id', requireDoctorAuth, (req, res) => {
  const { status, doctorNotes } = req.body;
  const db = getDb();
  const apptIndex = db.appointments.findIndex(a => a.id === req.params.id);

  if (apptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (status !== undefined) {
    db.appointments[apptIndex].status = status;
  }
  if (doctorNotes !== undefined) {
    db.appointments[apptIndex].doctorNotes = sanitizeText(doctorNotes);
  }

  saveDb(db);
  res.json({
    success: true,
    appointment: db.appointments[apptIndex]
  });
});

// 7. Overrides
app.get('/api/overrides', requireDoctorAuth, (req, res) => {
  const db = getDb();
  res.json(db.overrides || []);
});

app.post('/api/overrides', requireDoctorAuth, (req, res) => {
  const { date, time, type, reason } = req.body;
  if (!date || !type) {
    return res.status(400).json({ error: 'date and type are required' });
  }
  const db = getDb();
  const id = `ov-${Date.now()}`;
  const newOverride = {
    id,
    date,
    time: time || null,
    type,
    reason: sanitizeText(reason || (type === 'blocked_day' ? 'Doctor Leave' : 'Doctor Unavailable'))
  };

  db.overrides.push(newOverride);
  saveDb(db);
  res.status(201).json({ success: true, override: newOverride });
});

app.delete('/api/overrides/:id', requireDoctorAuth, (req, res) => {
  const db = getDb();
  const initialLen = db.overrides.length;
  db.overrides = db.overrides.filter(o => o.id !== req.params.id);
  if (db.overrides.length === initialLen) {
    return res.status(404).json({ error: 'Override not found' });
  }
  saveDb(db);
  res.json({ success: true, message: 'Override removed' });
});

// 8. Stats
app.get('/api/stats', requireDoctorAuth, (req, res) => {
  const todayStr = req.query.date || new Date().toISOString().split('T')[0];
  const db = getDb();
  const todayAppts = db.appointments.filter(a => a.date === todayStr);
  const slotData = generateSlotsForDate(todayStr, db);

  res.json({
    date: todayStr,
    totalBooked: todayAppts.length,
    checkedIn: todayAppts.filter(a => a.status === 'checked_in').length,
    inConsultation: todayAppts.filter(a => a.status === 'in_consultation').length,
    completed: todayAppts.filter(a => a.status === 'completed').length,
    cancelled: todayAppts.filter(a => a.status === 'cancelled').length,
    availableSlotsRemaining: slotData.summary.available,
    totalSlotsConfigured: slotData.summary.total,
    isDayOff: slotData.isDayOff
  });
});

// -------------------------------------------------------------
// Serve Frontend & SPA Catch-all
// -------------------------------------------------------------
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('API Server is running. Frontend build in progress or available via dev server.');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🩺 Doctor QR Appointment & Slot Management System`);
  console.log(`🔒 Security: Helmet & Rate Limiting Active`);
  console.log(`🇮🇳 Indian Mobile Validation & ₹ Currency Active`);
  console.log(`Local Access:   http://localhost:${PORT}`);
  const ips = getLocalNetworkIps();
  ips.forEach(i => {
    console.log(`Network Access: http://${i.ip}:${PORT}  (${i.interface})`);
  });
  console.log(`Doctor Portal:  http://localhost:${PORT}/doctor`);
  console.log(`======================================================\n`);
});
