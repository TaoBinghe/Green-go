const DURATION_UNIT_ORDER = ['MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH'] as const
const HIRE_PERIOD_PATTERN = /^(MINUTE|HOUR|DAY|WEEK|MONTH)_(\d+)$/i

export type DurationUnit = typeof DURATION_UNIT_ORDER[number]

const DURATION_UNIT_CONFIG: Record<DurationUnit, {
  singular: string
  plural: string
  short: string
  sortMinutes: number
}> = {
  MINUTE: { singular: 'Minute', plural: 'Minutes', short: 'M', sortMinutes: 1 },
  HOUR: { singular: 'Hour', plural: 'Hours', short: 'H', sortMinutes: 60 },
  DAY: { singular: 'Day', plural: 'Days', short: 'D', sortMinutes: 1440 },
  WEEK: { singular: 'Week', plural: 'Weeks', short: 'W', sortMinutes: 10080 },
  MONTH: { singular: 'Month', plural: 'Months', short: 'MO', sortMinutes: 43200 }
}

export const DURATION_UNIT_OPTIONS = DURATION_UNIT_ORDER.map((value) => ({
  value,
  label: DURATION_UNIT_CONFIG[value].plural
}))

export interface ParsedHirePeriod {
  unit: DurationUnit
  value: number
  code: string
  sortWeight: number
}

export function parseHirePeriod(period: string | null | undefined): ParsedHirePeriod | null {
  const normalized = String(period || '').trim().toUpperCase()
  const match = normalized.match(HIRE_PERIOD_PATTERN)
  if (!match) return null

  const value = Number(match[2])
  if (!Number.isInteger(value) || value <= 0) return null

  const unit = match[1] as DurationUnit

  return {
    unit,
    value,
    code: `${unit}_${value}`,
    sortWeight: value * DURATION_UNIT_CONFIG[unit].sortMinutes
  }
}

export function buildHirePeriodCode(unit: string | null | undefined, value: number | string | null | undefined): string {
  const normalizedUnit = String(unit || '').trim().toUpperCase()
  const amount = Number(value)
  if (!normalizedUnit || !Number.isInteger(amount) || amount <= 0) {
    return ''
  }

  return parseHirePeriod(`${normalizedUnit}_${amount}`)?.code || ''
}

export function compareHirePeriods(left: string | null | undefined, right: string | null | undefined): number {
  const leftParsed = parseHirePeriod(left)
  const rightParsed = parseHirePeriod(right)

  if (leftParsed && rightParsed) {
    if (leftParsed.sortWeight !== rightParsed.sortWeight) {
      return leftParsed.sortWeight - rightParsed.sortWeight
    }

    const leftUnitOrder = DURATION_UNIT_ORDER.indexOf(leftParsed.unit)
    const rightUnitOrder = DURATION_UNIT_ORDER.indexOf(rightParsed.unit)
    if (leftUnitOrder !== rightUnitOrder) {
      return leftUnitOrder - rightUnitOrder
    }

    return leftParsed.value - rightParsed.value
  }

  if (leftParsed) return -1
  if (rightParsed) return 1
  return String(left || '').localeCompare(String(right || ''))
}

export function formatPeriod(period: string | null | undefined): string {
  const parsed = parseHirePeriod(period)
  if (!parsed) return period || '-'

  const config = DURATION_UNIT_CONFIG[parsed.unit]
  return `${parsed.value} ${parsed.value === 1 ? config.singular : config.plural}`
}

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value || 0)
  return `\u00A3${amount.toFixed(2)}`
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 19)
}

interface RevenueBucketLike {
  hirePeriod: string
  orderCount: number | string | null
  totalRevenue: number | string | null
}

export function normalizeRevenueBuckets<T extends RevenueBucketLike>(buckets: T[] | null | undefined) {
  return sortPlansByPeriod((buckets || []).map((bucket) => ({
    hirePeriod: bucket.hirePeriod,
    orderCount: Number(bucket.orderCount || 0),
    totalRevenue: Number(bucket.totalRevenue || 0)
  })))
}

export function sortPlansByPeriod<T extends { hirePeriod: string }>(plans: T[] | null | undefined): T[] {
  return [...(plans || [])].sort((left, right) => compareHirePeriods(left.hirePeriod, right.hirePeriod))
}

export function sumRevenue(values: Array<{ totalRevenue: number }>): number {
  return values.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0)
}

export function sumOrders(values: Array<{ orderCount: number }>): number {
  return values.reduce((sum, item) => sum + Number(item.orderCount || 0), 0)
}
