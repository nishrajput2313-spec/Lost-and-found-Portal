// ---------------------------------------------------------------
// Central place to point the frontend at the backend.
// Change API_BASE if your Express server runs somewhere else.
// ---------------------------------------------------------------
const API_BASE = "https://lost-found-portall-2.onrender.com";

async function apiFetch(path, { method = "GET", body, isFormData = false, auth = false } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = localStorage.getItem("dpg-lnf-token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}
