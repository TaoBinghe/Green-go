<template>
  <view class="theme-page detail-page">
    <view class="theme-glow theme-glow-top"></view>
    <view class="theme-glow theme-glow-bottom"></view>

    <view class="theme-shell">
      <view v-if="loading" class="card loading-card">
        <text>Loading order details...</text>
      </view>

      <view v-else-if="!order" class="card empty-state">
        <text class="empty-title">Order not found</text>
        <text class="empty-copy">We could not load the latest booking details for this page.</text>
        <button class="btn-outline empty-btn" @click="goBackToOrders">Back to orders</button>
      </view>

      <view v-else>
        <view class="card status-card">
          <view class="status-marker" :class="'status-marker-' + statusTone">
            {{ statusShort }}
          </view>
          <text class="status-title">{{ order.status }}</text>
          <text class="status-copy">{{ statusDesc }}</text>
        </view>

        <view class="card">
          <text class="section-title">Order Information</text>
          <view class="info-row">
            <text class="info-label">Order ID</text>
            <text class="info-value">#{{ order.id }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Scooter</text>
            <text class="info-value">{{ order.scooterCode }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Location</text>
            <text class="info-value">{{ order.scooterLocation }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Hire Period</text>
            <text class="info-value">{{ order.hiredPeriodLabel }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Start Time</text>
            <text class="info-value">{{ formatTime(order.startTime) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">End Time</text>
            <text class="info-value">{{ formatTime(order.endTime) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Total Cost</text>
            <text class="info-value info-value-strong">{{ formatCurrency(order.totalCostValue) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Created</text>
            <text class="info-value">{{ formatTime(order.createdAt) }}</text>
          </view>
        </view>

        <view v-if="paymentReceipt" class="card">
          <text class="section-title">Payment Receipt</text>
          <view class="info-row">
            <text class="info-label">Status</text>
            <text class="info-value" :class="paymentReceipt.status === 'SUCCESS' ? 'text-positive' : 'text-danger'">
              {{ paymentReceipt.status }}
            </text>
          </view>
          <view class="info-row">
            <text class="info-label">Amount</text>
            <text class="info-value">{{ formatCurrency(paymentReceipt.amount) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Transaction ID</text>
            <text class="info-value">{{ paymentReceipt.transactionId || '-' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Card</text>
            <text class="info-value">{{ paymentReceipt.cardLastFour ? `****${paymentReceipt.cardLastFour}` : '-' }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">Payment Time</text>
            <text class="info-value">{{ formatTime(paymentReceipt.paymentTime) }}</text>
          </view>
        </view>

        <view v-else-if="paymentUnavailable" class="card receipt-missing-card">
          <text class="section-title">Payment Receipt</text>
          <text class="receipt-missing-copy">This order is completed, but this device does not have the original payment receipt cached.</text>
        </view>

        <view v-if="order.status === 'PENDING'" class="action-buttons">
          <button class="btn-primary action-button" :loading="activating" @click="handleActivate">
            Activate Ride
          </button>
          <button class="btn-outline action-button" :loading="updatingPeriod" @click="openPlanSelector('modify')">
            Change Hire Period
          </button>
          <button class="btn-danger action-button" :loading="cancelling" @click="handleCancel">
            Cancel Order
          </button>
        </view>

        <view v-else-if="order.status === 'ACTIVE'" class="action-buttons">
          <button class="btn-outline action-button" :loading="updatingPeriod" @click="openPlanSelector('renew')">
            Extend Ride
          </button>
          <button class="btn-primary action-button" :loading="finishing" @click="handleFinish">
            Finish and Pay
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import {
  activateBooking,
  cancelBooking,
  finishBooking,
  getPricingPlans,
  modifyBookingPeriod,
  renewBooking
} from '@/api/booking'
import { getScooterList } from '@/api/scooter'
import { getMyOrders } from '@/api/user'
import {
  buildBookingViewModel,
  buildEntityMap,
  formatCurrency,
  formatPeriod,
  formatTime,
  sortPricingPlans
} from '@/utils/booking'
import { getPaymentReceipt, savePaymentReceipt } from '@/utils/payment-receipts'
import { getToken } from '@/utils/auth'

export default {
  data() {
    return {
      bookingId: '',
      order: null,
      pricingPlans: [],
      pricingPlanMap: {},
      scooterMap: {},
      paymentReceipt: null,
      loading: true,
      activating: false,
      cancelling: false,
      updatingPeriod: false,
      finishing: false
    }
  },
  computed: {
    statusTone() {
      if (!this.order) return 'pending'

      const map = {
        PENDING: 'pending',
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
      }
      return map[this.order.status] || 'pending'
    },
    statusShort() {
      const map = {
        pending: 'P',
        active: 'A',
        completed: 'C',
        cancelled: 'X'
      }
      return map[this.statusTone] || 'P'
    },
    statusDesc() {
      if (!this.order) return ''

      const map = {
        PENDING: 'Your scooter is reserved. Activate it when you are ready, update the hire period, or cancel before the ride starts.',
        ACTIVE: 'Your ride is in progress. Extend the booking if you need more time, or finish the order to complete payment.',
        COMPLETED: this.paymentReceipt
          ? 'This ride is closed and the payment receipt is stored on this device.'
          : 'This ride is closed. The order is still valid, but this device does not have the original payment receipt cached.',
        CANCELLED: 'This booking was cancelled before the ride started.'
      }
      return map[this.order.status] || ''
    },
    paymentUnavailable() {
      return !!this.order && this.order.status === 'COMPLETED' && !this.paymentReceipt
    }
  },
  onLoad(options) {
    this.bookingId = options.bookingId || ''
  },
  onShow() {
    if (!getToken()) {
      uni.navigateTo({ url: '/pages/login/login' })
      return
    }
    this.loadDetail()
  },
  methods: {
    async loadDetail() {
      if (!this.bookingId) {
        this.order = null
        this.loading = false
        return
      }

      this.loading = true
      try {
        const [ordersRes, scootersRes, pricingPlansRes] = await Promise.all([
          getMyOrders(),
          getScooterList(),
          getPricingPlans()
        ])

        this.pricingPlans = sortPricingPlans(pricingPlansRes.data || [])
        this.pricingPlanMap = buildEntityMap(this.pricingPlans)
        this.scooterMap = buildEntityMap(scootersRes.data || [])

        const booking = (ordersRes.data || []).find(item => String(item.id) === String(this.bookingId))
        this.order = booking ? buildBookingViewModel(booking, this.scooterMap, this.pricingPlanMap) : null
        this.paymentReceipt = this.order && this.order.status === 'COMPLETED'
          ? getPaymentReceipt(this.order.id)
          : null
      } catch (e) {
        this.order = null
        this.paymentReceipt = null
      } finally {
        this.loading = false
      }
    },
    applyBookingUpdate(booking) {
      this.order = buildBookingViewModel(booking, this.scooterMap, this.pricingPlanMap)
    },
    formatTime(timeStr) {
      return formatTime(timeStr)
    },
    formatCurrency(value) {
      return formatCurrency(value)
    },
    async confirmAction(title, content, confirmColor = '#5d8c22') {
      return new Promise((resolve) => {
        uni.showModal({
          title,
          content,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          confirmColor,
          success: (res) => resolve(res.confirm),
          fail: () => resolve(false)
        })
      })
    },
    async handleActivate() {
      if (!this.order) return

      this.activating = true
      try {
        await activateBooking(this.order.id)
        uni.showToast({ title: 'Ride activated', icon: 'success' })
        await this.loadDetail()
      } catch (e) {
        // error toast handled by request.js
      } finally {
        this.activating = false
      }
    },
    async handleCancel() {
      if (!this.order) return

      const confirmed = await this.confirmAction(
        'Cancel order',
        'This will release the scooter and close the pending booking.',
        '#c85c55'
      )
      if (!confirmed) return

      this.cancelling = true
      try {
        const res = await cancelBooking(this.order.id)
        this.applyBookingUpdate(res.data)
        uni.showToast({ title: 'Order cancelled', icon: 'success' })
      } catch (e) {
        // error toast handled by request.js
      } finally {
        this.cancelling = false
      }
    },
    openPlanSelector(mode) {
      if (!this.pricingPlans.length) {
        uni.showToast({ title: 'Pricing plans unavailable', icon: 'none' })
        return
      }

      uni.showActionSheet({
        itemList: this.pricingPlans.map(plan => `${formatPeriod(plan.hirePeriod)} · ${formatCurrency(plan.price)}`),
        success: ({ tapIndex }) => {
          const plan = this.pricingPlans[tapIndex]
          if (plan) {
            this.applyPlanSelection(mode, plan)
          }
        }
      })
    },
    async applyPlanSelection(mode, plan) {
      if (!this.order || !plan) return

      this.updatingPeriod = true
      try {
        const res = mode === 'modify'
          ? await modifyBookingPeriod(this.order.id, plan.hirePeriod)
          : await renewBooking(this.order.id, plan.hirePeriod)

        this.applyBookingUpdate(res.data)
        uni.showToast({
          title: mode === 'modify' ? 'Hire period updated' : 'Ride extended',
          icon: 'success'
        })
      } catch (e) {
        // error toast handled by request.js
      } finally {
        this.updatingPeriod = false
      }
    },
    async handleFinish() {
      if (!this.order) return

      const confirmed = await this.confirmAction(
        'Finish ride',
        'This will end the active order and complete payment.',
        '#5d8c22'
      )
      if (!confirmed) return

      this.finishing = true
      try {
        const res = await finishBooking(this.order.id)
        this.applyBookingUpdate(res.data.booking)
        savePaymentReceipt(this.order.id, res.data.payment)
        this.paymentReceipt = res.data.payment
        uni.showToast({ title: 'Ride completed', icon: 'success' })
      } catch (e) {
        // error toast handled by request.js
      } finally {
        this.finishing = false
      }
    },
    goBackToOrders() {
      uni.switchTab({ url: '/pages/orders/orders' })
    }
  }
}
</script>

<style scoped>
.loading-card {
  text-align: center;
  color: #7d8677;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-top: 18rpx;
}

.status-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  font-size: 40rpx;
  font-weight: 700;
}

.status-marker-pending {
  background: #fff5db;
  color: #b98224;
}

.status-marker-active {
  background: #effad7;
  color: #5d8c22;
}

.status-marker-completed {
  background: #edf6ea;
  color: #4a7c52;
}

.status-marker-cancelled {
  background: #fff0ed;
  color: #c85c55;
}

.status-title {
  display: block;
  margin-top: 18rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #111111;
}

.status-copy {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  line-height: 1.6;
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

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #edf0e8;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 25rpx;
  color: #8c9587;
}

.info-value {
  flex: 1;
  min-width: 0;
  font-size: 27rpx;
  text-align: right;
  color: #111111;
  word-break: break-all;
}

.info-value-strong {
  font-weight: 700;
  color: #5d8c22;
}

.text-positive {
  color: #4a7c52;
}

.text-danger {
  color: #c85c55;
}

.receipt-missing-card {
  margin-top: 0;
}

.receipt-missing-copy {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  line-height: 1.6;
  color: #7d8677;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 20rpx;
}

.action-button {
  width: 100%;
}
</style>
