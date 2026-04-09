<template>
  <view class="booking-screen">
    <map
      class="booking-fullscreen-map"
      :latitude="mapCenter.latitude"
      :longitude="mapCenter.longitude"
      :scale="fullscreenMapScale"
      :markers="mapMarkers"
      :circles="mapCircles"
      :enable-scroll="true"
      :enable-zoom="true"
      @markertap="handleMarkerTap"
    >

      <cover-view class="booking-bottom-sheet">
        <template v-if="scooterLoading">
          <cover-view class="sheet-title">Loading scooters...</cover-view>
          <cover-view class="sheet-copy">Pulling the live fleet and map positions now.</cover-view>
        </template>

        <template v-else-if="!scooters.length">
          <cover-view class="sheet-title">No scooters loaded</cover-view>
          <cover-view class="sheet-copy">We could not load the fleet list right now. Please try again later.</cover-view>
        </template>

        <template v-else-if="bookingStep === 'select'">
          <cover-view class="sheet-title">
            {{ selectedScooter ? selectedScooter.scooterCode : 'Browse available scooters' }}
          </cover-view>
          <cover-view class="sheet-copy">
            {{ selectedScooter ? (selectedScooter.location || 'Unknown location') : '' }}
          </cover-view>

          <cover-view v-if="selectedScooter" class="sheet-info-card">
            <cover-view class="sheet-info-row">
              <cover-view class="sheet-info-label">Scooter ID</cover-view>
              <cover-view class="sheet-info-value">#{{ selectedScooter.id }}</cover-view>
            </cover-view>
            <cover-view class="sheet-info-row">
              <cover-view class="sheet-info-label">Status</cover-view>
              <cover-view class="sheet-info-value">{{ selectedScooter.status }}</cover-view>
            </cover-view>
          </cover-view>

          <cover-view class="sheet-actions">
            <cover-view class="sheet-button sheet-button-secondary" @tap="focusAvailableScooter">
              Recenter Map
            </cover-view>
            <cover-view
              class="sheet-button sheet-button-primary"
              :class="{ 'sheet-button-disabled': !canUseSelectedScooter }"
              @tap="handleUseScooter"
            >
              {{ !selectedScooter ? 'Pick a Scooter' : (canUseSelectedScooter ? 'Use This Scooter' : 'Unavailable') }}
            </cover-view>
          </cover-view>
        </template>

        <template v-else>
          <cover-view class="sheet-kicker">Booking Order</cover-view>
          <cover-view class="sheet-title">{{ selectedScooter ? selectedScooter.scooterCode : 'Selected scooter' }}</cover-view>
          <cover-view class="sheet-copy">
            {{ selectedScooter ? (selectedScooter.location || 'Unknown location') : 'Choose a scooter first.' }}
          </cover-view>

          <cover-view class="sheet-order-card">
            <cover-view class="sheet-order-row">
              <cover-view class="sheet-order-label">Scooter</cover-view>
              <cover-view class="sheet-order-value">{{ selectedScooter ? selectedScooter.scooterCode : '-' }}</cover-view>
            </cover-view>
            <cover-view class="sheet-order-row">
              <cover-view class="sheet-order-label">Location</cover-view>
              <cover-view class="sheet-order-value">{{ selectedScooter ? (selectedScooter.location || 'Unknown location') : '-' }}</cover-view>
            </cover-view>
            <cover-view class="sheet-order-row">
              <cover-view class="sheet-order-label">Plan</cover-view>
              <cover-view class="sheet-order-value">{{ selectedPlan ? formatPeriod(selectedPlan.hirePeriod) : 'Choose below' }}</cover-view>
            </cover-view>
            <cover-view class="sheet-order-row">
              <cover-view class="sheet-order-label">Price</cover-view>
              <cover-view class="sheet-order-value sheet-order-price">
                {{ selectedPlan ? formatCurrency(selectedPlan.price) : '-' }}
              </cover-view>
            </cover-view>
          </cover-view>

          <cover-view class="sheet-plan-list">
            <cover-view
              v-for="plan in plans"
              :key="plan.id"
              class="sheet-plan-option"
              :class="{ 'sheet-plan-option-active': selectedPeriod === plan.hirePeriod }"
              @tap="selectPlan(plan)"
            >
              <cover-view class="sheet-plan-name">{{ formatPeriod(plan.hirePeriod) }}</cover-view>
              <cover-view class="sheet-plan-price">{{ formatCurrency(plan.price) }}</cover-view>
            </cover-view>
          </cover-view>

          <cover-view class="sheet-actions">
            <cover-view class="sheet-button sheet-button-secondary" @tap="handleChangeScooter">
              Change Scooter
            </cover-view>
            <cover-view
              class="sheet-button sheet-button-primary"
              :class="{ 'sheet-button-disabled': !canSubmit }"
              @tap="handleBook"
            >
              {{ submitting ? 'Creating...' : 'Confirm Booking' }}
            </cover-view>
          </cover-view>
        </template>
      </cover-view>
    </map>

    <view class="booking-topbar" :style="bookingTopbarStyle">
      <view class="booking-back-button" @click="handlePageBack">
        <text class="booking-back-icon">‹</text>
      </view>
      <view class="booking-search-shell" :style="bookingSearchStyle">
        <input
          v-model="searchScooterId"
          class="booking-search-input"
          type="number"
          confirm-type="search"
          placeholder="Search scooter ID"
          placeholder-style="color: #8f9892"
          @confirm="handleSearchScooter"
        />
        <view class="booking-search-button" @click="handleSearchScooter">
          Go
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { createBooking, getPricingPlans } from '@/api/booking'
import { getScooterList } from '@/api/scooter'
import { getMyOrders } from '@/api/user'
import {
  formatCurrency,
  formatPeriod,
  sortPricingPlans,
  sortScooters
} from '@/utils/booking'

