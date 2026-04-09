export const PERIOD_SEQUENCE = ['HOUR_1', 'HOUR_4', 'DAY_1', 'WEEK_1']

const PERIOD_LABELS = {
  HOUR_1: '1 Hour',
  HOUR_4: '4 Hours',
  DAY_1: '1 Day',
  WEEK_1: '1 Week'
}

const PERIOD_BADGES = {
  HOUR_1: '1H',
  HOUR_4: '4H',
  DAY_1: '1D',
  WEEK_1: '7D'
}

export function normalizeBookingStatus(status) {
  if (!status) return ''
  return status === 'ACTIVATED' ? 'ACTIVE' : status
}

export function formatPeriod(period) {
  return PERIOD_LABELS[period] || period || '-'
}

export function formatPeriodBadge(period) {
  return PERIOD_BADGES[period] || period || '-'
}

export function formatCurrency(value) {
  const amount = Number(value || 0)
  return `\u00A3${amount.toFixed(2)}`
}

export function formatTime(timeStr) {
  if (!timeStr) return '-'
  return String(timeStr).replace('T', ' ').slice(0, 16)
}

export function isOpenBooking(status) {
  const normalizedStatus = normalizeBookingStatus(status)
  return normalizedStatus === 'PENDING' || normalizedStatus === 'ACTIVE'
}

export function sortPricingPlans(plans = []) {
  const rank = PERIOD_SEQUENCE.reduce((map, period, index) => {
    map[period] = index
    return map
  }, {})

  return [...plans].sort((left, right) => {
    const leftRank = rank[left.hirePeriod] ?? Number.MAX_SAFE_INTEGER
    const rightRank = rank[right.hirePeriod] ?? Number.MAX_SAFE_INTEGER
    return leftRank - rightRank
  })
}

export function sortScooters(scooters = []) {
  return [...scooters].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === 'AVAILABLE' ? -1 : 1
    }

    const leftCode = left.scooterCode || ''
    const rightCode = right.scooterCode || ''
    return leftCode.localeCompare(rightCode)
  })
}

export function buildEntityMap(items = [], key = 'id') {
  return items.reduce((map, item) => {
    if (item && item[key] != null) {
      map[String(item[key])] = item
    }
    return map
  }, {})
}

export function buildBookingViewModel(booking, scooterMap = {}, pricingPlanMap = {}) {
  const normalizedStatus = normalizeBookingStatus(booking.status)
  const scooter = scooterMap[String(booking.scooterId)] || {}
  const pricingPlan = pricingPlanMap[String(booking.pricingPlanId)] || {}

  return {
    ...booking,
    status: normalizedStatus,
    scooterCode: scooter.scooterCode || `#${booking.scooterId}`,
    scooterLocation: scooter.location || 'Unknown location',
    scooterLongitude: scooter.longitude ?? null,
    scooterLatitude: scooter.latitude ?? null,
    hiredPeriod: pricingPlan.hirePeriod || '',
    hiredPeriodLabel: formatPeriod(pricingPlan.hirePeriod),
    hiredPeriodBadge: formatPeriodBadge(pricingPlan.hirePeriod),
    totalCostValue: Number(booking.totalCost || 0)
  }
}
