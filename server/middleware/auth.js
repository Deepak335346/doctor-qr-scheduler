import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_clinic_key_ind_2026_dr_apex';

/**
 * Generate a JWT token for the doctor session
 */
export function generateDoctorToken(payload = { role: 'doctor' }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h'
  });
}

/**
 * Express middleware to require Doctor Authentication
 */
export function requireDoctorAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized: Doctor access requires authentication token'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized: Malformed authorization header (Format: Bearer <token>)'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctor = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Session expired or invalid token. Please log in again.',
      expired: err.name === 'TokenExpiredError'
    });
  }
}
