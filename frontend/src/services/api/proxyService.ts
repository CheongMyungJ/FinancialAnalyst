/**
 * CORS 프록시 서비스
 * 브라우저에서 CORS 제한이 있는 외부 API에 접근하기 위한 프록시 서비스
 */

// 프록시 서비스 URL 목록 (순차적으로 시도)
const PROXY_SERVICES = [
  'https://api.cors.lol/?url=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

// 캐시 설정
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

// 캐시 기간 (밀리초)
export const CACHE_DURATION = {
  PRICE: 5 * 60 * 1000,        // 5분 (실시간 데이터)
  FUNDAMENTALS: 24 * 60 * 60 * 1000,  // 24시간 (재무제표)
  NEWS: 30 * 60 * 1000,        // 30분 (뉴스)
  HISTORICAL: 60 * 60 * 1000,  // 1시간 (과거 데이터)
}

/**
 * 캐시에서 데이터 가져오기
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data
  }
  return null
}

/**
 * 캐시에 데이터 저장
 */
function setToCache<T>(key: string, data: T, duration: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + duration,
  })
}

/**
 * Rate Limiter 클래스
 */
class RateLimiter {
  private requestCount = 0
  private windowStart = Date.now()
  private queue: Array<() => Promise<void>> = []
  private processing = false

  constructor(
    private maxRequests: number,
    private windowMs: number,
    private delayMs: number = 100
  ) {}

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      // Window 리셋 체크
      if (Date.now() - this.windowStart > this.windowMs) {
        this.requestCount = 0
        this.windowStart = Date.now()
      }

      // Rate limit 체크
      if (this.requestCount >= this.maxRequests) {
        const waitTime = this.windowMs - (Date.now() - this.windowStart)
        await new Promise(r => setTimeout(r, waitTime))
        continue
      }

      const fn = this.queue.shift()!
      await fn()
      this.requestCount++
      await new Promise(r => setTimeout(r, this.delayMs))
    }

    this.processing = false
  }
}

// API별 Rate Limiter
export const rateLimiters = {
  yahoo: new RateLimiter(5, 1000),      // 5 req/sec
  dart: new RateLimiter(10, 1000),      // 10 req/sec
  openAi: new RateLimiter(3, 60000),    // 3 req/min
}

/**
 * 프록시를 통해 URL 가져오기
 */
export async function fetchWithProxy(url: string): Promise<Response> {
  for (const proxy of PROXY_SERVICES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url), {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (response.ok) {
        return response
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error)
    }
  }
  throw new Error('All proxies failed')
}

/**
 * 캐시와 Rate Limiting이 적용된 fetch
 */
export async function fetchWithCacheAndRateLimit<T>(
  url: string,
  options: {
    cacheKey?: string
    cacheDuration?: number
    rateLimiter?: RateLimiter
    useProxy?: boolean
    transform?: (data: unknown) => T
  } = {}
): Promise<T> {
  const {
    cacheKey = url,
    cacheDuration = CACHE_DURATION.PRICE,
    rateLimiter,
    useProxy = false,
    transform = (data) => data as T,
  } = options

  // 캐시 확인
  const cached = getFromCache<T>(cacheKey)
  if (cached) {
    return cached
  }

  // Rate Limiting이 적용된 fetch
  const fetchFn = async (): Promise<T> => {
    const response = useProxy
      ? await fetchWithProxy(url)
      : await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const transformed = transform(data)

    // 캐시에 저장
    setToCache(cacheKey, transformed, cacheDuration)

    return transformed
  }

  if (rateLimiter) {
    return rateLimiter.enqueue(fetchFn)
  }

  return fetchFn()
}

/**
 * 캐시 클리어
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * 특정 키의 캐시 삭제
 */
export function invalidateCache(keyPattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(keyPattern)) {
      cache.delete(key)
    }
  }
}
