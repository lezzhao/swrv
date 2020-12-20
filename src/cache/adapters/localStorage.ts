import SWRVCache from '..'

/**
 * LocalStorage cache adapter for swrv data cache.
 * https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 */
export default class LocalStorageCache extends SWRVCache {
  private STORAGE_KEY

  constructor (key = 'swrv', ttl = 0) {
    super(ttl)
    this.STORAGE_KEY = key
  }

  private encode (storage) { return btoa(JSON.stringify(storage)) }
  private decode (storage) { return JSON.parse(atob(storage)) }

  get (k) {
    const item = localStorage.getItem(this.STORAGE_KEY)
    if (item) {
      const _key = this.serializeKey(k)
      return JSON.parse(atob(item))[_key]
    }
  }

  set (k: string, v: any, ttl: number) {
    let payload = {}
    const _key = this.serializeKey(k)
    const timeToLive = ttl || this.ttl
    const storage = localStorage.getItem(this.STORAGE_KEY)
    const now = Date.now()
    const item = {
      data: v,
      createdAt: now,
      expiresAt: timeToLive ? now + timeToLive : Infinity
    }

    if (storage) {
      payload = this.decode(storage)
      payload[_key] = item
    } else {
      payload = { [_key]: item }
    }

    this.dispatchExpire(timeToLive, item, _key)
    localStorage.setItem(this.STORAGE_KEY, this.encode(payload))
  }

  dispatchExpire (ttl, item, serializedKey) {
    ttl && setTimeout(() => {
      const current = Date.now()
      const hasExpired = current >= item.expiresAt
      if (hasExpired) this.delete(serializedKey)
    }, ttl)
  }

  delete (serializedKey: string) {
    const storage = localStorage.getItem(this.STORAGE_KEY)
    let payload = {}

    if (storage) {
      payload = this.decode(storage)
      delete payload[serializedKey]
    }

    localStorage.setItem(this.STORAGE_KEY, this.encode(payload))
  }
}