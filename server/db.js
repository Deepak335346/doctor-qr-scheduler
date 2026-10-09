import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'clinic_data.json');

const defaultData = {
  doctor: {
    id: "dr-sarah-jenkins",
    name: "Dr. Sarah Jenkins",
    qualifications: "MBBS, MD (Internal Medicine) - Reg No: KMC-74291",
    specialty: "Senior Consultant Physician & Family Medicine",
    experience: "12+ Years Clinical Experience",
    clinicName: "Aura Health & Care Multi-Specialty Clinic",
    chamber: "Chamber #204 (2nd Floor)",
    address: "402 100ft Road, Indiranagar, Bengaluru, Karnataka 560038",
    phone: "+91 98451 20400",
    email: "dr.jenkins@aurahealth.in",
    consultationFee: "₹500 / Consultation",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350",
    bio: "Specializing in family preventive care, acute seasonal infections, diabetes & hypertension maintenance, and comprehensive annual health reviews.",
    clinicHoursNote: "QR Bookings & Walk-ins welcomed. Reception counter located on 2nd Floor."
  },
  scheduleConfig: {
    slotDuration: 15, // minutes
    maxPatientsPerSlot: 1,
    days: {
      "Monday": {
        enabled: true,
        shifts: [
          { start: "09:00", end: "13:00" },
          { start: "16:00", end: "20:00" }
        ]
      },
      "Tuesday": {
        enabled: true,
        shifts: [
          { start: "09:00", end: "13:00" },
          { start: "16:00", end: "20:00" }
        ]
      },
      "Wednesday": {
        enabled: true,
        shifts: [
          { start: "09:00", end: "13:00" },
          { start: "16:00", end: "20:00" }
        ]
      },
      "Thursday": {
        enabled: true,
        shifts: [
          { start: "09:00", end: "13:00" },
          { start: "16:00", end: "20:00" }
        ]
      },
      "Friday": {
        enabled: true,
        shifts: [
          { start: "09:00", end: "13:00" },
          { start: "16:00", end: "20:00" }
        ]
      },
      "Saturday": {
        enabled: true,
        shifts: [
          { start: "09:30", end: "14:30" }
        ]
      },
      "Sunday": {
        enabled: false,
        shifts: []
      }
    }
  },
  overrides: [
    {
      id: "ov-1",
      date: "2026-10-12",
      type: "blocked_day",
      reason: "Attending Annual Physicians Summit"
    },
    {
      id: "ov-2",
      date: "2026-10-08",
      time: "11:15 AM",
      type: "blocked_slot",
      reason: "Reserved for Hospital Inpatient Rounds"
    }
  ],
  appointments: [
    {
      id: "APT-8821",
      tokenNumber: 1,
      doctorId: "dr-sarah-jenkins",
      patientName: "Rahul Sharma",
      patientPhone: "+91 98451 23456",
      patientEmail: "rahul.sharma@example.in",
      age: 38,
      gender: "Male",
      reason: "Persistent seasonal dry cough and mild fever for 3 days",
      visitType: "First Visit",
      date: "2026-10-08",
      timeSlot: "09:15 AM",
      status: "completed",
      doctorNotes: "Prescribed antihistamines and throat lozenges. Advised hydration.",
      createdAt: "2026-10-07T18:30:00.000Z"
    },
    {
      id: "APT-8822",
      tokenNumber: 2,
      doctorId: "dr-sarah-jenkins",
      patientName: "Priyanka Patel",
      patientPhone: "+91 91234 56789",
      patientEmail: "priyanka.p@example.in",
      age: 29,
      gender: "Female",
      reason: "Routine quarterly blood sugar and blood pressure review",
      visitType: "Follow-up",
      date: "2026-10-08",
      timeSlot: "10:00 AM",
      status: "in_consultation",
      doctorNotes: "BP: 118/76. Fasting glucose normal.",
      createdAt: "2026-10-08T08:15:00.000Z"
    },
    {
      id: "APT-8823",
      tokenNumber: 3,
      doctorId: "dr-sarah-jenkins",
      patientName: "Anand Verma",
      patientPhone: "+91 97890 12345",
      patientEmail: "anand.v@example.in",
      age: 52,
      gender: "Male",
      reason: "Lower back strain and stiffness after travel",
      visitType: "First Visit",
      date: "2026-10-08",
      timeSlot: "10:45 AM",
      status: "checked_in",
      doctorNotes: "",
      createdAt: "2026-10-08T09:00:00.000Z"
    },
    {
      id: "APT-8824",
      tokenNumber: 4,
      doctorId: "dr-sarah-jenkins",
      patientName: "Sneha Kulkarni",
      patientPhone: "+91 96543 21098",
      patientEmail: "sneha.k@example.in",
      age: 41,
      gender: "Female",
      reason: "Seasonal allergy flare-up and headache",
      visitType: "Follow-up",
      date: "2026-10-08",
      timeSlot: "04:15 PM",
      status: "booked",
      doctorNotes: "",
      createdAt: "2026-10-08T09:45:00.000Z"
    }
  ],
  credentials: {
    username: "doctor",
    password: "Doctor@2026",
    pin: "782104",
    updatedAt: new Date().toISOString()
  }
};
// Mongoose Schema for persistent cloud database storage (MongoDB Atlas)
const clinicSchema = new mongoose.Schema({
  _id: { type: String, default: 'clinic_primary' },
  doctor: { type: mongoose.Schema.Types.Mixed },
  scheduleConfig: { type: mongoose.Schema.Types.Mixed },
  overrides: { type: Array, default: [] },
  appointments: { type: Array, default: [] },
  credentials: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'clinic_data', minimize: false });

