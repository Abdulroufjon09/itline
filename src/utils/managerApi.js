// Menejer paneli uchun API chaqiruvlari.
//
// Ustoz o'chirish / o'quvchi ko'chirish kabi amallar backendda
// 'X-User-Phone' sarlavhasini talab qiladi — u orqali chaqiruvchi
// menejer yoki ustozligi tekshiriladi.
import { API_BASE } from "@/config";

export const API = `${API_BASE}/api`;

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function headers() {
  const h = { "Content-Type": "application/json" };
  const phone = currentUser()?.phone;
  if (phone) h["X-User-Phone"] = phone;
  return h;
}

/** Javobni {ok, data} ko'rinishida qaytaradi — chaqiruvchi xatoni o'zi ko'rsatadi. */
export async function apiCall(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: headers(), ...options });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { ok: res.ok, status: res.status, data };
}

export const apiGet = (path) => apiCall(path);

export const apiSend = (path, method, body) =>
  apiCall(path, { method, body: JSON.stringify(body ?? {}) });
