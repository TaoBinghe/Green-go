package com.greengo.service;

import com.greengo.domain.Booking;
import com.greengo.domain.PricingPlan;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

// Booking service: pricing plans, book scooter, switch booking status, list by user
@Service
public interface BookingService {

    // List all pricing plans
    List<PricingPlan> listPricingPlan();

    // Book scooter for given period
    boolean bookScooter(Integer scooterId, String hiredPeriod);

    // Legacy status toggle endpoint used by the existing front-end order detail page
    boolean updateBookingStatus(Long bookingId, String status);

    // Activate a pending booking
    boolean activateBooking(Long bookingId);

    // Change the hire period of a pending booking owned by the current user
    Booking modifyBookingPeriod(Long bookingId, String hiredPeriod);

    // Cancel a pending booking owned by the current user
    Booking cancelBooking(Long bookingId);

    // Extend an active booking owned by the current user by another fixed hire period
    Booking renewBooking(Long bookingId, String hiredPeriod);

    // Finish an active booking, pay for it, and return the updated booking and payment
    Map<String, Object> finishBooking(Long bookingId);

    // List bookings by user id, newest first
    List<Booking> listBookingsByUserId(Long userId);
}