const ClinicModel = mongoose.models.ClinicData || mongoose.model('ClinicData', clinicSchema);

let cachedDb = null;
let isCloudConnected = false;

// Ensure local data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

function readLocalDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading local database file, using fallback:", err);
    return defaultData;
  }
}

// Connect to Cloud Database (MongoDB Atlas) for production persistence
export async function connectCloudDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('📦 Database Mode: Local JSON File (server/data/clinic_data.json)');
    console.log('💡 Note: Set MONGODB_URI in production for zero-data-loss cloud persistence across deployments.');
    return false;
  }

  try {
    console.log('🔄 Connecting to Cloud MongoDB Atlas...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isCloudConnected = true;
    console.log('☁️  Connected to Cloud MongoDB Atlas successfully!');

    // Check if cloud document exists; if not, migrate local data
    const cloudDoc = await ClinicModel.findById('clinic_primary');
    if (!cloudDoc) {
      console.log('🌱 First-time cloud setup: Migrating local clinic records to MongoDB Atlas...');
      const localData = readLocalDb();
      await ClinicModel.create({ _id: 'clinic_primary', ...localData });
      cachedDb = localData;
    } else {
      cachedDb = cloudDoc.toObject();
      // Mirror to local disk for offline caching
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
      } catch (e) {}
      console.log('✅ Loaded persistent clinic records from Cloud MongoDB.');
    }
    return true;
  } catch (err) {
    console.error('⚠️  Cloud MongoDB connection failed:', err.message);
    console.log('↪️  Falling back to local file storage (server/data/clinic_data.json)');
    isCloudConnected = false;
    return false;
  }
}

// Load database (cached in-memory for instant read performance)
export function getDb() {
  if (cachedDb) return cachedDb;
  cachedDb = readLocalDb();
  return cachedDb;
}

// Save database (persists to local file and syncs to MongoDB Atlas if connected)
export function saveDb(data) {
  cachedDb = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing local database file:", err);
  }

  // If connected to Cloud MongoDB, sync asynchronously
  if (isCloudConnected && mongoose.connection.readyState === 1) {
    ClinicModel.findByIdAndUpdate(
      'clinic_primary',
      { ...data, updatedAt: new Date() },
      { upsert: true }
    ).catch(err => console.error('Cloud MongoDB sync error:', err.message));
  }
  return true;
}

// Initialize or update data file with Indian localization & credentials
export function initDb() {
  const current = getDb();
  let modified = false;

  // Ensure Indian currency symbol and details are applied if not present
  if (!current.doctor.consultationFee.includes('₹')) {
    current.doctor = {
      ...defaultData.doctor,
      ...current.doctor,
      consultationFee: "₹500 / Consultation",
      address: "402 100ft Road, Indiranagar, Bengaluru, Karnataka 560038",
      phone: "+91 98451 20400"
    };
    modified = true;
  }

  // Ensure credentials object exists
  if (!current.credentials) {
    current.credentials = {
      username: process.env.DOCTOR_USERNAME || "doctor",
      password: process.env.DOCTOR_PASSWORD || "Doctor@2026",
      pin: process.env.DOCTOR_PIN || "782104",
      updatedAt: new Date().toISOString()
    };
    modified = true;
  }

  if (modified) {
    saveDb(current);
  }
}

initDb();
