import mongoose from 'mongoose';
import OwnerVerification from '../models/OwnerVerification.js';
import User from '../models/User.js';

/**
 * Helper to securely mask an ID number so sensitive credentials are never stored in raw form.
 * E.g. "123456789012" -> "XXXX-XXXX-9012"
 */
function maskDocumentIdentifier(rawId, docType) {
  if (!rawId) return 'MASKED-ID';
  const clean = String(rawId).replace(/[\s-]/g, '');
  if (clean.length < 4) return 'XXXX';
  const last4 = clean.slice(-4);

  if (docType === 'Aadhaar_Virtual_ID_Masked') {
    return `XXXX-XXXX-${last4}`;
  } else if (docType === 'Passport') {
    return `${clean.slice(0, 1).toUpperCase()}XXXXXX${last4}`;
  } else if (docType === 'Voter_ID') {
    return `VTR-XXXX-${last4}`;
  } else {
    return `DL-XXXX-${last4}`;
  }
}

/**
 * @desc    Submit identity verification application
 * @route   POST /api/verification/submit
 * @access  Private (Owner or Seeker transitioning to Owner)
 */
export async function submitVerification(req, res, next) {
  try {
    const {
      legalFullName,
      verifiedEmail,
      verifiedPhone,
      currentAddress,
      idDocumentType,
      idNumber,
      documentUrl,
      consentGiven,
      explicitConsent,
    } = req.body;

    const hasConsent = Boolean(consentGiven || explicitConsent);
    if (!hasConsent) {
      return res.status(400).json({
        success: false,
        message: 'Explicit consent is mandatory to process identity verification.',
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'You must review and accept the identity verification consent notice.',
        },
      });
    }

    const docType = (idDocumentType === 'Aadhaar' || idDocumentType === 'Aadhaar Card')
      ? 'Aadhaar_Virtual_ID_Masked'
      : idDocumentType;

    if (!legalFullName || !currentAddress || !docType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: 'Legal full name, address, document type, and document identifier are required.',
        error: { code: 'MISSING_VERIFICATION_FIELDS', message: 'All verification fields are required.' },
      });
    }

    const maskedIdNumber = maskDocumentIdentifier(idNumber, docType);

    // Look for existing verification record
    let verification = await OwnerVerification.findOne({ owner: req.user._id });

    if (verification) {
      if (verification.status === 'Verified') {
        return res.status(400).json({
          success: false,
          message: 'Your identity is already verified. No further action is required.',
          error: { code: 'ALREADY_VERIFIED', message: 'Owner identity is already verified.' },
        });
      }

      if (verification.status === 'Pending') {
        return res.status(409).json({
          success: false,
          message: 'Your verification is currently under review by our safety team.',
          error: { code: 'VERIFICATION_PENDING', message: 'Verification already pending review.' },
        });
      }

      // Update existing record
      const previousStatus = verification.status;
      verification.legalFullName = legalFullName.trim();
      verification.verifiedEmail = (verifiedEmail || req.user.email).trim().toLowerCase();
      verification.verifiedPhone = (verifiedPhone || req.user.phone).trim();
      verification.currentAddress = currentAddress.trim();
      verification.idDocumentType = docType;
      verification.maskedIdNumber = maskedIdNumber;
      if (documentUrl) verification.documentUrl = documentUrl;
      verification.consentGiven = true;
      verification.consentTimestamp = new Date();
      verification.status = 'Pending';
      verification.reviewerNotes = '';
      verification.auditLogs.push({
        fromStatus: previousStatus,
        toStatus: 'Pending',
        reason: 'Verification resubmitted by owner',
        changedBy: req.user._id,
        timestamp: new Date(),
      });

      await verification.save();
    } else {
      // Create new record
      verification = await OwnerVerification.create({
        owner: req.user._id,
        status: 'Pending',
        legalFullName: legalFullName.trim(),
        verifiedEmail: (verifiedEmail || req.user.email).trim().toLowerCase(),
        verifiedPhone: (verifiedPhone || req.user.phone).trim(),
        currentAddress: currentAddress.trim(),
        idDocumentType: docType,
        maskedIdNumber,
        documentUrl: documentUrl || null,
        consentGiven: true,
        consentTimestamp: new Date(),
        auditLogs: [
          {
            fromStatus: 'Not Started',
            toStatus: 'Pending',
            reason: 'Initial verification submission by user',
            changedBy: req.user._id,
            timestamp: new Date(),
          },
        ],
      });
    }

    // Update User record status
    await User.findByIdAndUpdate(req.user._id, {
      ownerVerificationStatus: 'Pending',
      role: 'owner', // Switch role to owner (pending approval)
    });

    res.status(200).json({
      success: true,
      message: 'Identity verification submitted successfully. Our safety team will review your application within 24-48 hours.',
      data: {
        status: verification.status,
        maskedIdNumber: verification.maskedIdNumber,
        submittedAt: verification.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get current user's owner verification status
 * @route   GET /api/verification/my-status
 * @access  Private (Authenticated User)
 */
export async function getMyVerificationStatus(req, res, next) {
  try {
    const verification = await OwnerVerification.findOne({ owner: req.user._id });

    if (!verification) {
      return res.status(200).json({
        success: true,
        data: {
          status: req.user.ownerVerificationStatus || 'Not Started',
          legalFullName: null,
          maskedIdNumber: null,
          canListRooms: req.user.ownerVerificationStatus === 'Verified',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: verification.status,
        legalFullName: verification.legalFullName,
        maskedIdNumber: verification.maskedIdNumber,
        idDocumentType: verification.idDocumentType,
        reviewerNotes: verification.reviewerNotes || '',
        updatedAt: verification.updatedAt,
        canListRooms: verification.status === 'Verified',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Seeker request to become a room owner
 * @route   POST /api/verification/become-owner
 * @access  Private (Seeker)
 */
export async function becomeOwner(req, res, next) {
  try {
    const user = await User.findById(req.user._id);

    if (user.role === 'owner' && user.ownerVerificationStatus === 'Verified') {
      return res.status(200).json({
        success: true,
        message: 'You are already a verified Room Owner.',
        data: { role: 'owner', status: 'Verified' },
      });
    }

    res.status(200).json({
      success: true,
      message: 'To become a Room Owner and publish room listings, government-issued identity verification is required.',
      data: {
        currentRole: user.role,
        verificationStatus: user.ownerVerificationStatus || 'Not Started',
        nextStep: 'SUBMIT_VERIFICATION',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Admin: List all pending verification applications
 * @route   GET /api/verification/admin/pending
 * @access  Private (Admin only)
 */
export async function getPendingVerifications(req, res, next) {
  try {
    const applications = await OwnerVerification.find({ status: 'Pending' })
      .populate('owner', 'fullName email phone city isVerified role createdAt')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: applications,
      meta: { total: applications.length },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Admin: Review verification application (Approve / Reject / Request Resubmission)
 * @route   PATCH /api/verification/admin/:id/review
 * @access  Private (Admin only)
 */
export async function reviewVerification(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reviewerNotes } = req.body;

    if (!['Verified', 'Rejected', 'Requires Resubmission'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review status. Must be "Verified", "Rejected", or "Requires Resubmission".',
        error: { code: 'INVALID_STATUS', message: 'Invalid review status.' },
      });
    }

    const verification = await OwnerVerification.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification application not found.',
        error: { code: 'NOT_FOUND', message: 'Application not found.' },
      });
    }

    const previousStatus = verification.status;
    verification.status = status;
    verification.reviewerNotes = reviewerNotes ? String(reviewerNotes).trim() : '';
    verification.reviewedBy = req.user._id;
    verification.reviewedAt = new Date();
    verification.auditLogs.push({
      fromStatus: previousStatus,
      toStatus: status,
      reason: reviewerNotes || `Application marked as ${status} by admin`,
      changedBy: req.user._id,
      timestamp: new Date(),
    });

    await verification.save();

    // Update the corresponding User model
    const userUpdate = {
      ownerVerificationStatus: status,
    };

    if (status === 'Verified') {
      userUpdate.role = 'owner';
      userUpdate.isVerified = true;
      userUpdate.verificationMethod = 'Govt_ID';
    }

    await User.findByIdAndUpdate(verification.owner, userUpdate);

    res.status(200).json({
      success: true,
      message: `Verification application has been marked as ${status}.`,
      data: verification,
    });
  } catch (error) {
    next(error);
  }
}

