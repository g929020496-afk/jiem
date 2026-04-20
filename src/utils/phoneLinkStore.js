const STORAGE_KEY = 'jm_phone_link_map_v1'

function safeParse (raw) {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch (e) {}
  return {}
}

function readStore () {
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY))
  } catch (e) {
    return {}
  }
}

function writeStore (store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function createToken (phone) {
  const seed = `${phone}-${Date.now()}-${Math.random()}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return `pl_${Date.now().toString(36)}_${Math.abs(hash).toString(36)}`
}

export function getRecordByPhone (phone) {
  const p = String(phone || '').trim()
  if (!p) return null
  const store = readStore()
  const byPhone = store.byPhone || {}
  const token = byPhone[p]
  if (!token) return null
  const byToken = store.byToken || {}
  return byToken[token] || null
}

export function getRecordByToken (token) {
  const t = String(token || '').trim()
  if (!t) return null
  const store = readStore()
  const byToken = store.byToken || {}
  return byToken[t] || null
}

export function createOrGetPhoneLinkRecord (phone) {
  const p = String(phone || '').trim()
  if (!/^1[3-9]\d{9}$/.test(p)) {
    throw new Error('请输入正确的 11 位手机号')
  }

  const store = readStore()
  store.byPhone = store.byPhone || {}
  store.byToken = store.byToken || {}

  const existedToken = store.byPhone[p]
  if (existedToken && store.byToken[existedToken]) {
    return store.byToken[existedToken]
  }

  const token = createToken(p)
  const record = {
    token,
    phone: p,
    createdAt: Date.now()
  }
  store.byPhone[p] = token
  store.byToken[token] = record
  writeStore(store)
  return record
}

export function listPhoneLinkRecords () {
  const store = readStore()
  const byToken = store.byToken || {}
  return Object.keys(byToken)
    .map((token) => byToken[token])
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}
