/**
 * Authenticated Fetch Helper for Doctor Portal
 */
export async function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('doctor_token');
  
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If unauthorized or token expired, clear session and reload
  if (response.status === 401) {
    sessionStorage.removeItem('doctor_token');
    window.dispatchEvent(new CustomEvent('doctor_session_expired'));
  }

  return response;
}
