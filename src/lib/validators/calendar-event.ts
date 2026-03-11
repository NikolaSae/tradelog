//src/lib/validators/calendar-event.ts

import { z } from 'zod'

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Max 100 characters'),
  description: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format').optional(),
  type: z.enum(['NEWS', 'EARNINGS', 'FOMC', 'CPI', 'NFP', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
})

export const deleteCalendarEventSchema = z.object({
  id: z.string().uuid(),
})

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>