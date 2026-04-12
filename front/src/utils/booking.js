const DURATION_UNIT_ORDER = ['MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH']
const HIRE_PERIOD_PATTERN = /^(MINUTE|HOUR|DAY|WEEK|MONTH)_(\d+)$/i

const DURATION_UNIT_CONFIG = {
  MINUTE: { singular: 'Minute', plural: 'Minutes', short: 'M', sortMinutes: 1 },
  HOUR: { singular: 'Hour', plural: 'Hours', short: 'H', sortMinutes: 60 },
  DAY: { singular: 'Day', plural: 'Days', short: 'D', sortMinutes: 1440 },
  WEEK: { singular: 'Week', plural: 'Weeks', short: 'W', sortMinutes: 10080 },
  MONTH: { singular: 'Month', plural: 'Months', short: 'MO', sortMinutes: 43200 }
}

export function parseHirePeriod(period) {
  const normalized = String(period || '').trim().toUpperCase()
  const match = normalized.match(HIRE_PERIOD_PATTERN)
  if (!match) return null

  const value = Number(match[2])
  if (!Number.isInteger(value) || value <= 0) return null

  const unit = match[1]
  return {
    unit,
    value,
    code: `${unit}_${value}`,
    sortWeight: value * DURATION_UNIT_CONFIG[unit].sortMinutes
  }
}

export function normalizeBookingStatus(status) {
  if (!status) return ''
  return status === 'ACTIVATED' ? 'ACTIVE' : status
}

export function formatPeriod(period) {
  const parsed = parseHirePeriod(period)
  if (!parsed) return period || '-'

  const config = DURATION_UNIT_CONFIG[parsed.unit]
  return `${parsed.value} ${parsed.value === 1 ? config.singular : config.plural}`
}

export function formatPeriodBadge(period) {
  const parsed = parseHirePeriod(period)
  if (!parsed) return period || '-'

  return `${parsed.value}${DURATION_UNIT_CONFIG[parsed.unit].short}`
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
  return [...plans].sort((left, right) => {
    const leftParsed = parseHirePeriod(left.hirePeriod)
    const rightParsed = parseHirePeriod(right.hirePeriod)

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
    return String(left.hirePeriod || '').localeCompare(String(right.hirePeriod || ''))
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
