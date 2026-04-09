const PERIOD_ORDER = ['HOUR_1', 'HOUR_4', 'DAY_1', 'WEEK_1'] as const

const PERIOD_LABEL_MAP: Record<string, string> = {
  HOUR_1: '1 Hour',
  HOUR_4: '4 Hours',
  DAY_1: '1 Day',
  WEEK_1: '1 Week'
}

export const PERIOD_OPTIONS = PERIOD_ORDER.map((value) => ({
  value,
  label: PERIOD_LABEL_MAP[value]
}))

export function formatPeriod(period: string | null | undefined): string {
  if (!period) return '-'
  return PERIOD_LABEL_MAP[period] || period
}

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value || 0)
  return `£${amount.toFixed(2)}`
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
  const bucketMap = new Map<string, T>((buckets || []).map((bucket) => [bucket.hirePeriod, bucket]))

  return PERIOD_ORDER.map((hirePeriod) => {
    const bucket = bucketMap.get(hirePeriod)
    return {
      hirePeriod,
      orderCount: Number(bucket?.orderCount || 0),
      totalRevenue: Number(bucket?.totalRevenue || 0)
    }
  })
}

export function sortPlansByPeriod<T extends { hirePeriod: string }>(plans: T[] | null | undefined): T[] {
  const rank = PERIOD_ORDER.reduce<Record<string, number>>((map, period, index) => {
    map[period] = index
    return map
  }, {})

  return [...(plans || [])].sort((left, right) => {
    const leftRank = rank[left.hirePeriod] ?? Number.MAX_SAFE_INTEGER
    const rightRank = rank[right.hirePeriod] ?? Number.MAX_SAFE_INTEGER
    return leftRank - rightRank
  })
}

export function sumRevenue(values: Array<{ totalRevenue: number }>): number {
  return values.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0)
}

export function sumOrders(values: Array<{ orderCount: number }>): number {
  return values.reduce((sum, item) => sum + Number(item.orderCount || 0), 0)
}
