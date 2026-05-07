const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function fetchWithAuth(url, options = {}) {
  const token = sessionStorage.getItem('brfn_token');
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

export async function getRecommendations(userId) {
  const response = await fetch(
    `${API_URL}/api/recommendations/${userId}/`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }

  return response.json();
}

export async function checkProduceFreshness(imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_URL}/api/ai/freshness-check/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to check produce freshness");
  }

  return response.json();
}