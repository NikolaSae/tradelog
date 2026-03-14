// src/lib/rate-limit.ts
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible'

const rateLimiter = new RateLimiterMemory({
  points: 5,     // max 5 importa
  duration: 60,  // po 60 sekundi po korisniku
})

export const importLimiter = {
  check: async (key: string): Promise<void> => {
    try {
      await rateLimiter.consume(key)
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        throw new Error('Too many requests')
      }
      throw err
    }
  },
}