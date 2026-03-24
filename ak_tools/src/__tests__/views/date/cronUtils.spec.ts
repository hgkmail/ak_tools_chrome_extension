import { describe, expect, it } from 'vitest'
import {
  calculateNextLinuxCronRuns,
  formatCronDateTime,
  getLinuxCronFields,
  normalizeLinuxCronExpression,
} from '@/views/date/cronUtils'

describe('cronUtils', () => {
  it('normalizes repeated spaces in a linux cron expression', () => {
    expect(normalizeLinuxCronExpression('  0   */12   * *   *  ')).toBe('0 */12 * * *')
  })

  it('returns field details for a valid linux cron expression', () => {
    expect(getLinuxCronFields('0 */12 * * *')).toEqual({
      minute: '0',
      hour: '*/12',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    })
  })

  it('returns a field-count error when expression does not contain 5 fields', () => {
    const result = calculateNextLinuxCronRuns('0 0 */12 * * *')

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected validation failure')
    expect(result.errorCode).toBe('fieldCount')
  })

  it('returns a preset error for predefined expressions', () => {
    const result = calculateNextLinuxCronRuns('@daily')

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected validation failure')
    expect(result.errorCode).toBe('preset')
  })

  it('returns a parse error for an invalid linux cron expression', () => {
    const result = calculateNextLinuxCronRuns('70 * * * *')

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected validation failure')
    expect(result.errorCode).toBe('parse')
  })

  it('calculates the next 7 execution times for a valid expression', () => {
    const currentDate = new Date(2026, 2, 24, 10, 0, 0)
    const result = calculateNextLinuxCronRuns('0 */12 * * *', {
      count: 7,
      currentDate,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected calculation success')
    expect(result.normalizedExpression).toBe('0 */12 * * *')
    expect(result.nextRunTimes).toEqual([
      '2026-03-24 12:00:00',
      '2026-03-25 00:00:00',
      '2026-03-25 12:00:00',
      '2026-03-26 00:00:00',
      '2026-03-26 12:00:00',
      '2026-03-27 00:00:00',
      '2026-03-27 12:00:00',
    ])
  })

  it('formats date values as YYYY-MM-DD HH:mm:ss', () => {
    expect(formatCronDateTime(new Date(2026, 2, 24, 8, 9, 10))).toBe('2026-03-24 08:09:10')
  })
})
