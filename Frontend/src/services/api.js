const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const DEFAULT_GET_CACHE_TTL_MS = 60_000
const MASTER_DATA_CACHE_TTL_MS = 10 * 60_000

const getRequestCache = new Map()

function getAuthToken() {
  return localStorage.getItem('fp_id_token') || ''
}

export function clearApiCache() {
  getRequestCache.clear()
}

export function invalidateApiCache(predicate) {
  if (!predicate) {
    clearApiCache()
    return
  }

  for (const [key, entry] of getRequestCache.entries()) {
    if (predicate(entry.path, entry)) getRequestCache.delete(key)
  }
}

function setSession(session) {
  clearApiCache()
  if (session?.idToken) localStorage.setItem('fp_id_token', session.idToken)
  if (session?.refreshToken) localStorage.setItem('fp_refresh_token', session.refreshToken)
  if (session?.user?.role) localStorage.setItem('fp_role', String(session.user.role).toLowerCase())
}

function clearSession() {
  clearApiCache()
  localStorage.removeItem('fp_id_token')
  localStorage.removeItem('fp_refresh_token')
  localStorage.removeItem('fp_role')
}

function toQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.set(key, value)
    })

  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

function isFile(value) {
  return typeof File !== 'undefined' && value instanceof File
}

function appendFormDataValue(formData, key, value) {
  if (value === undefined || key.startsWith('_')) return
  if (isFile(value)) {
    formData.append(key, value)
    return
  }
  if (value === null) {
    formData.append(key, 'null')
    return
  }
  if (Array.isArray(value) || (value && typeof value === 'object')) {
    formData.append(key, JSON.stringify(value))
    return
  }
  formData.append(key, String(value))
}

function toPartnerFormData(data = {}) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => appendFormDataValue(formData, key, value))
  return formData
}

function cacheKey(path, token) {
  return `${token || 'anonymous'}::${path}`
}

export async function apiFetch(path, options = {}) {
  const {
    cacheTtl = DEFAULT_GET_CACHE_TTL_MS,
    dedupe = true,
    force = false,
    ...fetchOptions
  } = options

  const method = (fetchOptions.method || 'GET').toUpperCase()
  const token = getAuthToken()
  const shouldCacheGet = method === 'GET' && dedupe !== false
  const key = shouldCacheGet ? cacheKey(path, token) : ''

  if (shouldCacheGet && !force) {
    const cached = getRequestCache.get(key)
    const now = Date.now()
    if (cached?.data !== undefined && cached.expiresAt > now) return cached.data
    if (cached?.promise) return cached.promise
  }

  const request = (async () => {
    const headers = new Headers(fetchOptions.headers || {})

    if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      method,
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
  })()

  if (shouldCacheGet) {
    getRequestCache.set(key, {
      path,
      token,
      promise: request,
      data: undefined,
      expiresAt: 0,
    })
  }

  try {
    const data = await request
    if (shouldCacheGet) {
      getRequestCache.set(key, {
        path,
        token,
        promise: null,
        data,
        expiresAt: Date.now() + Math.max(0, cacheTtl),
      })
    } else if (method !== 'GET') {
      clearApiCache()
    }
    return data
  } catch (error) {
    if (shouldCacheGet) getRequestCache.delete(key)
    throw error
  }
}

// Auth
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

export const fetchCurrentUser = options => apiFetch('/auth/me', options)
export const forgotPassword = email =>
  apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
export const changePassword = (currentPassword, newPassword) =>
  apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })

// Master data
export const fetchMasterData = options =>
  apiFetch('/master-data', { cacheTtl: MASTER_DATA_CACHE_TTL_MS, ...options })
export const fetchLocations = options =>
  apiFetch('/locations/tree', { cacheTtl: MASTER_DATA_CACHE_TTL_MS, ...options })

export const fetchRstItems = options =>
  apiFetch('/master-data/rst-items', { cacheTtl: MASTER_DATA_CACHE_TTL_MS, ...options })
export const createRstItem = data =>
  apiFetch('/master-data/rst-items', { method: 'POST', body: JSON.stringify(data) })
