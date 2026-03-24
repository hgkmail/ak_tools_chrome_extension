import { describe, expect, it } from 'vitest'
import {
  calculateNextLinuxCronRuns,
  calculateNextQuartzCronRuns,
  calculateNextSpringCronRuns,
  formatCronDateTime,
  getLinuxCronFields,
  getQuartzCronFields,
  getSpringCronFields,
  normalizeLinuxCronExpression,
} from '@/hooks/cronUtils'

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

  it('returns field details for a valid spring cron expression', () => {
    expect(getSpringCronFields('0 0 */12 * * *')).toEqual({
      second: '0',
      minute: '0',
      hour: '*/12',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '*',
    })
  })

  it('returns a field-count error when a spring expression does not contain 6 fields', () => {
    const result = calculateNextSpringCronRuns('0 */12 * * *')

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected validation failure')
    expect(result.errorCode).toBe('fieldCount')
  })

  it('calculates the next 7 execution times for a valid spring expression', () => {
    const currentDate = new Date(2026, 2, 24, 10, 0, 0)
    const result = calculateNextSpringCronRuns('0 0 */12 * * *', {
      count: 7,
      currentDate,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected calculation success')
    expect(result.normalizedExpression).toBe('0 0 */12 * * *')
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

  it('returns field details for a valid quartz cron expression', () => {
    expect(getQuartzCronFields('0 0 18 L * ? 2026')).toEqual({
      second: '0',
      minute: '0',
      hour: '18',
      dayOfMonth: 'L',
      month: '*',
      dayOfWeek: '?',
      year: '2026',
    })
  })

  it('defaults quartz year to the current year when the 7th field is omitted', () => {
    const currentDate = new Date(2026, 2, 24, 10, 0, 0)
    const result = calculateNextQuartzCronRuns('0 0 18 L * ?', {
      count: 3,
      currentDate,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected calculation success')
    expect(result.normalizedExpression).toBe('0 0 18 L * ? 2026')
    expect(result.nextRunTimes).toEqual([
      '2026-03-31 18:00:00',
      '2026-04-30 18:00:00',
      '2026-05-31 18:00:00',
    ])
  })

  it('returns a field-count error when a quartz expression does not contain 6 or 7 fields', () => {
    const result = calculateNextQuartzCronRuns('0 18 L * ?')

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected validation failure')
    expect(result.errorCode).toBe('fieldCount')
  })

  it('calculates the next execution times for a quartz expression with year filtering', () => {
    const currentDate = new Date(2026, 2, 24, 10, 0, 0)
    const result = calculateNextQuartzCronRuns('0 0 18 L * ? 2026', {
      count: 7,
      currentDate,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected calculation success')
    expect(result.nextRunTimes).toEqual([
      '2026-03-31 18:00:00',
      '2026-04-30 18:00:00',
      '2026-05-31 18:00:00',
      '2026-06-30 18:00:00',
      '2026-07-31 18:00:00',
      '2026-08-31 18:00:00',
      '2026-09-30 18:00:00',
    ])
  })

  it('calculates quartz expressions using # syntax', () => {
    const currentDate = new Date(2026, 2, 24, 10, 0, 0)
    const result = calculateNextQuartzCronRuns('0 0 10 ? * 2#1 2026', {
      count: 4,
      currentDate,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected calculation success')
    expect(result.nextRunTimes).toEqual([
      '2026-04-07 10:00:00',
      '2026-05-05 10:00:00',
      '2026-06-02 10:00:00',
      '2026-07-07 10:00:00',
    ])
  })

  it('calculates quartz expressions using W syntax', () => {
    const currentDate = new Date(2026, 2, 24, 10, 0, 0)
    const result = calculateNextQuartzCronRuns('0 0 9 15W * ? 2026', {
      count: 4,
      currentDate,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('expected calculation success')
    expect(result.nextRunTimes).toEqual([
      '2026-04-15 09:00:00',
      '2026-05-15 09:00:00',
      '2026-06-15 09:00:00',
      '2026-07-15 09:00:00',
    ])
  })

  it('returns a parse error for unsupported quartz W combinations', () => {
    const result = calculateNextQuartzCronRuns('0 0 9 15W,20W * ? 2026')

    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected validation failure')
    expect(result.errorCode).toBe('parse')
  })
})
