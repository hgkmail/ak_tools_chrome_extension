import { CronExpressionParser } from 'cron-parser'

export type CronType = 'linux' | 'spring' | 'quartz'
export type CronValidationErrorCode = 'empty' | 'preset' | 'fieldCount' | 'parse'

export interface CronCalculationSuccess {
  ok: true
  normalizedExpression: string
  nextRunTimes: string[]
}

export interface CronCalculationFailure {
  ok: false
  normalizedExpression: string
  errorCode: CronValidationErrorCode
  errorDetail?: string
}

export type CronCalculationResult = CronCalculationSuccess | CronCalculationFailure
export type LinuxCronCalculationResult = CronCalculationResult
export type SpringCronCalculationResult = CronCalculationResult
export type QuartzCronCalculationResult = CronCalculationResult

export interface LinuxCronFields {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export interface SpringCronFields {
  second: string
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export interface QuartzCronFields extends SpringCronFields {
  year: string
}

const MONTH_ALIAS_MAP: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

const OPEN_ENDED_YEAR_RANGE = 500
const SUPPORTED_W_TOKEN_PATTERN = /^(LW|[1-9]|[12]\d|3[01])W$/i

export function formatCronDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export function normalizeCronExpression(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

export function normalizeLinuxCronExpression(input: string): string {
  return normalizeCronExpression(input)
}

export function normalizeSpringCronExpression(input: string): string {
  return normalizeCronExpression(input)
}

export function normalizeQuartzCronExpression(input: string): string {
  return normalizeCronExpression(input)
}

export function normalizeQuartzCronExpressionWithDefaultYear(
  input: string,
  currentYear: number,
): string {
  const normalizedExpression = normalizeQuartzCronExpression(input)

  if (!normalizedExpression) {
    return normalizedExpression
  }

  const fields = normalizedExpression.split(' ')
  if (fields.length === 6) {
    return [...fields, String(currentYear)].join(' ')
  }

  return normalizedExpression
}

export function getLinuxCronFields(expression: string): LinuxCronFields {
  const [minute = '', hour = '', dayOfMonth = '', month = '', dayOfWeek = ''] =
    normalizeCronExpression(expression).split(' ')

  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  }
}

export function getSpringCronFields(expression: string): SpringCronFields {
  const [second = '', minute = '', hour = '', dayOfMonth = '', month = '', dayOfWeek = ''] =
    normalizeCronExpression(expression).split(' ')

  return {
    second,
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  }
}

export function getQuartzCronFields(expression: string): QuartzCronFields {
  const [
    second = '',
    minute = '',
    hour = '',
    dayOfMonth = '',
    month = '',
    dayOfWeek = '',
    year = '',
  ] = normalizeCronExpression(expression).split(' ')

  return {
    second,
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    year,
  }
}

export function calculateNextLinuxCronRuns(
  input: string,
  options: { count?: number; currentDate?: Date } = {},
): LinuxCronCalculationResult {
  return calculateCronRunsWithParser(normalizeLinuxCronExpression(input), 5, options)
}

export function calculateNextSpringCronRuns(
  input: string,
  options: { count?: number; currentDate?: Date } = {},
): SpringCronCalculationResult {
  return calculateCronRunsWithParser(normalizeSpringCronExpression(input), 6, options)
}

export function calculateNextQuartzCronRuns(
  input: string,
  options: { count?: number; currentDate?: Date } = {},
): QuartzCronCalculationResult {
  const count = options.count ?? 7
  const currentDate = options.currentDate ?? new Date()
  const normalizedExpression = normalizeQuartzCronExpressionWithDefaultYear(
    input,
    currentDate.getFullYear(),
  )

  const validationError = validateQuartzCronInput(normalizedExpression)
  if (validationError) {
    return validationError
  }

  const quartzFields = getQuartzCronFields(normalizedExpression)

  try {
    const yearMatcher = createYearMatcher(quartzFields.year, currentDate.getFullYear())
    const nextRunTimes = quartzFields.dayOfMonth.includes('W')
      ? calculateQuartzRunsWithWeekday(
          normalizedExpression,
          quartzFields,
          count,
          currentDate,
          yearMatcher,
        )
      : calculateQuartzRunsWithYearFilter(
          normalizedExpression,
          quartzFields,
          count,
          currentDate,
          yearMatcher,
        )

    if (nextRunTimes.length < count) {
      throw new Error('No execution time found within the supported year range')
    }

    return buildSuccess(normalizedExpression, nextRunTimes)
  } catch (error) {
    return buildFailure(normalizedExpression, 'parse', error)
  }
}

function calculateCronRunsWithParser(
  normalizedExpression: string,
  expectedFieldCount: number,
  options: { count?: number; currentDate?: Date },
): CronCalculationResult {
  const count = options.count ?? 7
  const validationError = validateCronInput(normalizedExpression, expectedFieldCount)

  if (validationError) {
    return validationError
  }

  try {
    const interval = CronExpressionParser.parse(normalizedExpression, {
      currentDate: options.currentDate ?? new Date(),
    })

    return buildSuccess(
      normalizedExpression,
      interval.take(count).map((cronDate) => formatCronDateTime(cronDate.toDate())),
    )
  } catch (error) {
    return buildFailure(normalizedExpression, 'parse', error)
  }
}

function validateCronInput(
  normalizedExpression: string,
  expectedFieldCount: number,
): CronCalculationFailure | null {
  if (!normalizedExpression) {
    return buildFailure(normalizedExpression, 'empty')
  }

  if (normalizedExpression.startsWith('@')) {
    return buildFailure(normalizedExpression, 'preset')
  }

  if (normalizedExpression.split(' ').length !== expectedFieldCount) {
    return buildFailure(normalizedExpression, 'fieldCount')
  }

  return null
}

function validateQuartzCronInput(normalizedExpression: string): CronCalculationFailure | null {
  if (!normalizedExpression) {
    return buildFailure(normalizedExpression, 'empty')
  }

  if (normalizedExpression.startsWith('@')) {
    return buildFailure(normalizedExpression, 'preset')
  }

  const fieldCount = normalizedExpression.split(' ').length
  if (fieldCount !== 7) {
    return buildFailure(normalizedExpression, 'fieldCount')
  }

  return null
}

function buildSuccess(
  normalizedExpression: string,
  nextRunTimes: string[],
): CronCalculationSuccess {
  return {
    ok: true,
    normalizedExpression,
    nextRunTimes,
  }
}

function buildFailure(
  normalizedExpression: string,
  errorCode: CronValidationErrorCode,
  error?: unknown,
): CronCalculationFailure {
  return {
    ok: false,
    normalizedExpression,
    errorCode,
    errorDetail:
      error instanceof Error ? error.message : typeof error === 'string' ? error : undefined,
  }
}

function calculateQuartzRunsWithYearFilter(
  normalizedExpression: string,
  quartzFields: QuartzCronFields,
  count: number,
  currentDate: Date,
  yearMatcher: YearMatcher,
): string[] {
  const interval = CronExpressionParser.parse(
    [
      quartzFields.second,
      quartzFields.minute,
      quartzFields.hour,
      quartzFields.dayOfMonth,
      quartzFields.month,
      quartzFields.dayOfWeek,
    ].join(' '),
    { currentDate },
  )

  const nextRunTimes: string[] = []

  while (nextRunTimes.length < count) {
    const nextDate = interval.next().toDate()
    if (nextDate.getFullYear() > yearMatcher.maxYear) {
      break
    }
    if (yearMatcher.matches(nextDate.getFullYear())) {
      nextRunTimes.push(formatCronDateTime(nextDate))
    }
  }

  return nextRunTimes
}

function calculateQuartzRunsWithWeekday(
  normalizedExpression: string,
  quartzFields: QuartzCronFields,
  count: number,
  currentDate: Date,
  yearMatcher: YearMatcher,
): string[] {
  if (!SUPPORTED_W_TOKEN_PATTERN.test(quartzFields.dayOfMonth)) {
    throw new Error(`Unsupported Quartz W expression: ${quartzFields.dayOfMonth}`)
  }

  const months = expandSimpleField(quartzFields.month, 1, 12, MONTH_ALIAS_MAP)
  const nextRunTimes: string[] = []

  for (let year = currentDate.getFullYear(); year <= yearMatcher.maxYear; year += 1) {
    if (!yearMatcher.matches(year)) {
      continue
    }

    for (const month of months) {
      const dayOfMonth = resolveQuartzWeekdayDay(quartzFields.dayOfMonth, year, month)
      const currentMonthDate = currentDate.getMonth() + 1

      if (
        year < currentDate.getFullYear() ||
        (year === currentDate.getFullYear() && month < currentMonthDate)
      ) {
        continue
      }

      nextRunTimes.push(
        ...calculateRunsForSpecificDate(
          normalizedExpression,
          quartzFields,
          year,
          month,
          dayOfMonth,
          count - nextRunTimes.length,
          currentDate,
        ),
      )

      if (nextRunTimes.length >= count) {
        return nextRunTimes
      }
    }
  }

  return nextRunTimes
}

function calculateRunsForSpecificDate(
  normalizedExpression: string,
  quartzFields: QuartzCronFields,
  year: number,
  month: number,
  dayOfMonth: number,
  count: number,
  currentDate: Date,
): string[] {
  const interval = CronExpressionParser.parse(
    [quartzFields.second, quartzFields.minute, quartzFields.hour, dayOfMonth, month, '*'].join(' '),
    { currentDate },
  )
  const nextRunTimes: string[] = []

  while (nextRunTimes.length < count) {
    const nextDate = interval.next().toDate()

    if (
      nextDate.getFullYear() !== year ||
      nextDate.getMonth() + 1 !== month ||
      nextDate.getDate() !== dayOfMonth
    ) {
      break
    }

    nextRunTimes.push(formatCronDateTime(nextDate))
  }

  if (!nextRunTimes.length && isSpecificDateInFuture(year, month, dayOfMonth, currentDate)) {
    throw new Error(`Failed to calculate runs for Quartz expression: ${normalizedExpression}`)
  }

  return nextRunTimes
}

function isSpecificDateInFuture(
  year: number,
  month: number,
  dayOfMonth: number,
  currentDate: Date,
): boolean {
  const candidate = new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0)
  return candidate.getTime() >= currentDate.getTime()
}

function createYearMatcher(expression: string, currentYear: number): YearMatcher {
  const years = expandSimpleField(
    expression.replace(/\?/g, '*'),
    currentYear,
    currentYear + OPEN_ENDED_YEAR_RANGE,
  )
  const maxYear = years.length > 0 ? years[years.length - 1]! : currentYear

  return {
    maxYear,
    matches: (year) => years.includes(year),
  }
}

function expandSimpleField(
  expression: string,
  min: number,
  max: number,
  aliasMap: Record<string, number> = {},
): number[] {
  const normalizedExpression = normalizeFieldAliases(expression, aliasMap).replace(/\?/g, '*')
  const values = new Set<number>()

  for (const segment of normalizedExpression.split(',')) {
    appendFieldSegmentValues(segment, min, max, values)
  }

  return [...values].sort((left, right) => left - right)
}

function normalizeFieldAliases(expression: string, aliasMap: Record<string, number>): string {
  if (!Object.keys(aliasMap).length) {
    return expression
  }

  return expression.replace(/[A-Z]{3}/gi, (match) => {
    const resolvedValue = aliasMap[match.toUpperCase()]
    if (!resolvedValue) {
      throw new Error(`Invalid alias in cron field: ${match}`)
    }
    return String(resolvedValue)
  })
}

function appendFieldSegmentValues(
  segment: string,
  min: number,
  max: number,
  values: Set<number>,
): void {
  if (!segment) {
    throw new Error('Invalid empty cron field segment')
  }

  if (segment === '*') {
    addRangeValues(values, min, max, 1)
    return
  }

  const wildcardStepMatch = segment.match(/^\*\/(\d+)$/)
  if (wildcardStepMatch) {
    addRangeValues(values, min, max, toPositiveInteger(wildcardStepMatch[1] ?? '', segment))
    return
  }

  const rangeMatch = segment.match(/^(\d+)-(\d+)(?:\/(\d+))?$/)
  if (rangeMatch) {
    const rangeStart = toBoundedInteger(rangeMatch[1] ?? '', min, max, segment)
    const rangeEnd = toBoundedInteger(rangeMatch[2] ?? '', min, max, segment)
    if (rangeStart > rangeEnd) {
      throw new Error(`Invalid cron range: ${segment}`)
    }
    addRangeValues(values, rangeStart, rangeEnd, toPositiveInteger(rangeMatch[3] ?? '1', segment))
    return
  }

  const steppedValueMatch = segment.match(/^(\d+)\/(\d+)$/)
  if (steppedValueMatch) {
    const rangeStart = toBoundedInteger(steppedValueMatch[1] ?? '', min, max, segment)
    addRangeValues(values, rangeStart, max, toPositiveInteger(steppedValueMatch[2] ?? '', segment))
    return
  }

  const singleValueMatch = segment.match(/^\d+$/)
  if (singleValueMatch) {
    values.add(toBoundedInteger(segment, min, max, segment))
    return
  }

  throw new Error(`Unsupported cron field segment: ${segment}`)
}

function addRangeValues(values: Set<number>, start: number, end: number, step: number): void {
  for (let value = start; value <= end; value += step) {
    values.add(value)
  }
}

function toBoundedInteger(value: string, min: number, max: number, segment: string): number {
  const parsedValue = Number(value)
  if (!Number.isInteger(parsedValue) || parsedValue < min || parsedValue > max) {
    throw new Error(`Invalid cron value in segment: ${segment}`)
  }
  return parsedValue
}

function toPositiveInteger(value: string, segment: string): number {
  const parsedValue = Number(value)
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid cron step in segment: ${segment}`)
  }
  return parsedValue
}

function resolveQuartzWeekdayDay(expression: string, year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  if (expression.toUpperCase() === 'LW') {
    return moveToNearestWeekday(year, month, daysInMonth)
  }

  const baseDay = Number(expression.slice(0, -1))
  const targetDay = Math.min(baseDay, daysInMonth)
  return moveToNearestWeekday(year, month, targetDay)
}

function moveToNearestWeekday(year: number, month: number, dayOfMonth: number): number {
  const weekday = new Date(year, month - 1, dayOfMonth).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  if (weekday === 6) {
    return dayOfMonth === 1 ? 3 : dayOfMonth - 1
  }

  if (weekday === 0) {
    return dayOfMonth === daysInMonth ? dayOfMonth - 2 : dayOfMonth + 1
  }

  return dayOfMonth
}

interface YearMatcher {
  maxYear: number
  matches: (year: number) => boolean
}
