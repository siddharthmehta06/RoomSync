import mongoose from 'mongoose';
import RoomListing from '../models/RoomListing.js';

function summarizeReviews(reviews = [], userId = null) {
  const ratingCount = reviews.length;
  const ratingAverage = ratingCount
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount) * 10) / 10
    : null;
  const myReview = userId
    ? reviews.find((review) => review.seeker?.toString() === userId.toString()) || null
    : null;

  return {
    ratingAverage,
    ratingCount,
    reviews: reviews
      .slice(-5)
      .reverse()
      .map((review) => ({ rating: review.rating, feedback: review.feedback, createdAt: review.createdAt })),
    myReview: myReview
      ? { rating: myReview.rating, feedback: myReview.feedback, updatedAt: myReview.updatedAt }
      : null,
  };
}

export async function upsertRoomReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, feedback = '' } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid room listing ID.' });
    }

    const room = await RoomListing.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room listing not found.' });
    }

    const existingReview = room.reviews.find(
      (review) => review.seeker.toString() === req.user._id.toString()
    );

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.feedback = feedback.trim();
      existingReview.updatedAt = new Date();
    } else {
      room.reviews.push({ seeker: req.user._id, rating, feedback: feedback.trim() });
    }

    await room.save();

    return res.status(existingReview ? 200 : 201).json({
      success: true,
      message: existingReview ? 'Your review has been updated.' : 'Thanks for reviewing this room.',
      data: summarizeReviews(room.reviews, req.user._id),
    });
  } catch (error) {
    next(error);
  }
}

export { summarizeReviews };