const DEFAULT_CENTER = {
  latitude: 23.097891,
  longitude: 113.323912
}

export default {
  data() {
    return {
      scooters: [],
      plans: [],
      selectedScooterId: null,
      searchScooterId: '',
      selectedPeriod: '',
      selectedPlan: null,
      scooterLoading: true,
      planLoading: true,
      submitting: false,
      bookingStep: 'select',
      mapCenter: { ...DEFAULT_CENTER },
      mapScale: 16,
      topbarTop: '56px',
      topbarWidth: '280px',
      countPillTop: '156px'
    }
  },
  computed: {
    selectedScooter() {
      return this.scooters.find(scooter => scooter.id === this.selectedScooterId) || null
    },
    availableCount() {
      return this.scooters.filter(scooter => scooter.status === 'AVAILABLE').length
    },
    mapMarkers() {
      return this.scooters
        .filter(scooter => this.hasCoordinates(scooter))
        .map((scooter) => ({
          id: Number(scooter.id),
          latitude: Number(scooter.latitude),
          longitude: Number(scooter.longitude),
          iconPath: '/static/logo.png',
          width: this.selectedScooterId === scooter.id ? 34 : 28,
          height: this.selectedScooterId === scooter.id ? 34 : 28,
          alpha: scooter.status === 'AVAILABLE' ? 1 : 0.55,
          callout: {
            content: scooter.scooterCode,
            color: scooter.status === 'AVAILABLE' ? '#111111' : '#6f776a',
            fontSize: 11,
            borderRadius: 12,
            bgColor: this.selectedScooterId === scooter.id ? '#efff84' : '#ffffff',
            padding: 6,
            display: this.selectedScooterId === scooter.id ? 'ALWAYS' : 'BYCLICK'
          }
        }))
    },
    mapCircles() {
      if (!this.selectedScooter || !this.hasCoordinates(this.selectedScooter)) {
        return []
      }

      return [
        {
          latitude: Number(this.selectedScooter.latitude),
          longitude: Number(this.selectedScooter.longitude),
          radius: 38,
          strokeWidth: 2,
          color: '#94c83d66',
          fillColor: '#efff8440'
        }
      ]
    },
    fullscreenMapScale() {
      return Math.max(this.mapScale, 16)
    },
    canSubmit() {
      return !!this.selectedScooter && !!this.selectedPlan && !this.submitting
    },
    canUseSelectedScooter() {
      return !!this.selectedScooter && this.selectedScooter.status === 'AVAILABLE'
    },
    bookingTopbarStyle() {
      return {
        top: this.topbarTop
      }
    },
    bookingSearchStyle() {
      return {
        width: this.topbarWidth
      }
    },
    bookingCountPillStyle() {
      return {
        top: this.countPillTop
      }
    }
  },
  onLoad(options) {
    this.initTopLayout()
    if (options.period) {
      this.selectedPeriod = options.period
    }
    this.loadPageData()
  },
  methods: {
    initTopLayout() {
      let top = 56
      let width = 280

      try {
        const windowInfo = typeof uni.getWindowInfo === 'function'
          ? uni.getWindowInfo()
          : uni.getSystemInfoSync()
        const windowWidth = typeof windowInfo?.windowWidth === 'number' ? windowInfo.windowWidth : 375
        const screenPadding = Math.round((windowWidth * 24) / 750)
        const backButtonWidth = Math.round((windowWidth * 82) / 750)
        const backButtonGap = Math.round((windowWidth * 18) / 750)
        const leftReserved = screenPadding + backButtonWidth + backButtonGap

        const safeTop = typeof windowInfo?.safeAreaInsets?.top === 'number'
          ? windowInfo.safeAreaInsets.top
          : (typeof windowInfo?.statusBarHeight === 'number' ? windowInfo.statusBarHeight : 0)

        top = Math.max(top, safeTop + 20)

        const halfWindow = windowWidth / 2
        let rightLimit = windowWidth - screenPadding

        if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
          const menuButtonRect = uni.getMenuButtonBoundingClientRect()
          if (menuButtonRect && typeof menuButtonRect.bottom === 'number') {
            top = Math.max(top, menuButtonRect.bottom + 12)
          }
          if (
            menuButtonRect
            && typeof menuButtonRect.left === 'number'
          ) {
            rightLimit = Math.min(rightLimit, menuButtonRect.left - 12)
          }
        }

        const centeredHalfSpan = Math.min(
          halfWindow - leftReserved,
          rightLimit - halfWindow
        )
        const maxCenteredWidth = Math.floor(Math.max(200, centeredHalfSpan * 2))
        const maxScreenWidth = windowWidth - (screenPadding * 2)
        width = Math.min(maxScreenWidth, maxCenteredWidth)
      } catch (e) {
        // Keep the fallback spacing if platform metrics are unavailable.
      }

      this.topbarTop = `${top}px`
      this.topbarWidth = `${width}px`
      this.countPillTop = `${top + 94}px`
    },
    async loadPageData() {
      await Promise.all([this.loadScooters(), this.loadPlans()])
    },
    async loadScooters() {
      this.scooterLoading = true
      try {
        const res = await getScooterList()
        this.scooters = sortScooters(res.data || [])
        this.focusAvailableScooter()
      } catch (e) {
        this.scooters = []
      } finally {
        this.scooterLoading = false
      }
    },
    async loadPlans() {
      this.planLoading = true
      try {
        const res = await getPricingPlans()
        this.plans = sortPricingPlans(res.data || [])
        if (this.selectedPeriod) {
          this.selectedPlan = this.plans.find(plan => plan.hirePeriod === this.selectedPeriod) || null
        }
      } catch (e) {
        this.plans = []
      } finally {
        this.planLoading = false
      }
    },
    hasCoordinates(scooter) {
      return scooter && scooter.longitude != null && scooter.latitude != null
    },
    focusAvailableScooter() {
      const focusScooter = this.selectedScooter && this.hasCoordinates(this.selectedScooter)
        ? this.selectedScooter
        : this.scooters.find(scooter => scooter.status === 'AVAILABLE' && this.hasCoordinates(scooter))
          || this.scooters.find(scooter => this.hasCoordinates(scooter))

      if (!focusScooter) {
        this.mapCenter = { ...DEFAULT_CENTER }
        return
      }

      this.mapCenter = {
        latitude: Number(focusScooter.latitude),
        longitude: Number(focusScooter.longitude)
      }
    },
    selectScooter(scooter) {
      this.selectedScooterId = scooter.id
      if (this.hasCoordinates(scooter)) {
        this.mapCenter = {
          latitude: Number(scooter.latitude),
          longitude: Number(scooter.longitude)
        }
        this.mapScale = 18
      }
    },
    handleMarkerTap(event) {
      const scooter = this.scooters.find(item => Number(item.id) === Number(event.detail.markerId))
      if (scooter) {
        this.selectScooter(scooter)
      }
    },
    handlePageBack() {
      if (getCurrentPages().length > 1) {
        uni.navigateBack()
        return
      }
      uni.switchTab({ url: '/pages/index/index' })
    },
    handleSearchScooter() {
      const keyword = String(this.searchScooterId || '').trim()
      if (!keyword) {
        uni.showToast({ title: 'Please enter a scooter ID', icon: 'none' })
        return
      }

      const scooter = this.scooters.find(item => String(item.id) === keyword)
      if (!scooter) {
        uni.showToast({ title: 'Scooter not found', icon: 'none' })
        return
      }

      this.bookingStep = 'select'
      this.selectScooter(scooter)
    },
    handleUseScooter() {
      if (!this.selectedScooter) {
        uni.showToast({ title: 'Please choose a scooter', icon: 'none' })
        return
      }
      if (!this.canUseSelectedScooter) {
        uni.showToast({ title: 'This scooter is unavailable', icon: 'none' })
        return
      }
      this.bookingStep = 'order'
    },
    handleChangeScooter() {
      this.bookingStep = 'select'
    },
    selectPlan(plan) {
      this.selectedPeriod = plan.hirePeriod
      this.selectedPlan = plan
    },
    formatPeriod(period) {
      return formatPeriod(period)
    },
    formatCurrency(value) {
      return formatCurrency(value)
    },
    async goToCreatedBookingDetail() {
      try {
        const ordersRes = await getMyOrders()
        const latestOrder = (ordersRes.data || [])[0]
        if (latestOrder && latestOrder.id != null) {
          uni.redirectTo({
            url: `/pages/order-detail/order-detail?bookingId=${latestOrder.id}`
          })
          return
        }
      } catch (e) {
        // Fall back to the orders tab if the latest booking cannot be resolved.
      }

      uni.switchTab({ url: '/pages/orders/orders' })
    },
    async handleBook() {
      if (!this.selectedScooter) {
        uni.showToast({ title: 'Please choose a scooter', icon: 'none' })
        return
      }
      if (!this.selectedPlan) {
        uni.showToast({ title: 'Please select a plan', icon: 'none' })
        return
      }
      if (this.submitting) {
        return
      }

      this.submitting = true
      try {
        await createBooking(this.selectedScooter.id, this.selectedPlan.hirePeriod)
        uni.showToast({ title: 'Booking pending', icon: 'success' })
        setTimeout(() => {
          this.goToCreatedBookingDetail()
        }, 700)
      } catch (e) {
        // error toast handled by request.js
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.booking-screen {
  position: relative;
  min-height: 100vh;
  background: #dce8f3;
}

.booking-fullscreen-map {
  width: 100%;
  height: 100vh;
}

.booking-topbar {
  position: absolute;
  top: calc(56rpx + env(safe-area-inset-top));
  left: 0;
  right: 0;
  min-height: 82rpx;
  z-index: 10;
}

.booking-back-button {
  position: absolute;
  top: 0;
  left: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 82rpx;
  height: 82rpx;
  border-radius: 41rpx;
  background: rgba(255, 255, 255, 0.96);
  color: #111111;
}

.booking-back-icon {
  color: #111111;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1;
}

.booking-search-shell {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 82rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  display: flex;
  align-items: center;
  padding: 0 12rpx 0 24rpx;
}

.booking-search-input {
  flex: 1;
  min-width: 0;
  height: 82rpx;
  color: #24311f;
  font-size: 24rpx;
}

.booking-search-button {
  min-width: 86rpx;
  height: 58rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  background: #efff84;
  color: #111111;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 58rpx;
  text-align: center;
}

.booking-count-pill {
  position: absolute;
  top: calc(156rpx + env(safe-area-inset-top));
  left: 24rpx;
  padding: 0 24rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.94);
  color: #24311f;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 64rpx;
}

.booking-bottom-sheet {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  padding: 30rpx 28rpx 24rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.97);
}

.sheet-kicker {
  color: #89a54c;
  font-size: 22rpx;
  line-height: 1.2;
  letter-spacing: 2rpx;
  text-transform: uppercase;
}

.sheet-title {
  margin-top: 12rpx;
  color: #111111;
  font-size: 36rpx;
  font-weight: 700;
  line-height: 1.24;
}

.sheet-copy {
  margin-top: 10rpx;
  color: #6f776a;
  font-size: 24rpx;
  line-height: 1.5;
}

.sheet-info-card,
.sheet-order-card {
  margin-top: 22rpx;
  padding: 22rpx 22rpx 10rpx;
  border-radius: 24rpx;
  background: #f7f8f5;
}

.sheet-info-row,
.sheet-order-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14rpx;
}