export const updateRstItem = (id, data) =>
  apiFetch(`/master-data/rst-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteRstItem = id =>
  apiFetch(`/master-data/rst-items/${id}`, { method: 'DELETE' })

export const fetchSksItems = options =>
  apiFetch('/master-data/sks-items', { cacheTtl: MASTER_DATA_CACHE_TTL_MS, ...options })
export const createSksItem = data =>
  apiFetch('/master-data/sks-items', { method: 'POST', body: JSON.stringify(data) })
export const updateSksItem = (id, data) =>
  apiFetch(`/master-data/sks-items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteSksItem = id =>
  apiFetch(`/master-data/sks-items/${id}`, { method: 'DELETE' })

export const createLocation = data =>
  apiFetch('/locations', { method: 'POST', body: JSON.stringify(data) })
export const deleteCity = id =>
  apiFetch(`/locations/cities/${id}`, { method: 'DELETE' })
export const deleteSector = id =>
  apiFetch(`/locations/sectors/${id}`, { method: 'DELETE' })
export const deleteSociety = id =>
  apiFetch(`/locations/societies/${id}`, { method: 'DELETE' })

// Users
export const fetchUsers = (params, options) => apiFetch(`/users${toQuery(params)}`, options)
export const createUser = data =>
  apiFetch('/users', { method: 'POST', body: JSON.stringify(data) })
export const updateUser = (id, data) =>
  apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteUser = id =>
  apiFetch(`/users/${id}`, { method: 'DELETE' })

// Donors
export const fetchDonors = (params, options) => apiFetch(`/donors${toQuery(params)}`, options)
export const createDonor = data =>
  apiFetch('/donors', { method: 'POST', body: JSON.stringify(data) })
export const updateDonor = (id, data) =>
  apiFetch(`/donors/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteDonor = id =>
  apiFetch(`/donors/${id}`, { method: 'DELETE' })

// Pickups
export const fetchPickups = (params, options) => apiFetch(`/pickups${toQuery(params)}`, options)
export const createPickup = data =>
  apiFetch('/pickups', { method: 'POST', body: JSON.stringify(data) })
export const updatePickup = (id, data) =>
  apiFetch(`/pickups/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const recordPickup = (id, data) =>
  apiFetch(`/pickups/${id}/record`, { method: 'POST', body: JSON.stringify(data) })
export const deletePickup = id =>
  apiFetch(`/pickups/${id}`, { method: 'DELETE' })

export const fetchRaddiRecords = (params, options) =>
  apiFetch(`/pickups/raddi-records${toQuery(params)}`, options)

// Pickup partners
export const fetchPickupPartners = (params, options) =>
  apiFetch(`/pickup-partners${toQuery(params)}`, options)
export const createPickupPartner = data =>
  apiFetch('/pickup-partners', { method: 'POST', body: toPartnerFormData(data) })
export const updatePickupPartner = (id, data) =>
  apiFetch(`/pickup-partners/${id}`, { method: 'PATCH', body: toPartnerFormData(data) })
export const deletePickupPartner = id =>
  apiFetch(`/pickup-partners/${id}`, { method: 'DELETE' })

// Payments
export const fetchPayments = (params, options) => apiFetch(`/payments${toQuery(params)}`, options)

export const fetchPartnerSummary = (params, options) =>
  apiFetch(`/payments/partners/summary${toQuery(params)}`, options)

export const recordPickupPartnerPayment = (partnerId, data) =>
  apiFetch(`/payments/partners/${partnerId}/record`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const clearPartnerBalance = (partnerId, data) =>
  apiFetch(`/payments/partners/${partnerId}/clear-balance`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

// SKS
export const fetchSksInflows = (params, options) =>
  apiFetch(`/sks/inflows${toQuery(params)}`, options)
export const createSksInflow = data =>
  apiFetch('/sks/inflows', { method: 'POST', body: JSON.stringify(data) })
export const deleteSksInflow = id =>
  apiFetch(`/sks/inflows/${id}`, { method: 'DELETE' })
export const fetchSksOutflows = (params, options) =>
  apiFetch(`/sks/outflows${toQuery(params)}`, options)
export const createSksOutflow = data =>
  apiFetch('/sks/outflows', { method: 'POST', body: JSON.stringify(data) })
export const deleteSksOutflow = id =>
  apiFetch(`/sks/outflows/${id}`, { method: 'DELETE' })
export const fetchSksStock = options => apiFetch('/sks/stock', options)

// Dashboard
export const fetchDashboardStats = (params, options) =>
  apiFetch(`/dashboard/stats${toQuery(params)}`, options)
export const fetchSchedulerSummary = options => apiFetch('/dashboard/scheduler', options)

// Uploads
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
