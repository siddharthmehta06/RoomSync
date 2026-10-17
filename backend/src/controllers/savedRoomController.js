import mongoose from 'mongoose';
import Interaction from '../models/Interaction.js';
import RoomListing from '../models/RoomListing.js';

/**
 * @desc    Retrieve all active rooms saved (bookmarked) by current user
 * @route   GET /api/saved-rooms
 * @access  Private
 */
export async function getSavedRooms(req, res, next) {
  try {
    // Aggregate user's save/unsave interactions to determine currently saved listings
    const savedAgg = await Interaction.aggregate([
      {
        $match: {
          user: req.user._id,
          action: { $in: ['save', 'unsave'] },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$room',
          lastAction: { $last: '$action' },
          savedAt: { $last: '$createdAt' },
        },
      },
      { $match: { lastAction: 'save' } },
      { $sort: { savedAt: -1 } },
    ]);

    if (!savedAgg.length) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const roomIds = savedAgg.map((item) => item._id);
    const savedAtMap = new Map(
      savedAgg.map((item) => [item._id.toString(), item.savedAt])
    );

    // Fetch room listings that are currently active
    const rooms = await RoomListing.find({
      _id: { $in: roomIds },
      status: 'active',
    });

    // Format response combining room details and saved timestamp
    const data = rooms.map((room) => ({
      id: room._id.toString(),
      title: room.title,
      locality: room.locality,
      city: room.city,
      state: room.state,
      rent: room.rent,
      deposit: room.deposit,
      roomType: room.roomType,
      furnishing: room.furnishing,
      images: room.images,
      status: room.status,
      savedAt: savedAtMap.get(room._id.toString()),
    }));

    // Maintain reverse chronological sort by savedAt
    data.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Bookmark a room listing & log interaction for Collaborative Filtering
 * @route   POST /api/saved-rooms/:roomId
 * @access  Private
 */
export async function saveRoom(req, res, next) {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
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

    // Ensure the room exists and is active
    const room = await RoomListing.findById(roomId);
    if (!room || room.status === 'deactivated') {
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

    // Check latest save/unsave state
    const latestInteraction = await Interaction.findOne({
      user: req.user._id,
      room: roomId,
      action: { $in: ['save', 'unsave'] },
    }).sort({ createdAt: -1 });

    if (latestInteraction && latestInteraction.action === 'save') {
      return res.status(200).json({
        success: true,
        message: 'Room is already saved in bookmarks.',
      });
    }

    // Record save interaction event
    await Interaction.create({
      user: req.user._id,
      room: roomId,
      action: 'save',
    });

    res.status(201).json({
      success: true,
      message: 'Room saved to bookmarks.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Remove a room from saved bookmarks & log unsave interaction
 * @route   DELETE /api/saved-rooms/:roomId
 * @access  Private
 */
export async function removeSavedRoom(req, res, next) {
  try {
    const { roomId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
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

    // Record unsave interaction event
    await Interaction.create({
      user: req.user._id,
      room: roomId,
      action: 'unsave',
    });

    res.status(200).json({
      success: true,
      message: 'Room removed from bookmarks.',
    });
  } catch (error) {
    next(error);
  }
}
