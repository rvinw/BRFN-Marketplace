const BASE = 'http://localhost:8000/api/admin';

export function adminFetch(path, options = {}) {
  const token = localStorage.getItem('brfn_token');
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}
