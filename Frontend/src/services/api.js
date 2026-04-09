// ─── API Service Layer ───────────────────────────────────────────────────────
// Switch USE_MOCK_DATA to false and set BASE_URL to connect to a real backend.
// All components import from here — no component needs to change when you go live.

const USE_MOCK_DATA = true  // ← set to false when backend is ready
const BASE_URL = 'https://api.freepathshala.org/v1'  // ← update with real URL

// ── helpers ─────────────────────────────────────────────────────────────────
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ── lazy import of mock data (tree-shakeable when USE_MOCK_DATA = false) ─────
let _mock = null;

async function getMock() {
  if (!_mock) _mock = await import("../data/mockData.js");
  return _mock;
}

// ═══════════════════════════════════════════════════════════════════════════
// DONORS
// ═══════════════════════════════════════════════════════════════════════════
let _donors = null   // in-memory store while using mock

export async function fetchDonors() {
  if (!USE_MOCK_DATA) return apiFetch('/donors')
  await delay()
  const { donors } = await getMock()
  if (!_donors) _donors = [...donors]
  return [..._donors]
}

export async function createDonor(data) {
  if (!USE_MOCK_DATA) return apiFetch('/donors', { method: 'POST', body: JSON.stringify(data) })
  await delay()
  const { donors } = await getMock()
  if (!_donors) _donors = [...donors]
  const newD = { ...data, id: `D${Date.now()}`, totalRST: 0, totalSKS: 0, createdAt: new Date().toISOString().slice(0,10) }
  _donors = [newD, ..._donors]
  return newD
}

export async function updateDonor(id, data) {
  if (!USE_MOCK_DATA) return apiFetch(`/donors/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  await delay()
  _donors = _donors.map(d => d.id === id ? { ...d, ...data } : d)
  return _donors.find(d => d.id === id)
}

export async function deleteDonor(id) {
  if (!USE_MOCK_DATA) return apiFetch(`/donors/${id}`, { method: 'DELETE' })
  await delay()
  _donors = _donors.filter(d => d.id !== id)
  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════════════
// PICKUPS
// ═══════════════════════════════════════════════════════════════════════════
let _pickups = null

export async function fetchPickups() {
  if (!USE_MOCK_DATA) return apiFetch('/pickups')
  await delay()
  const { pickups } = await getMock()
  if (!_pickups) _pickups = [...pickups]
  return [..._pickups]
}

export async function createPickup(data) {
  if (!USE_MOCK_DATA) return apiFetch('/pickups', { method: 'POST', body: JSON.stringify(data) })
  await delay()
  const { pickups } = await getMock()
  if (!_pickups) _pickups = [...pickups]
  const id = `FP-${Date.now().toString().slice(-6)}`
  const newP = { ...data, id }
  _pickups = [newP, ..._pickups]
  return newP
}

export async function updatePickup(id, data) {
  if (!USE_MOCK_DATA) return apiFetch(`/pickups/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  await delay()
  _pickups = _pickups.map(p => p.id === id ? { ...p, ...data } : p)
  return _pickups.find(p => p.id === id)
}

export async function deletePickup(id) {
  if (!USE_MOCK_DATA) return apiFetch(`/pickups/${id}`, { method: 'DELETE' })
  await delay()
  _pickups = _pickups.filter(p => p.id !== id)
  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════════════
// KABADIWALAS
// ═══════════════════════════════════════════════════════════════════════════
let _kabs = null

export async function fetchKabadiwalas() {
  if (!USE_MOCK_DATA) return apiFetch('/kabadiwalas')
  await delay()
  const { kabadiwalas } = await getMock()
  if (!_kabs) _kabs = [...kabadiwalas]
  return [..._kabs]
}

export async function createKabadiwala(data) {
  if (!USE_MOCK_DATA) return apiFetch('/kabadiwalas', { method: 'POST', body: JSON.stringify(data) })
  await delay()
  const { kabadiwalas } = await getMock()
  if (!_kabs) _kabs = [...kabadiwalas]
  const newK = { ...data, id: `K${Date.now()}`, rating: 4.0, totalPickups: 0, totalValue: 0, amountReceived: 0, pendingAmount: 0, transactions: [] }
  _kabs = [..._kabs, newK]
  return newK
}

export async function updateKabadiwala(id, data) {
  if (!USE_MOCK_DATA) return apiFetch(`/kabadiwalas/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  await delay()
  _kabs = _kabs.map(k => k.id === id ? { ...k, ...data } : k)
  return _kabs.find(k => k.id === id)
}

export async function deleteKabadiwala(id) {
  if (!USE_MOCK_DATA) return apiFetch(`/kabadiwalas/${id}`, { method: 'DELETE' })
  await delay()
  _kabs = _kabs.filter(k => k.id !== id)
  return { success: true }
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════
export async function fetchDashboardStats() {
  if (!USE_MOCK_DATA) return apiFetch('/dashboard/stats')
  await delay()
  const { getDashboardStats, monthlyData, itemBreakdown } = await getMock()
  return { stats: getDashboardStats(), monthlyData, itemBreakdown }
}

// ═══════════════════════════════════════════════════════════════════════════
// WA TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════
let _templates = null

export async function fetchWATemplates() {
  if (!USE_MOCK_DATA) return apiFetch('/whatsapp/templates')
  await delay()
  const { waTemplates } = await getMock()
  if (!_templates) _templates = [...waTemplates]
  return [..._templates]
}

export async function updateWATemplate(id, data) {
  if (!USE_MOCK_DATA) return apiFetch(`/whatsapp/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  await delay()
  _templates = _templates.map(t => t.id === id ? { ...t, ...data } : t)
  return _templates.find(t => t.id === id)
}