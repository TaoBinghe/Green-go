package com.binghetao.service.impl;


import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.binghetao.domain.Booking;
import com.binghetao.domain.Payment;
import com.binghetao.domain.PricingPlan;
import com.binghetao.domain.Scooter;
import com.binghetao.mapper.BookingMapper;
import com.binghetao.mapper.PricingPlanMapper;
import com.binghetao.mapper.ScooterMapper;
import com.binghetao.service.BookingService;
import com.binghetao.service.PaymentService;
import com.binghetao.utils.ThreadLocalUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class BookingServiceImpl extends ServiceImpl<BookingMapper, Booking> implements BookingService {

    private static final String BOOKING_STATUS_PENDING = "PENDING";
    private static final String BOOKING_STATUS_ACTIVE = "ACTIVE";
    private static final String BOOKING_STATUS_CANCELLED = "CANCELLED";
    private static final String SCOOTER_STATUS_AVAILABLE = "AVAILABLE";
    private static final String SCOOTER_STATUS_UNAVAILABLE = "UNAVAILABLE";

    @Autowired
    private PricingPlanMapper pricingPlanMapper;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ScooterMapper scooterMapper;

    @Override
    public List<PricingPlan> listPricingPlan() {
        return pricingPlanMapper.selectList(null);
    }

    @Override
    @Transactional
    public boolean bookScooter(Integer scooterId, String hiredPeriod) {
        // 1. Get pricing plan by hire period
        PricingPlan pricingPlan = pricingPlanMapper.selectOne(
                new QueryWrapper<PricingPlan>().eq("hire_period", hiredPeriod)
        );
        if (pricingPlan == null) {
            throw new IllegalArgumentException("Pricing plan not found");
        }

        // 2. Calculate booking start and end time based on hire period
        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime;
        switch (pricingPlan.getHirePeriod()) {
            case "HOUR_1":
                endTime = startTime.plusHours(1);
                break;
            case "HOUR_4":
                endTime = startTime.plusHours(4);
                break;
            case "DAY_1":
                endTime = startTime.plusDays(1);
                break;
            case "WEEK_1":
                endTime = startTime.plusWeeks(1);
                break;
            default:
                throw new IllegalArgumentException("Pricing plan not found");
        }

        // 3. Get current user id from ThreadLocal (set by LoginInterceptor)
        Long userId = currentUserId();

        // 4. One user can only have one open booking at a time.
        ensureNoOpenBooking(userId, null, "You already have an open booking");

        // 5. The scooter must still be available when the booking is created.
        assertScooterCanBeBooked(scooterId.longValue());
        reserveScooter(scooterId.longValue());

        // 6. Create booking record with PENDING status (reserved, waiting for confirmation/payment)
        Booking booking = new Booking();
        booking.setUserId(userId);
        booking.setScooterId(scooterId.longValue());
        booking.setPricingPlanId(pricingPlan.getId());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setTotalCost(pricingPlan.getPrice());
        booking.setStatus(BOOKING_STATUS_PENDING);

        if (baseMapper.insert(booking) <= 0) {
            throw new IllegalArgumentException("Failed to create booking");
        }
        return true;
    }

    @Override
    public boolean activateBooking(Long bookingId) {
        Long userId = currentUserId();

        // Load booking
        Booking booking = baseMapper.selectById(bookingId);
        if (booking == null) {
            throw new IllegalArgumentException("Booking not found");
        }

        // Only owner can activate and only when status is PENDING
        if (!booking.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not your booking");
        }
        if (!BOOKING_STATUS_PENDING.equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only pending bookings can be activated");
        }

        ensureNoOpenBooking(userId, bookingId, "You already have another open booking");

        booking.setStatus(BOOKING_STATUS_ACTIVE);
        if (baseMapper.updateById(booking) <= 0) {
            throw new IllegalArgumentException("Failed to activate booking");
        }
        return true;
    }

    @Override
    @Transactional
    public Booking cancelBooking(Long bookingId) {
        Long userId = currentUserId();

        Booking booking = baseMapper.selectById(bookingId);
        if (booking == null) {
            throw new IllegalArgumentException("Booking not found");
        }
        if (!booking.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not your booking");
        }
        if (BOOKING_STATUS_ACTIVE.equals(booking.getStatus())) {
            throw new IllegalArgumentException("Active bookings cannot be cancelled; finish the ride and pay instead");
        }
        if (!BOOKING_STATUS_PENDING.equals(booking.getStatus())) {
            throw new IllegalArgumentException("Only pending bookings can be cancelled");
        }

        booking.setStatus(BOOKING_STATUS_CANCELLED);
        if (baseMapper.updateById(booking) <= 0) {
            throw new IllegalArgumentException("Failed to cancel booking");
        }
        releaseScooter(booking.getScooterId());
        return booking;
    }

    @Override
    public Map<String, Object> finishBooking(Long bookingId) {
        Payment payment = paymentService.pay(bookingId);
        Booking updatedBooking = baseMapper.selectById(bookingId);

        Map<String, Object> result = new HashMap<>();
        result.put("booking", updatedBooking);
        result.put("payment", payment);
        return result;
    }

    @Override
    public List<Booking> listBookingsByUserId(Long userId) {
        QueryWrapper<Booking> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).orderByDesc("created_at");
        return baseMapper.selectList(wrapper);
    }

    private Long currentUserId() {
        Map<String, Object> claims = ThreadLocalUtil.get();
        return ((Number) claims.get("id")).longValue();
    }

    private void ensureNoOpenBooking(Long userId, Long excludeBookingId, String message) {
        QueryWrapper<Booking> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId)
                .in("status", BOOKING_STATUS_PENDING, BOOKING_STATUS_ACTIVE);
        if (excludeBookingId != null) {
            wrapper.ne("id", excludeBookingId);
        }
        Long count = baseMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private void assertScooterCanBeBooked(Long scooterId) {
        Scooter scooter = scooterMapper.selectById(scooterId);
        if (scooter == null) {
            throw new IllegalArgumentException("Scooter not found");
        }
        if (!SCOOTER_STATUS_AVAILABLE.equals(scooter.getStatus())) {
            throw new IllegalArgumentException("Scooter is not available");
        }

        QueryWrapper<Booking> wrapper = new QueryWrapper<>();
        wrapper.eq("scooter_id", scooterId)
                .in("status", BOOKING_STATUS_PENDING, BOOKING_STATUS_ACTIVE);
        Long count = baseMapper.selectCount(wrapper);
        if (count != null && count > 0) {
            throw new IllegalArgumentException("Scooter is not available");
        }
    }

    private void reserveScooter(Long scooterId) {
        UpdateWrapper<Scooter> wrapper = new UpdateWrapper<>();
        wrapper.eq("id", scooterId)
                .eq("status", SCOOTER_STATUS_AVAILABLE)
                .set("status", SCOOTER_STATUS_UNAVAILABLE);
        if (scooterMapper.update(null, wrapper) <= 0) {
            throw new IllegalArgumentException("Scooter is not available");
        }
    }

    private void releaseScooter(Long scooterId) {
        Scooter scooter = new Scooter();
        scooter.setId(scooterId);
        scooter.setStatus(SCOOTER_STATUS_AVAILABLE);
        if (scooterMapper.updateById(scooter) <= 0) {
            throw new IllegalArgumentException("Scooter not found");
        }
    }
}
