import { CronExpressionParser } from 'cron-parser'

export type CronValidationErrorCode = 'empty' | 'preset' | 'fieldCount' | 'parse'

export interface LinuxCronCalculationSuccess {
  ok: true
  normalizedExpression: string
  nextRunTimes: string[]
}

export interface LinuxCronCalculationFailure {
  ok: false
  normalizedExpression: string
  errorCode: CronValidationErrorCode
  errorDetail?: string
}

export type LinuxCronCalculationResult = LinuxCronCalculationSuccess | LinuxCronCalculationFailure

export interface LinuxCronFields {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export function formatCronDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export function normalizeLinuxCronExpression(input: string): string {
  return input.trim().replace(/\s+/g, ' ')
}

export function getLinuxCronFields(expression: string): LinuxCronFields {
  const [minute = '', hour = '', dayOfMonth = '', month = '', dayOfWeek = ''] =
    normalizeLinuxCronExpression(expression).split(' ')

  return {
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  }
}

export function calculateNextLinuxCronRuns(
  input: string,
  options: { count?: number; currentDate?: Date } = {},
): LinuxCronCalculationResult {
  const normalizedExpression = normalizeLinuxCronExpression(input)
  const count = options.count ?? 7

  if (!normalizedExpression) {
    return {
      ok: false,
      normalizedExpression,
      errorCode: 'empty',
    }
  }

  if (normalizedExpression.startsWith('@')) {
    return {
      ok: false,
      normalizedExpression,
      errorCode: 'preset',
    }
  }

  if (normalizedExpression.split(' ').length !== 5) {
    return {
      ok: false,
      normalizedExpression,
      errorCode: 'fieldCount',
    }
  }

  try {
    const interval = CronExpressionParser.parse(normalizedExpression, {
      currentDate: options.currentDate ?? new Date(),
    })

    return {
      ok: true,
      normalizedExpression,
      nextRunTimes: interval.take(count).map((cronDate) => formatCronDateTime(cronDate.toDate())),
    }
  } catch (error) {
    return {
      ok: false,
      normalizedExpression,
      errorCode: 'parse',
      errorDetail: error instanceof Error ? error.message : String(error),
    }
  }
}
