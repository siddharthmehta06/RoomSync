import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import RoomListing from '../models/RoomListing.js';
import MutualAgreement from '../models/MutualAgreement.js';

/**
 * @desc    Submit a booking request for a room listing
 * @route   POST /api/bookings/request (or POST /api/bookings/reserve)
 * @access  Private (Seeker)
 */
export async function reserveRoom(req, res, next) {
  try {
    const {
      roomId,
      moveInDate,
      stayDuration,
      occupantsCount,
      message,
      notes,
      scheduledDate,
      bookingType,
    } = req.body;

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROOM_ID',
          message: 'A valid roomId is required to request a room.',
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
      status: { $in: ['pending', 'accepted', 'confirmed'] },
    });

    if (existingSeekerBooking) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_RESERVED_BY_YOU',
          message: 'You already have an active booking request for this room.',
          details: [{ bookingId: existingSeekerBooking._id }],
        },
      });
    }

    const targetMoveIn = moveInDate ? new Date(moveInDate) : (scheduledDate ? new Date(scheduledDate) : new Date());

    const booking = await Booking.create({
      room: roomId,
      seeker: req.user._id,
      owner: targetRoom.owner,
      bookingType: bookingType || 'booking_request',
      moveInDate: targetMoveIn,
      stayDuration: Number(stayDuration) || 6,
      occupantsCount: Number(occupantsCount) || 1,
      message: message ? message.trim() : (notes ? notes.trim() : ''),
      status: 'pending',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('room', 'title locality city rent deposit images furnishing roomType')
      .populate('owner', 'fullName email phone avatar isVerified ownerVerificationStatus');

    return res.status(201).json({
      success: true,
      message: 'Booking request sent to owner. Awaiting owner review and acceptance.',
      data: populatedBooking,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ACTIVE_BOOKING',
          message: 'An active booking request already exists for this room.',
        },
      });
    }
    next(error);
  }
}

/**
 * @desc    Owner responds to booking request (Accept or Reject)
 * @route   PATCH /api/bookings/:id/respond
 * @access  Private (Owner / Admin)
 */
export async function respondBookingRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Action must be either "accept" or "reject".',
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking request not found.' },
      });
    }

    const booking = await Booking.findById(id).populate('room');
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking request not found.' },
      });
    }

    const userId = req.user._id.toString();
    const isOwner = booking.owner.toString() === userId || req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only the property owner can accept or reject this request.',
        },
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Cannot respond to a booking request that is already ${booking.status}.`,
        },
      });
    }

    if (action === 'reject') {
      booking.status = 'rejected';
      booking.rejectionReason = rejectionReason ? rejectionReason.trim() : 'Declined by owner';
      await booking.save();

      return res.status(200).json({
        success: true,
        message: 'Booking request declined.',
        data: booking,
      });
    }

    // Action === 'accept': Generate Mutual Digital Agreement
    booking.status = 'accepted';

    const agreementNumber = `RS-AGR-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const agreement = await MutualAgreement.create({
      agreementNumber,
      booking: booking._id,
      room: booking.room._id,
      seeker: booking.seeker,
      owner: booking.owner,
      monthlyRent: booking.room.rent,
      securityDeposit: booking.room.deposit,
      moveInDate: booking.moveInDate || new Date(),
      stayDuration: booking.stayDuration || 6,
      occupantsCount: booking.occupantsCount || 1,
      terms: {
        livingConditionsSummary: booking.room.livingConditions || {},
      },
    });

    booking.agreement = agreement._id;
    await booking.save();

    // Mark room as reserved
    await RoomListing.findByIdAndUpdate(booking.room._id, {
      status: 'reserved',
      reservedBy: booking.seeker,
    });

    const populatedAgreement = await MutualAgreement.findById(agreement._id)
      .populate('room', 'title locality city rent deposit furnishing roomType')
      .populate('seeker', 'fullName email phone')
      .populate('owner', 'fullName email phone ownerVerificationStatus');

    return res.status(200).json({
      success: true,
      message: 'Booking request accepted and mutual agreement generated successfully.',
      data: {
        booking,
        agreement: populatedAgreement,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Confirm a booking (Host accepts request - backwards compatibility alias)
 * @route   PATCH /api/bookings/:id/confirm
 * @access  Private (Owner or Admin)
 */
export async function confirmBooking(req, res, next) {
  req.body.action = 'accept';
  return respondBookingRequest(req, res, next);
}

/**
 * @desc    Get all bookings for the authenticated seeker
 * @route   GET /api/bookings/my-bookings
 * @access  Private (Seeker / User)
 */
export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ seeker: req.user._id })
      .populate('room', 'title locality city rent deposit images status furnishing roomType livingConditions')
      .populate('owner', 'fullName email phone avatar isVerified ownerVerificationStatus')
      .populate('agreement')
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
      .populate('room', 'title locality city rent deposit status images furnishing roomType livingConditions')
      .populate('seeker', 'fullName email phone avatar occupation company isVerified')
      .populate('agreement')
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
      .populate('owner', 'fullName email phone avatar isVerified ownerVerificationStatus')
      .populate('agreement');

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

    if (['cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: `Cannot cancel a booking that is already ${booking.status}.`,
        },
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // If agreement existed, cancel it
    if (booking.agreement) {
      await MutualAgreement.findByIdAndUpdate(booking.agreement, { status: 'cancelled' });
    }

    // Release the room lock back to 'active'
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
      message: 'Booking request cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}
