import mongoose from 'mongoose';
import RoomListing from '../models/RoomListing.js';

/**
 * @desc    Search and filter active room listings with pagination and sorting
 * @route   GET /api/rooms
 * @access  Public
 */
export async function getRooms(req, res, next) {
  try {
    const {
      city,
      locality,
      minRent,
      maxRent,
      roomType,
      furnishing,
      foodPreference,
      smoking,
      sortBy,
      page,
      limit,
    } = req.query;

    // Filter only active listings for public search
    const filter = { status: 'active' };

    // Sanitized, allowlisted filters
    if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
      filter.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    if (locality && typeof locality === 'string' && locality.trim() !== '') {
      filter.locality = { $regex: new RegExp(locality.trim(), 'i') };
    }

    if (minRent !== undefined || maxRent !== undefined) {
      filter.rent = {};
      if (minRent !== undefined && !isNaN(Number(minRent))) {
        filter.rent.$gte = Number(minRent);
      }
      if (maxRent !== undefined && !isNaN(Number(maxRent))) {
        filter.rent.$lte = Number(maxRent);
      }
    }

    if (roomType && typeof roomType === 'string' && roomType.trim() !== '') {
      filter.roomType = roomType.trim();
    }

    if (furnishing && typeof furnishing === 'string' && furnishing.trim() !== '') {
      filter.furnishing = furnishing.trim();
    }

    if (foodPreference && typeof foodPreference === 'string' && foodPreference.trim() !== '' && foodPreference !== 'Any') {
      filter['livingConditions.foodPreference'] = foodPreference.trim();
    }

    if (smoking && typeof smoking === 'string' && smoking.trim() !== '') {
      filter['livingConditions.smoking'] = smoking.trim();
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Safe allowlisted sorting
    const sortOptions = {
      rent_asc: { rent: 1 },
      rent_desc: { rent: -1 },
      date_asc: { createdAt: 1 },
      date_desc: { createdAt: -1 },
    };
    const sort = sortOptions[sortBy] || { createdAt: -1 };

    const [rooms, total] = await Promise.all([
      RoomListing.find(filter)
        .populate('owner', 'fullName role avatar isVerified phone')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      RoomListing.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: rooms,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Get single room listing by ID
 * @route   GET /api/rooms/:id
 * @access  Public (Optional auth)
 */
export async function getRoomById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room listing not found.',
          details: [],
        },
      });
    }

    const room = await RoomListing.findById(id).populate(
      'owner',
      'fullName role avatar isVerified phone'
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room listing not found.',
          details: [],
        },
      });
    }

    // If deactivated, only owner or admin can view
    if (room.status === 'deactivated') {
      const isOwnerOrAdmin =
        req.user &&
        (room.owner._id.toString() === req.user._id.toString() ||
          req.user.role === 'admin');
      if (!isOwnerOrAdmin) {
        return res.status(404).json({
          success: false,
          message: 'Room listing not found.',
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'Room listing not found.',
            details: [],
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Create a new room listing
 * @route   POST /api/rooms
 * @access  Private (Owner / Admin)
 */
export async function createRoom(req, res, next) {
  try {
    const {
      title,
      locality,
      city,
      state,
      pinCode,
      location,
      rent,
      maintenance,
      deposit,
      roomType,
      furnishing,
      availableFrom,
      minStayMonths,
      images,
      amenities,
      livingConditions,
    } = req.body;

    const room = await RoomListing.create({
      owner: req.user._id, // Enforce server-assigned owner
      title: title ? title.trim() : '',
      locality: locality ? locality.trim() : '',
      city: city ? city.trim() : 'Bengaluru',
      state: state ? state.trim() : 'Karnataka',
      pinCode: pinCode ? pinCode.trim() : '',
      location: location || { type: 'Point', coordinates: [77.5946, 12.9716] },
      rent: Number(rent),
      maintenance: maintenance !== undefined ? Number(maintenance) : 0,
      deposit: Number(deposit),
      roomType,
      furnishing,
      availableFrom: new Date(availableFrom),
      minStayMonths: minStayMonths !== undefined ? Number(minStayMonths) : 6,
      images: Array.isArray(images) ? images : [],
      amenities: Array.isArray(amenities) ? amenities : [],
      livingConditions: livingConditions || {},
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Listing published successfully.',
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Update an existing room listing
 * @route   PUT /api/rooms/:id
 * @access  Private (Owner / Admin)
 */
export async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room listing not found.',
          details: [],
        },
      });
    }

    const room = await RoomListing.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room listing not found.',
          details: [],
        },
      });
    }

    // Authorization: owner or admin only
    if (
      room.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this listing.',
        error: {
          code: 'NOT_LISTING_OWNER',
          message: 'You are not authorized to update this listing.',
          details: [],
        },
      });
    }

    // Allowlisted fields update
    const allowedFields = [
      'title',
      'locality',
      'city',
      'state',
      'pinCode',
      'location',
      'rent',
      'maintenance',
      'deposit',
      'roomType',
      'furnishing',
      'availableFrom',
      'minStayMonths',
      'images',
      'amenities',
      'status',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    });

    if (req.body.livingConditions) {
      room.livingConditions = {
        ...room.livingConditions.toObject(),
        ...req.body.livingConditions,
      };
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully.',
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Deactivate (soft delete) a room listing
 * @route   DELETE /api/rooms/:id
 * @access  Private (Owner / Admin)
 */
export async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room listing not found.',
          details: [],
        },
      });
    }

    const room = await RoomListing.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room listing not found.',
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room listing not found.',
          details: [],
        },
      });
    }

    // Authorization: owner or admin only
    if (
      room.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing.',
        error: {
          code: 'NOT_LISTING_OWNER',
          message: 'You are not authorized to delete this listing.',
          details: [],
        },
      });
    }

    // Soft deactivation as required by the contract
    room.status = 'deactivated';
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Listing deactivated successfully.',
    });
  } catch (error) {
    next(error);
  }
}
