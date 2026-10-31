import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import RoomListing from '../models/RoomListing.js';

/**
 * @desc    Atomically reserve a room listing with concurrency & double-booking prevention
 * @route   POST /api/bookings/reserve
 * @access  Private (Seeker)
 */
export async function reserveRoom(req, res, next) {
  try {
    const { roomId, bookingType, scheduledDate, notes, tokenAmount } = req.body;

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROOM_ID',
          message: 'A valid roomId is required to reserve a room.',
        },
      });
    }

    const targetRoom = await RoomListing.findById(roomId);
    if (!targetRoom || targetRoom.status === 'deactivated') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'The requested room listing is no longer available.',
        },
      });
    }

    // Prevent listing owner from reserving their own listing
    if (targetRoom.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_BOOK_OWN_LISTING',
          message: 'You cannot reserve your own property listing.',
        },
      });
    }

    // Check if this seeker already has an active or pending reservation for this room
    const existingSeekerBooking = await Booking.findOne({
      room: roomId,
      seeker: req.user._id,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingSeekerBooking) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_RESERVED_BY_YOU',
          message: 'You already have an active reservation for this room.',
          details: [{ bookingId: existingSeekerBooking._id }],
        },
      });
    }

    const now = new Date();
    // 15-minute temporary reservation lock (Time-To-Live hold window)
    const holdLockExpiry = new Date(now.getTime() + 15 * 60 * 1000);

    // ATOMIC COMPARE-AND-SWAP (CAS):
    // Only updates if status is currently 'active' OR
    // if a previous reservation has expired (reservedUntil < now)
    const atomicallyReservedRoom = await RoomListing.findOneAndUpdate(
      {
        _id: roomId,
        $or: [
          { status: 'active' },
          { status: 'reserved', reservedUntil: { $lt: now } },
        ],
      },
      {
        $set: {
          status: 'reserved',
          reservedBy: req.user._id,
          reservedUntil: holdLockExpiry,
        },
      },
      { new: true }
    );

    // If no document matched, another concurrent transaction acquired the lock first!
    if (!atomicallyReservedRoom) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ROOM_ALREADY_RESERVED',
          message:
            'This room has just been reserved by another seeker or is currently occupied. Please explore other listings.',
        },
      });
    }

    // Atomically create the Booking record
    try {
      const booking = await Booking.create({
        room: roomId,
        seeker: req.user._id,
        owner: atomicallyReservedRoom.owner,
        bookingType: bookingType || 'tenancy_reservation',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : now,
        status: 'pending',
        tokenAmount: tokenAmount !== undefined ? Number(tokenAmount) : 5000,
        notes: notes ? notes.trim() : '',
        reservedUntil: holdLockExpiry,
      });

      return res.status(201).json({
        success: true,
        message:
          'Room reserved successfully with a 15-minute hold lock. Please proceed to token payment verification.',
        data: booking,
      });
    } catch (bookingError) {
      // Rollback the room reservation lock if the booking document insertion collided
      await RoomListing.updateOne(
        { _id: roomId, reservedBy: req.user._id },
        {
          $set: {
            status: 'active',
            reservedBy: null,
            reservedUntil: null,
          },
        }
      );

      if (bookingError.code === 11000) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ACTIVE_BOOKING',
            message: 'An active booking record already exists for this room.',
          },
        });
      }

      throw bookingError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get all bookings for the authenticated seeker
 * @route   GET /api/bookings/my-bookings
 * @access  Private (Seeker / User)
 */
export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ seeker: req.user._id })
      .populate('room', 'title locality city rent deposit images status furnishing roomType')
      .populate('owner', 'fullName email phone avatar isVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
      meta: {
        total: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get all bookings for listings owned by the authenticated owner
 * @route   GET /api/bookings/owner-bookings
 * @access  Private (Owner / Admin)
 */
export async function getOwnerBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('room', 'title locality city rent deposit status')
      .populate('seeker', 'fullName email phone avatar occupation company isVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
      meta: {
        total: bookings.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (Participant or Admin)
 */
export async function getBookingById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    const booking = await Booking.findById(id)
      .populate('room', 'title locality city rent deposit images status amenities livingConditions')
      .populate('seeker', 'fullName email phone avatar occupation company isVerified')
      .populate('owner', 'fullName email phone avatar isVerified');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    const isAuthorized =
      booking.seeker._id.toString() === req.user._id.toString() ||
      booking.owner._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_BOOKING_ACCESS',
          message: 'You are not authorized to view this booking.',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Cancel a booking and release the room lock back to 'active'
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private (Seeker, Owner, or Admin)
 */
export async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    const isAuthorized =
      booking.seeker.toString() === req.user._id.toString() ||
      booking.owner.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_CANCELLATION',
          message: 'You are not authorized to cancel this booking.',
        },
      });
    }

    if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL_COMPLETED',
          message: `Cannot cancel a booking that is already ${booking.status}.`,
        },
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release the room lock back to 'active' atomically if reserved for this booking
    await RoomListing.updateOne(
      {
        _id: booking.room,
        reservedBy: booking.seeker,
        status: 'reserved',
      },
      {
        $set: {
          status: 'active',
          reservedBy: null,
          reservedUntil: null,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully and room has been released for other seekers.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Confirm a booking (Host accepts or deposit verified)
 * @route   PATCH /api/bookings/:id/confirm
 * @access  Private (Owner or Admin)
 */
export async function confirmBooking(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found.',
        },
      });
    }

    const isAuthorized =
      booking.owner.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_CONFIRMATION',
          message: 'Only the property host or admin can confirm this booking.',
        },
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BOOKING_STATUS',
          message: `Cannot confirm booking currently with status "${booking.status}".`,
        },
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Set room status to 'reserved' permanently until move-in
    await RoomListing.updateOne(
      { _id: booking.room },
      {
        $set: {
          status: 'reserved',
          reservedBy: booking.seeker,
          reservedUntil: null, // Indefinite lock while confirmed
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}
