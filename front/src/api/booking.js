import { request } from '@/utils/request'

export function getPricingPlans() {
  return request({
    url: '/booking',
    method: 'GET'
  })
}

export function createBooking(scooterId, hiredPeriod) {
  return request({
    url: '/booking',
    method: 'POST',
    data: { scooterId, hiredPeriod },
    contentType: 'query'
  })
}

export function updateBookingStatus(bookingId, status) {
  return request({
    url: '/booking/status',
    method: 'POST',
    data: { bookingId, status },
    contentType: 'query'
  })
}

export function activateBooking(bookingId) {
  return request({
    url: '/booking/activate',
    method: 'POST',
    data: { bookingId },
    contentType: 'query'
  })
}

export function modifyBookingPeriod(bookingId, hiredPeriod) {
  return request({
    url: '/booking/modify-period',
    method: 'POST',
    data: { bookingId, hiredPeriod },
    contentType: 'query'
  })
}

export function cancelBooking(bookingId) {
  return request({
    url: '/booking/cancel',
    method: 'POST',
    data: { bookingId },
    contentType: 'query'
  })
}

export function renewBooking(bookingId, hiredPeriod) {
  return request({
    url: '/booking/renew',
    method: 'POST',
    data: { bookingId, hiredPeriod },
    contentType: 'query'
  })
}

export function finishBooking(bookingId) {
  return request({
    url: '/booking/finish',
    method: 'POST',
    data: { bookingId },
    contentType: 'query'
  })
}
