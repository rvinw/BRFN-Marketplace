const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('brfn_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

export const apiFetch = (path, options) =>
  fetchWithAuth(`${API_URL}/api${path}`, options);
