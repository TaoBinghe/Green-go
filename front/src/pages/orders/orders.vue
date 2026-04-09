<template>
  <view class="theme-page orders-page">
    <view class="theme-glow theme-glow-top"></view>
    <view class="theme-glow theme-glow-bottom"></view>

    <view class="theme-shell">
      <view class="theme-hero">
        <text class="theme-kicker">BOOKING HISTORY</text>
        <text class="theme-headline">Orders</text>
        <text v-if="ordersSummary" class="theme-copy">{{ ordersSummary }}</text>
      </view>

      <view v-if="loading" class="card loading-card">
        <text>Loading orders...</text>
      </view>

      <view v-else-if="orders.length === 0" class="card empty-state">
        <text class="empty-title">No orders yet</text>
        <text class="empty-copy">Your bookings will show up here once you start your first ride.</text>
        <button class="btn-outline empty-btn" @click="goHome">Book a Scooter</button>
      </view>

      <view v-else class="orders-content">
        <view v-if="currentOrders.length" class="orders-section">
          <view class="theme-section-head orders-section-head">
            <view>
              <text class="section-title">Current Orders</text>
              <text class="theme-section-note">Pending and active rides stay here until they close.</text>
            </view>
          </view>

          <view class="order-list">
            <view
              v-for="order in currentOrders"
              :key="order.id"
              class="card order-card"
              @click="goDetail(order)"
            >
              <view class="order-card-header">
                <view class="order-header-copy">
                  <text class="order-id">Order #{{ order.id }}</text>
                  <text class="order-created">Created {{ formatTime(order.createdAt) }}</text>
                </view>
                <text class="status-badge" :class="'status-' + order.status.toLowerCase()">
                  {{ order.status }}
                </text>
              </view>

              <view class="order-details">
                <view class="order-row">
                  <text class="order-label">Scooter</text>
                  <text class="order-value">{{ order.scooterCode }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Location</text>
                  <text class="order-value">{{ order.scooterLocation }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Plan</text>
                  <text class="order-value">{{ order.hiredPeriodLabel }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Cost</text>
                  <text class="order-value order-value-strong">{{ formatCurrency(order.totalCostValue) }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">End</text>
                  <text class="order-value">{{ formatTime(order.endTime) }}</text>
                </view>
              </view>

              <view class="order-footer">
                <text class="order-link">Manage ride</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="historyOrders.length" class="orders-section">
          <view class="theme-section-head orders-section-head">
    
          </view>

          <view class="order-list">
            <view
              v-for="order in historyOrders"
              :key="order.id"
              class="card order-card"
              @click="goDetail(order)"
            >
              <view class="order-card-header">
                <view class="order-header-copy">
                  <text class="order-id">Order #{{ order.id }}</text>
                  <text class="order-created">Created {{ formatTime(order.createdAt) }}</text>
                </view>
                <text class="status-badge" :class="'status-' + order.status.toLowerCase()">
                  {{ order.status }}
                </text>
              </view>

              <view class="order-details">
                <view class="order-row">
                  <text class="order-label">Scooter</text>
                  <text class="order-value">{{ order.scooterCode }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Location</text>
                  <text class="order-value">{{ order.scooterLocation }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Plan</text>
                  <text class="order-value">{{ order.hiredPeriodLabel }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Paid</text>
                  <text class="order-value order-value-strong">{{ formatCurrency(order.totalCostValue) }}</text>
                </view>
                <view class="order-row">
                  <text class="order-label">Closed</text>
                  <text class="order-value">{{ formatTime(order.updatedAt || order.endTime) }}</text>
                </view>
              </view>

              <view class="order-footer">
                <text class="order-link">View details</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getPricingPlans } from '@/api/booking'
import { getScooterList } from '@/api/scooter'
import { getMyOrders } from '@/api/user'
import {
  buildBookingViewModel,
  buildEntityMap,
  formatCurrency,
  formatTime,
  isOpenBooking,
  sortPricingPlans
} from '@/utils/booking'
import { getToken } from '@/utils/auth'

export default {
  data() {
    return {
      orders: [],
      loading: true
    }
  },
  computed: {
    currentOrders() {
      return this.orders.filter(order => isOpenBooking(order.status))
    },
    historyOrders() {
      return this.orders.filter(order => !isOpenBooking(order.status))
    },
    ordersSummary() {
      if (this.loading) {
        return 'Loading the latest ride states, scooter locations, and pricing references.'
      }
      if (!this.orders.length) {
        return 'Keep pending rides, active trips, and finished orders in one clean timeline.'
      }
      return ''
    }
  },
  onShow() {
    if (!getToken()) {
      uni.navigateTo({ url: '/pages/login/login' })
      return
    }
    this.loadOrders()
  },
  methods: {
    async loadOrders() {
      this.loading = true
      try {
        const [ordersRes, scootersRes, pricingPlansRes] = await Promise.all([
          getMyOrders(),
          getScooterList(),
          getPricingPlans()
        ])

        const scooterMap = buildEntityMap(scootersRes.data || [])
        const pricingPlanMap = buildEntityMap(sortPricingPlans(pricingPlansRes.data || []))
        this.orders = (ordersRes.data || []).map(order => buildBookingViewModel(order, scooterMap, pricingPlanMap))
      } catch (e) {
        this.orders = []
      } finally {
        this.loading = false
      }
    },
    formatTime(timeStr) {
      return formatTime(timeStr)
    },
    formatCurrency(value) {
      return formatCurrency(value)
    },
    goDetail(order) {
      uni.navigateTo({
        url: `/pages/order-detail/order-detail?bookingId=${order.id}`
      })
    },
    goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.loading-card {
  text-align: center;
  color: #7d8677;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111111;
}

.empty-copy {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.6;
  color: #7d8677;
}

.empty-btn {
  width: 100%;
  max-width: 360rpx;
  margin-top: 28rpx;
}

.orders-content {
  margin-top: 10rpx;
}

.orders-section {
  margin-top: 18rpx;
}

.orders-section-head {
  margin-top: 0;
}

.order-list {
  margin-top: 8rpx;
}

.order-card {
  padding: 30rpx;
}

.order-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding-bottom: 22rpx;
  border-bottom: 1rpx solid #edf0e8;
}

.order-header-copy {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.order-id {
  font-size: 30rpx;
  font-weight: 700;
  color: #111111;
  word-break: break-all;
}

.order-created {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #98a093;
}

.order-details {
  padding: 18rpx 0 0;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
  padding: 12rpx 0;
}

.order-label {
  font-size: 25rpx;
  color: #8c9587;
}

.order-value {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  text-align: right;
  color: #111111;
  word-break: break-all;
}

.order-value-strong {
  font-weight: 700;
  color: #5d8c22;
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 14rpx;
}

.order-link {
  font-size: 24rpx;
  font-weight: 700;
  color: #5d8c22;
}
</style>