.sheet-info-label,
.sheet-order-label {
  width: 180rpx;
  color: #98a093;
  font-size: 22rpx;
  line-height: 1.5;
}

.sheet-info-value,
.sheet-order-value {
  flex: 1;
  min-width: 0;
  color: #111111;
  font-size: 24rpx;
  line-height: 1.5;
  text-align: right;
}

.sheet-order-price {
  color: #5d8c22;
  font-weight: 700;
}

.sheet-plan-list {
  margin-top: 20rpx;
}

.sheet-plan-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: #f7f8f5;
  border: 2rpx solid #f7f8f5;
}

.sheet-plan-option-active {
  background: #f7fbeb;
  border-color: #d8ef8c;
}

.sheet-plan-name {
  color: #111111;
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1.4;
}

.sheet-plan-price {
  color: #5d8c22;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 1.4;
}

.sheet-actions {
  display: flex;
  margin-top: 24rpx;
}

.sheet-button {
  flex: 1;
  height: 88rpx;
  border-radius: 28rpx;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 88rpx;
  text-align: center;
}

.sheet-button + .sheet-button {
  margin-left: 16rpx;
}

.sheet-button-secondary {
  background: #f3f5f1;
  color: #24311f;
}

.sheet-button-primary {
  background: #efff84;
  color: #111111;
}

.sheet-button-disabled {
  background: #edf0e8;
  color: #96a091;
}
</style>
