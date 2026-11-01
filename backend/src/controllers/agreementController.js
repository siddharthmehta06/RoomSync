import mongoose from 'mongoose';
import MutualAgreement from '../models/MutualAgreement.js';
import Booking from '../models/Booking.js';
import { generateAgreementPDF } from '../services/PDFGenerator.js';

/**
 * @desc    Get mutual agreement details by agreement ID
 * @route   GET /api/agreements/:id
 * @access  Private (Seeker, Owner, or Admin)
 */
export async function getAgreementById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGREEMENT_NOT_FOUND', message: 'Agreement not found.' },
      });
    }

    const agreement = await MutualAgreement.findById(id)
      .populate('room', 'title locality city pinCode rent deposit roomType furnishing images')
      .populate('seeker', 'fullName email phone avatar')
      .populate('owner', 'fullName email phone avatar ownerVerificationStatus');

    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGREEMENT_NOT_FOUND', message: 'Agreement not found.' },
      });
    }

    const userId = req.user._id.toString();
    const isAuthorized =
      agreement.seeker._id.toString() === userId ||
      agreement.owner._id.toString() === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this agreement.' },
      });
    }

    res.status(200).json({
      success: true,
      data: agreement,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get mutual agreement for a specific booking
 * @route   GET /api/agreements/booking/:bookingId
 * @access  Private (Seeker, Owner, or Admin)
 */
export async function getAgreementByBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Invalid booking ID.' },
      });
    }

    const agreement = await MutualAgreement.findOne({ booking: bookingId })
      .populate('room', 'title locality city pinCode rent deposit roomType furnishing images')
      .populate('seeker', 'fullName email phone avatar')
      .populate('owner', 'fullName email phone avatar ownerVerificationStatus');

    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGREEMENT_NOT_FOUND', message: 'No agreement generated for this booking yet.' },
      });
    }

    const userId = req.user._id.toString();
    const isAuthorized =
      agreement.seeker._id.toString() === userId ||
      agreement.owner._id.toString() === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to view this agreement.' },
      });
    }

    res.status(200).json({
      success: true,
      data: agreement,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Digitally review and sign the mutual agreement (non-preselected consent)
 * @route   POST /api/agreements/:id/sign
 * @access  Private (Seeker or Owner participant)
 */
export async function signAgreement(req, res, next) {
  try {
    const { id } = req.params;
    const { accepted } = req.body;

    if (!accepted || accepted !== true) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'You must review and explicitly accept the mutual agreement terms to proceed.',
        },
      });
    }

    const agreement = await MutualAgreement.findById(id);
    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGREEMENT_NOT_FOUND', message: 'Agreement not found.' },
      });
    }

    const userId = req.user._id.toString();
    const isSeeker = agreement.seeker.toString() === userId;
    const isOwner = agreement.owner.toString() === userId;

    if (!isSeeker && !isOwner) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only designated agreement participants can sign this agreement.' },
      });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (isSeeker) {
      agreement.seekerAccepted = true;
      agreement.seekerAcceptedAt = new Date();
      agreement.seekerIp = String(clientIp).split(',')[0].trim();
    }

    if (isOwner) {
      agreement.ownerAccepted = true;
      agreement.ownerAcceptedAt = new Date();
      agreement.ownerIp = String(clientIp).split(',')[0].trim();
    }

    // If both parties have independently accepted, finalize agreement
    if (agreement.seekerAccepted && agreement.ownerAccepted) {
      agreement.status = 'completed';

      // Update associated booking
      await Booking.findByIdAndUpdate(agreement.booking, { status: 'completed' });
    }

    await agreement.save();

    res.status(200).json({
      success: true,
      message: 'Agreement signed successfully.',
      data: agreement,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Generate and download agreement PDF
 * @route   GET /api/agreements/:id/pdf
 * @access  Private (Seeker, Owner, or Admin)
 */
export async function downloadAgreementPDF(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGREEMENT_NOT_FOUND', message: 'Agreement not found.' },
      });
    }

    const agreement = await MutualAgreement.findById(id)
      .populate('room', 'title locality city pinCode rent deposit roomType furnishing')
      .populate('seeker', 'fullName email phone')
      .populate('owner', 'fullName email phone ownerVerificationStatus');

    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: { code: 'AGREEMENT_NOT_FOUND', message: 'Agreement not found.' },
      });
    }

    const userId = req.user._id.toString();
    const isAuthorized =
      agreement.seeker._id.toString() === userId ||
      agreement.owner._id.toString() === userId ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to download this agreement.' },
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="RoomSync_Agreement_${agreement.agreementNumber}.pdf"`
    );

    generateAgreementPDF(agreement, res);
  } catch (error) {
    next(error);
  }
}

export default {
  getAgreementById,
  getAgreementByBooking,
  signAgreement,
  downloadAgreementPDF,
};
