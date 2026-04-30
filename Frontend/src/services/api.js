const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

function getAuthToken() {
  return localStorage.getItem('fp_id_token') || ''
}

function setSession(session) {
  if (session?.idToken) localStorage.setItem('fp_id_token', session.idToken)
  if (session?.refreshToken) localStorage.setItem('fp_refresh_token', session.refreshToken)
  if (session?.user?.role) localStorage.setItem('fp_role', session.user.role)
}

function clearSession() {
  localStorage.removeItem('fp_id_token')
  localStorage.removeItem('fp_refresh_token')
  localStorage.removeItem('fp_role')
}

function toQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getAuthToken()

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.success === false) {
    const message = payload.error?.message || `API error ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.code = payload.error?.code
    error.details = payload.error?.details
    if (response.status === 401) clearSession()
    throw error
  }

  return payload.data ?? payload
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const session = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setSession(session)
  return session
}

export async function logout() {
  try {
    if (getAuthToken()) await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    clearSession()
  }
}

export async function refreshToken() {
  const refreshTokenValue = localStorage.getItem('fp_refresh_token')
  if (!refreshTokenValue) throw new Error('Missing refresh token')
  const session = await apiFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  })
  setSession(session)
  return session
}

export const fetchCurrentUser = () => apiFetch('/auth/me')
export const forgotPassword   = email => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
export const changePassword   = (currentPassword, newPassword) =>
  apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) })

// ── Master Data ───────────────────────────────────────────────────────────────
export const fetchMasterData = () => apiFetch('/master-data')
export const fetchLocations  = () => apiFetch('/locations/tree')

export const fetchRstItems  = () => apiFetch('/master-data/rst-items')
export const createRstItem  = data => apiFetch('/master-data/rst-items', { method: 'POST', body: JSON.stringify(data) })
export const updateRstItem  = (id, data) => apiFetch(`/master-data/rst-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteRstItem  = id => apiFetch(`/master-data/rst-items/${id}`, { method: 'DELETE' })

export const fetchSksItems  = () => apiFetch('/master-data/sks-items')
export const createSksItem  = data => apiFetch('/master-data/sks-items', { method: 'POST', body: JSON.stringify(data) })
export const updateSksItem  = (id, data) => apiFetch(`/master-data/sks-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteSksItem  = id => apiFetch(`/master-data/sks-items/${id}`, { method: 'DELETE' })

export const createLocation = data => apiFetch('/locations', { method: 'POST', body: JSON.stringify(data) })
export const deleteCity     = id => apiFetch(`/locations/cities/${id}`, { method: 'DELETE' })
export const deleteSector   = id => apiFetch(`/locations/sectors/${id}`, { method: 'DELETE' })
export const deleteSociety  = id => apiFetch(`/locations/societies/${id}`, { method: 'DELETE' })

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchUsers  = params => apiFetch(`/users${toQuery(params)}`)
export const createUser  = data   => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) })
export const updateUser  = (id, data) => apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteUser  = id => apiFetch(`/users/${id}`, { method: 'DELETE' })

// ── Donors ────────────────────────────────────────────────────────────────────
export const fetchDonors  = params => apiFetch(`/donors${toQuery(params)}`)
export const createDonor  = data   => apiFetch('/donors', { method: 'POST', body: JSON.stringify(data) })
export const updateDonor  = (id, data) => apiFetch(`/donors/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteDonor  = id => apiFetch(`/donors/${id}`, { method: 'DELETE' })

// ── Pickups ───────────────────────────────────────────────────────────────────
export const fetchPickups  = params => apiFetch(`/pickups${toQuery(params)}`)
export const createPickup  = data   => apiFetch('/pickups', { method: 'POST', body: JSON.stringify(data) })
export const updatePickup  = (id, data) => apiFetch(`/pickups/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const recordPickup  = (id, data) => apiFetch(`/pickups/${id}/record`, { method: 'POST', body: JSON.stringify(data) })
export const deletePickup  = id => apiFetch(`/pickups/${id}`, { method: 'DELETE' })

/**
 * fetchRaddiRecords — backend-filtered raddi records.
 * Returns { records: [], pagination: { page, pageSize, total, pages } }
 * Supported params: dateFrom, dateTo, city, sector, partnerId, paymentStatus,
 *                   q, limit, page, pageSize
 */
export const fetchRaddiRecords = params => apiFetch(`/pickups/raddi-records${toQuery(params)}`)

// ── Pickup Partners ───────────────────────────────────────────────────────────
export const fetchPickupPartners  = params => apiFetch(`/pickup-partners${toQuery(params)}`)
export const createPickupPartner  = data   => apiFetch('/pickup-partners', { method: 'POST', body: JSON.stringify(data) })
export const updatePickupPartner  = (id, data) => apiFetch(`/pickup-partners/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deletePickupPartner  = id => apiFetch(`/pickup-partners/${id}`, { method: 'DELETE' })

// ── Payments ──────────────────────────────────────────────────────────────────
export const fetchPayments = params => apiFetch(`/payments${toQuery(params)}`)

/**
 * fetchPartnerSummary — backend-computed per-partner payment grouping.
 * Returns { partners: [], summary: {}, filters: {} }
 * Supported params: dateFrom, dateTo, partnerId, search, status (pending|clear|all)
 */
export const fetchPartnerSummary = params => apiFetch(`/payments/partners/summary${toQuery(params)}`)

export const recordPickupPartnerPayment = (partnerId, data) =>
  apiFetch(`/payments/partners/${partnerId}/record`, { method: 'POST', body: JSON.stringify(data) })

export const clearPartnerBalance = (partnerId, data) =>
  apiFetch(`/payments/partners/${partnerId}/clear-balance`, { method: 'POST', body: JSON.stringify(data) })

// ── SKS ───────────────────────────────────────────────────────────────────────
export const fetchSksInflows   = params => apiFetch(`/sks/inflows${toQuery(params)}`)
export const createSksInflow   = data   => apiFetch('/sks/inflows', { method: 'POST', body: JSON.stringify(data) })
export const deleteSksInflow   = id     => apiFetch(`/sks/inflows/${id}`, { method: 'DELETE' })
export const fetchSksOutflows  = params => apiFetch(`/sks/outflows${toQuery(params)}`)
export const createSksOutflow  = data   => apiFetch('/sks/outflows', { method: 'POST', body: JSON.stringify(data) })
export const deleteSksOutflow  = id     => apiFetch(`/sks/outflows/${id}`, { method: 'DELETE' })
export const fetchSksStock     = ()     => apiFetch('/sks/stock')

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboardStats  = params => apiFetch(`/dashboard/stats${toQuery(params)}`)
export const fetchSchedulerSummary = ()   => apiFetch('/dashboard/scheduler')

// ── Uploads ───────────────────────────────────────────────────────────────────
export const createUploadSignedUrl = data =>
  apiFetch('/uploads/signed-url', { method: 'POST', body: JSON.stringify(data) })

export const createReadSignedUrl = storagePath =>
  apiFetch('/uploads/read-url', { method: 'POST', body: JSON.stringify({ storagePath }) })

export async function uploadFileViaSignedUrl(file, { purpose = 'general', entityId = 'general' } = {}) {
  const upload = await createUploadSignedUrl({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    purpose,
    entityId,
  })

  const response = await fetch(upload.signedUrl, {
    method: upload.method || 'PUT',
    headers: { 'Content-Type': upload.contentType },
    body: file,
  })

  if (!response.ok) throw new Error(`File upload failed (${response.status})`)

  const read = await createReadSignedUrl(upload.storagePath)
  return {
    storagePath: upload.storagePath,
    url: read.signedUrl,
    contentType: upload.contentType,
    fileName: file.name,
  }
}