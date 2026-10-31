import mongoose from 'mongoose';
import VisitRequest from '../models/VisitRequest.js';
import RoomListing from '../models/RoomListing.js';

/**
 * @desc    Submit a new property visit request
 * @route   POST /api/visits
 * @access  Private (Seeker)
 */
export async function createVisitRequest(req, res, next) {
  try {
    const { roomId, visitDate, visitTime, message } = req.body;
    const seekerId = req.user._id;

    if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid roomId is required.',
        error: { code: 'INVALID_ROOM_ID', message: 'Valid roomId is required.' },
      });
    }

    if (!visitDate) {
      return res.status(400).json({
        success: false,
        message: 'Visit date is required.',
        error: { code: 'MISSING_DATE', message: 'Visit date is required.' },
      });
    }

    const parsedDate = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() < today.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Visit date must be today or a future date.',
        error: { code: 'INVALID_VISIT_DATE', message: 'Visit date must be today or a future date.' },
      });
    }

    if (!visitTime || typeof visitTime !== 'string' || visitTime.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Visit time slot is required (e.g. "11:00 AM" or "04:30 PM").',
        error: { code: 'MISSING_TIME_SLOT', message: 'Visit time slot is required.' },
      });
    }

    const room = await RoomListing.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: { code: 'ROOM_NOT_FOUND', message: 'Room listing not found.' },
      });
    }

    if (room.owner.toString() === seekerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Property owners cannot schedule a visit to their own listing.',
        error: { code: 'SELF_VISIT_PROHIBITED', message: 'Property owners cannot schedule a visit to their own listing.' },
      });
    }

    // Check for existing pending request from the same seeker for this room
    const existingPending = await VisitRequest.findOne({
      room: roomId,
      seeker: seekerId,
      status: 'Pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active pending visit request for this property.',
        error: {
          code: 'DUPLICATE_VISIT_REQUEST',
          message: 'You already have an active pending visit request for this property.',
          details: [{ existingRequestId: existingPending._id }],
        },
      });
    }

    const visit = await VisitRequest.create({
      room: roomId,
      seeker: seekerId,
      owner: room.owner,
      visitDate: parsedDate,
      visitTime: visitTime.trim(),
      message: message ? message.trim() : '',
      status: 'Pending',
    });

    await visit.populate([
      { path: 'room', select: 'title locality city rent images googleMapsUrl' },
      { path: 'owner', select: 'fullName email phone avatar isVerified' },
      { path: 'seeker', select: 'fullName email phone avatar occupation' },
    ]);

    // Emit real-time notification to owner if socket app attached
    const io = req.app.get('io');
    if (io) {
      io.to(room.owner.toString()).emit('visit_request_received', {
        visitId: visit._id,
        roomTitle: room.title,
        seekerName: req.user.fullName,
        visitDate: visit.visitDate,
        visitTime: visit.visitTime,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Visit request submitted successfully. The property owner has been notified.',
      data: visit,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get all visit requests associated with current user (as seeker or owner)
 * @route   GET /api/visits/my
 * @access  Private
 */
export async function getMyVisits(req, res, next) {
  try {
    const userId = req.user._id;
    const { role } = req.query;

    const filter = {};
    if (role === 'owner') {
      filter.owner = userId;
    } else if (role === 'seeker') {
      filter.seeker = userId;
    } else {
      filter.$or = [{ seeker: userId }, { owner: userId }];
    }

    const visits = await VisitRequest.find(filter)
      .populate('room', 'title locality city rent deposit images googleMapsUrl exactAddress isAddressPrivate')
      .populate('seeker', 'fullName email phone avatar occupation company isVerified')
      .populate('owner', 'fullName email phone avatar isVerified')
      .sort({ visitDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: visits,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Accept, Reject, or Cancel a visit request
 * @route   PATCH /api/visits/:id/status
 * @access  Private
 */
export async function updateVisitStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, ownerResponseNote } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visit request ID.',
        error: { code: 'INVALID_ID', message: 'Invalid visit request ID.' },
      });
    }

    const allowedStatuses = ['Accepted', 'Rejected', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}.`,
        error: { code: 'INVALID_STATUS', message: 'Invalid status transition.' },
      });
    }

    const visit = await VisitRequest.findById(id).populate('room');
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found.',
        error: { code: 'VISIT_NOT_FOUND', message: 'Visit request not found.' },
      });
    }

    const isOwner = visit.owner.toString() === userId.toString();
    const isSeeker = visit.seeker.toString() === userId.toString();

    if (!isOwner && !isSeeker) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this visit request.',
        error: { code: 'FORBIDDEN', message: 'Unauthorized access to visit request.' },
      });
    }

    // Only owner can Accept or Reject
    if ((status === 'Accepted' || status === 'Rejected') && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only the property owner can accept or reject a visit request.',
        error: { code: 'OWNER_ONLY', message: 'Only owner can accept or reject.' },
      });
    }

    // Only seeker can Cancel
    if (status === 'Cancelled' && !isSeeker) {
      return res.status(403).json({
        success: false,
        message: 'Only the visiting seeker can cancel their request.',
        error: { code: 'SEEKER_ONLY', message: 'Only seeker can cancel.' },
      });
    }

    visit.status = status;
    if (ownerResponseNote && typeof ownerResponseNote === 'string') {
      visit.ownerResponseNote = ownerResponseNote.trim();
    }
    await visit.save();

    await visit.populate([
      { path: 'room', select: 'title locality city rent deposit images googleMapsUrl exactAddress isAddressPrivate' },
      { path: 'seeker', select: 'fullName email phone avatar' },
      { path: 'owner', select: 'fullName email phone avatar' },
    ]);

    // Socket notification
    const io = req.app.get('io');
    if (io) {
      const recipientId = isOwner ? visit.seeker._id.toString() : visit.owner._id.toString();
      io.to(recipientId).emit('visit_status_updated', {
        visitId: visit._id,
        status: visit.status,
        roomTitle: visit.room?.title,
        ownerResponseNote: visit.ownerResponseNote,
      });
    }

    res.status(200).json({
      success: true,
      message: `Visit request marked as ${status}.`,
      data: visit,
    });
  } catch (error) {
    next(error);
  }
}
