/**
 * Validation utilities for Indian mobile numbers and emails
 */

/**
 * Validates Indian mobile numbers:
 * Must be 10 digits starting with 6, 7, 8, or 9.
 * Accepts optional +91, 91, or 0 prefix.
 *
 * @param {string} phone
 * @returns {{ isValid: boolean, normalized: string, raw10: string, error?: string }}
 */
export function validateIndianPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      normalized: '',
      raw10: '',
      error: 'Phone number is required'
    };
  }

  // Remove spaces, hyphens, parentheses, and dots
  const cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Extract the core 10-digit number
  let raw10 = '';

  if (cleaned.startsWith('+91')) {
    raw10 = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    raw10 = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    raw10 = cleaned.slice(1);
  } else {
    raw10 = cleaned;
  }

  // Check if exactly 10 digits
  if (!/^\d{10}$/.test(raw10)) {
    return {
      isValid: false,
      normalized: '',
      raw10: '',
      error: 'Please enter a valid 10-digit Indian mobile number'
    };
  }

  // First digit must be 6, 7, 8, or 9 in India
  if (!/^[6-9]/.test(raw10)) {
    return {
      isValid: false,
      normalized: '',
      raw10: '',
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9'
    };
  }

  // Formatted as +91 XXXXX XXXXX
  const normalized = `+91 ${raw10.slice(0, 5)} ${raw10.slice(5)}`;

  return {
    isValid: true,
    normalized,
    raw10,
    error: null
  };
}

/**
 * Validates email according to standard RFC 5322 regex
 *
 * @param {string} email
 * @param {boolean} required
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateEmail(email, required = false) {
  if (!email || email.trim() === '') {
    if (required) {
      return { isValid: false, error: 'Email is required' };
    }
    return { isValid: true, error: null };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const trimmed = email.trim();

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com)' };
  }

  return { isValid: true, error: null };
}

/**
 * Simple text sanitizer to prevent script injection
 * @param {string} str
 * @returns {string}
 */
export function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}
