const STORAGE_KEY = 'payment_receipts'

function readReceipts() {
  const stored = uni.getStorageSync(STORAGE_KEY)
  if (!stored || typeof stored !== 'object') {
    return {}
  }
  return stored
}

export function savePaymentReceipt(bookingId, payment) {
  if (!bookingId || !payment) return

  const receipts = readReceipts()
  receipts[String(bookingId)] = payment
  uni.setStorageSync(STORAGE_KEY, receipts)
}

export function getPaymentReceipt(bookingId) {
  if (!bookingId) return null

  const receipts = readReceipts()
  return receipts[String(bookingId)] || null
}
