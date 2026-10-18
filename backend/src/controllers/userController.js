import User from '../models/User.js';

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
          details: [],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        occupation: user.occupation,
        company: user.company,
        city: user.city,
        bio: user.bio,
        isVerified: user.isVerified,
        verificationMethod: user.verificationMethod,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update current authenticated user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
          details: [],
        },
      });
    }

    // Only allow explicitly permitted fields to be updated
    const { fullName, phone, occupation, company, city, bio, avatar } = req.body;

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (occupation !== undefined) user.occupation = occupation.trim();
    if (company !== undefined) user.company = company.trim();
    if (city !== undefined) user.city = city.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar;

    // Save triggers schema validations and returns clean JSON
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        occupation: user.occupation,
        company: user.company,
        city: user.city,
        bio: user.bio,
        isVerified: user.isVerified,
        verificationMethod: user.verificationMethod,
        avatar: user.avatar,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
