import { getToken, removeToken } from './auth'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const ABSOLUTE_HTTP_URL_RE = /^https?:\/\//i

function buildQueryString(params) {
  return Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
}

export function request(options) {
  const { url, method = 'GET', data, contentType = 'json' } = options

  if (!BASE_URL) {
    const error = new Error('VITE_API_BASE_URL is not configured')
    uni.showToast({ title: 'API address not configured', icon: 'none' })
    return Promise.reject(error)
  }

  // #ifdef MP
  if (!ABSOLUTE_HTTP_URL_RE.test(BASE_URL)) {
    const error = new Error(`Mini program requests need an absolute API URL, got: ${BASE_URL}`)
    uni.showToast({ title: 'Mini program needs full API URL', icon: 'none' })
    return Promise.reject(error)
  }
  // #endif

  const header = {}
  const token = getToken()
  if (token) {
    header['Authorization'] = token
  }

  let finalUrl = BASE_URL + url
  let finalData = data

  if (contentType === 'form') {
    header['Content-Type'] = 'application/x-www-form-urlencoded'
    finalData = buildQueryString(data)
  } else if (contentType === 'query') {
    finalUrl += '?' + buildQueryString(data)
    finalData = undefined
  } else {
    header['Content-Type'] = 'application/json'
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: finalUrl,
      method,
      data: finalData,
      header,
      success(res) {
        if (res.statusCode === 401) {
          removeToken()
          uni.showToast({ title: 'Please login first', icon: 'none' })
          uni.reLaunch({ url: '/pages/login/login' })
          return reject(new Error('Unauthorized'))
        }

        const body = res.data
        if (body.code === 0) {
          resolve(body)
        } else {
          uni.showToast({ title: body.message || 'Request failed', icon: 'none' })
          reject(body)
        }
      },
      fail(err) {
        uni.showToast({ title: 'Network error', icon: 'none' })
        reject(err)
      }
    })
  })
}
