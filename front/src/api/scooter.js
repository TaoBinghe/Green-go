import { request } from '@/utils/request'

export function getScooterList() {
  return request({
    url: '/scooter/list',
    method: 'GET'
  })
}
