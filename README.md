# 🩺 Doctor QR Appointment & Slot Management System

A production-ready web application designed for doctors and clinics to streamline patient appointment scheduling using scannable QR codes and real-time slot availability tracking.

---

## 🌟 Key Features

### 📱 1. Patient Experience (Mobile-First via QR Code Scan)
* **Instant Camera QR Scan:** Patients scan the QR code placed at the clinic front desk, waiting lounge, or prescription slip to open the booking portal on their smartphone.
* **Separated & Protected:** The patient booking view contains **zero doctor controls**. Patients can only view available slots and book their appointment.
* **🇮🇳 Indian Mobile & Email Validation:**
  * Strict validation for 10-digit Indian mobile numbers starting with **6, 7, 8, or 9** (accepts optional `+91` prefix with visual flag badge).
  * Standard RFC-compliant email validation.
  * Clinic consultation fee displayed in Indian Rupees (**₹**).
* **Interactive 14-Day Calendar:** Scroll across the upcoming 14 days with visual indicators showing available slots vs closed days.
* **Dynamic Time Slots Matrix:** Split into **Morning**, **Afternoon**, and **Evening** sessions with real-time status:
  * 🟢 **Available:** Real-time clickable slots.
  * ⚪ **Booked:** Taken by another patient (auto-locked against double-booking).
  * 🟡 **Doctor Break / Reserved:** Blocked for rounds, surgery, or leave.
* **Digital Appointment Pass & Queue Token:**
  * Sequential Queue Token number (e.g., `#01`, `#02`, `#03`...) for clinic queues.
  * Unique Reference ID (e.g., `APT-8823`).
  * Mini reception check-in QR code.
  * One-click actions: Print/Save Pass, Add to Google Calendar, and Copy Booking Details.
* **🔒 Privacy-Preserving "Find My Booking":**
  * Patients can retrieve their pass anytime by entering **both** their Booking ID and their registered 10-digit mobile number, preventing unauthorized access to other patients' records.

---

### 🔐 2. Doctor Portal & Administration (`/doctor`)
* **Dedicated & Authenticated Route:**
  * Accessed strictly at `/doctor`.
  * Secure login via **Doctor Security PIN** (default: `782104`) or **Username & Password** (default: `doctor` / `Doctor@2026`).
  * Protected by JSON Web Tokens (JWT) with 24-hour session expiry and rate-limit brute-force protection.
  * One-click **Log Out** button.
* **Live Queue & Appointments Dashboard:**
  * Filter by date and status (*All, Booked, Checked In, In Consultation, Completed, Cancelled*).
  * Live KPI metric counters: Total Bookings, Checked In (Waiting), In Consultation, Completed, Cancelled.
  * One-Click Progression: `[Mark Arrived/Checked-In]` ➔ `[Start Consultation]` ➔ `[Mark Completed]`.
  * **Inline Clinical Notes:** Doctors can write diagnosis observations, prescription notes, and review instructions directly on patient cards.
  * **Walk-in Patient Support:** Receptionist or doctor can book walk-in patients into any free slot with 1 click.
* **QR Code Generator & Printable Clinic Desk Standee:**
  * Scannable QR code generator pointing strictly to the patient booking page.
  * **Local Wi-Fi Network Auto-Detection:** Automatically detects your local network IP (e.g. `http://192.168.1.4:5000`) so smartphones connected to clinic Wi-Fi can scan and book instantly!
  * **Print Official Clinic Desk Standee:** Formatted A4/desk flyer template with clinic branding, doctor credentials, scannable QR code, and 3-step patient instructions.
  * Download QR code as PNG image.
* **Availability & Shift Management:**
  * Configure slot duration (15 min, 20 min, 30 min, 45 min, 60 min).
  * Weekly recurring schedule (Monday through Sunday) with multiple shifts per day.
  * Block whole days (conferences, leave) or specific time slots (rounds, emergency surgeries).
* **Doctor Profile Customization:**
  * Edit doctor name, medical specialty, qualifications, experience, clinic address, room number, and consultation fee in ₹.

---

## 🚀 Running Locally

### Prerequisites
* Node.js (v18 or higher)
* npm

### Quick Start
1. **Navigate to the project root:**
   ```powershell
   cd "C:\Users\Deepak\.gemini\antigravity\scratch\doctor-qr-scheduler"
   ```

2. **Start the application:**
   ```powershell
   npm.cmd start
   ```

3. **Access the application:**
   * **Patient Booking Interface:** [http://localhost:5000](http://localhost:5000)
   * **Doctor Administration Portal:** [http://localhost:5000/doctor](http://localhost:5000/doctor)

### Default Doctor Credentials
* **Quick PIN:** `782104`
* **Username:** `doctor`
* **Password:** `Doctor@2026`
*(Customizable in your `.env` file)*

---

## 🚢 Production Deployment

### Option A: Deploy with Docker
```bash
# Build Docker image
docker build -t doctor-qr-scheduler .

# Run container
docker run -d -p 5000:5000 --env-file .env doctor-qr-scheduler
```

### Option B: Deploy to Render.com / Railway
1. Push this repository to GitHub or GitLab.
2. In [Render.com](https://render.com), create a new **Blueprint** and connect the repository (`render.yaml` will auto-configure everything).
3. Set your production environment variables:
   * `JWT_SECRET`: A strong random string
   * `DOCTOR_PIN`: Your desired 6-digit PIN
   * `DOCTOR_PASSWORD`: Your desired secure password

### Option C: Deploy on Ubuntu / VPS with PM2
```bash
# Install dependencies & build frontend
npm install
npm run build

# Start production server with PM2
pm2 start server/server.js --name "doctor-qr"
pm2 save
```

---

## 🔒 Security Hardening Included
* **Helmet:** Sets secure HTTP headers (CSP, XSS filter, frameguard).
* **Rate Limiting:**
  * Global API: 300 req / 15 min.
  * Login route: 10 attempts / 15 min (anti-brute force).
  * Booking route: 25 bookings / 15 min per IP (anti-spam).
* **JWT Authentication:** Strict authorization required for all patient lists, clinical notes, and doctor schedule updates.
* **Privacy by Design:** Public appointment lookup requires matching both Booking ID and registered mobile number.
