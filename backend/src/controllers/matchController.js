import mongoose from 'mongoose';
import PreferenceProfile from '../models/PreferenceProfile.js';
import RoomListing from '../models/RoomListing.js';
import Interaction from '../models/Interaction.js';
import { calculateMatches } from '../services/MatchingEngine.js';
import { checkFactorsCompletion } from '../utils/factorValidation.js';

/**
 * @desc    Get personalized, explainable room matches evaluated by the 22-factor engine
 * @route   GET /api/matches
 * @access  Private (Requires authentication and saved PreferenceProfile)
 */
export async function getMatches(req, res, next) {
  try {
    const userId = req.user._id;

    // 1. Authentication & Isolation: Load preference profile belonging to authenticated user only
    const profile = await PreferenceProfile.findOne({ user: userId });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
        error: {
          code: 'PROFILE_INCOMPLETE',
          message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
          completedCount: 0,
          totalFactors: 22,
          progressText: '0/22 factors completed',
          details: [],
        },
      });
    }

    // Verify that all 22 factors have valid inputs before calculating scores
    const completion = checkFactorsCompletion(profile);
    if (!completion.isComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
        error: {
          code: 'PROFILE_INCOMPLETE',
          message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
          completedCount: completion.completedCount,
          totalFactors: completion.totalFactors,
          progressText: completion.progressText,
          missingFactors: completion.missingFactors,
        },
      });
    }

    // 2. Query Parameters Extraction and Validation
    const {
      page,
      limit,
      minScore,
      city,
      sortBy = 'ranking_desc',
      includeDisqualified = 'false',
    } = req.query;

    const includeDisqualifiedBool =
      includeDisqualified === 'true' || includeDisqualified === '1' || includeDisqualified === true;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    // 3. Load active candidate room listings from MongoDB
    const candidateFilter = {
      status: 'active',
      owner: { $ne: userId }, // Do not recommend seeker's own listings if they are also an owner
    };

    if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
      candidateFilter.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    const roomDocs = await RoomListing.find(candidateFilter)
      .populate('owner', 'fullName role avatar isVerified phone email bio city')
      .lean();

    // 4. Load interaction history for Collaborative Filtering
    const interactions = await Interaction.find({ user: userId })
      .select('room action dwellTimeSeconds createdAt')
      .lean();

    const formattedInteractions = interactions.map((i) => ({
      roomId: i.room ? i.room.toString() : '',
      action: i.action,
      dwellTimeSeconds: i.dwellTimeSeconds || 0,
      createdAt: i.createdAt ? i.createdAt.toISOString() : new Date().toISOString(),
    }));

    // 5. Assemble strongly typed payload for calculateMatches
    const formattedCandidates = roomDocs.map((room) => ({
      roomId: room._id.toString(),
      id: room._id.toString(),
      rent: room.rent,
      maintenance: room.maintenance || 0,
      deposit: room.deposit,
      locality: room.locality,
      city: room.city,
      geoCoordinates: room.location?.coordinates,
      availableFrom: room.availableFrom,
      minStayMonths: room.minStayMonths || 1,
      roomType: room.roomType,
      commuteMins: room.commuteMins,
      livingConditions: room.livingConditions || {},
      status: room.status,
    }));

    const matchingPayload = {
      seeker: {
        userId: userId.toString(),
        profile: {
          hardConstraints: profile.hardConstraints ? profile.hardConstraints.toObject() : {},
          flexiblePreferences: profile.flexiblePreferences ? profile.flexiblePreferences.toObject() : {},
          importanceWeights: profile.importanceWeights ? profile.importanceWeights.toObject() : {},
        },
        interactions: formattedInteractions,
      },
      candidates: formattedCandidates,
      options: {
        includeDisqualified: includeDisqualifiedBool,
      },
    };

    // 6. Invoke the pure matching engine
    const engineResult = await calculateMatches(matchingPayload);

    // 7. Post-engine filtering & custom sorting
    let results = engineResult.matches || [];

    // Filter by minScore if explicitly specified
    if (minScore !== undefined && !isNaN(Number(minScore))) {
      const minScoreThreshold = Number(minScore);
      results = results.filter((m) => {
        // If includeDisqualified is true, retain disqualified listings regardless of minScore
        if (!m.eligible && includeDisqualifiedBool) return true;
        return m.compatibilityScore >= minScoreThreshold;
      });
    }

    // Build lookup map for fast retrieval of populated room document details
    const roomMap = new Map(roomDocs.map((r) => [r._id.toString(), r]));

    // Apply sorting: handle topsis_rank and ranking_desc explicitly as TOPSIS ranking order
    if (sortBy === 'topsis_rank' || sortBy === 'ranking_desc') {
      results.sort((a, b) => {
        if (b.rankingScore !== a.rankingScore) {
          return b.rankingScore - a.rankingScore;
        }
        if (b.compatibilityScore !== a.compatibilityScore) {
          return b.compatibilityScore - a.compatibilityScore;
        }
        const roomA = roomMap.get(a.roomId);
        const roomB = roomMap.get(b.roomId);
        const costA = (roomA?.rent || 0) + (roomA?.maintenance || 0);
        const costB = (roomB?.rent || 0) + (roomB?.maintenance || 0);
        if (costA !== costB) {
          return costA - costB;
        }
        return String(a.roomId).localeCompare(String(b.roomId));
      });
    } else if (sortBy === 'compatibility_desc') {
      results.sort((a, b) => {
        if (b.compatibilityScore !== a.compatibilityScore) {
          return b.compatibilityScore - a.compatibilityScore;
        }
        return b.rankingScore - a.rankingScore;
      });
    } else if (sortBy === 'rent_asc') {
      results.sort((a, b) => {
        const roomA = roomMap.get(a.roomId);
        const roomB = roomMap.get(b.roomId);
        const costA = (roomA?.rent || 0) + (roomA?.maintenance || 0);
        const costB = (roomB?.rent || 0) + (roomB?.maintenance || 0);
        return costA - costB;
      });
    } else if (sortBy === 'rent_desc') {
      results.sort((a, b) => {
        const roomA = roomMap.get(a.roomId);
        const roomB = roomMap.get(b.roomId);
        const costA = (roomA?.rent || 0) + (roomA?.maintenance || 0);
        const costB = (roomB?.rent || 0) + (roomB?.maintenance || 0);
        return costB - costA;
      });
    } else if (sortBy === 'date_desc') {
      results.sort((a, b) => {
        const roomA = roomMap.get(a.roomId);
        const roomB = roomMap.get(b.roomId);
        const dateA = roomA?.createdAt ? new Date(roomA.createdAt).getTime() : 0;
        const dateB = roomB?.createdAt ? new Date(roomB.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // 8. Pagination applied over the globally ranked candidates
    const total = results.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const skip = (pageNum - 1) * limitNum;
    const paginatedMatches = results.slice(skip, skip + limitNum);

    // 9. Format response matching API_CONTRACTS.md structure
    const formattedData = paginatedMatches.map((match) => {
      const room = roomMap.get(match.roomId);
      const formattedMatch = {
        room: room
          ? {
              id: room._id.toString(),
              title: room.title,
              locality: room.locality,
              city: room.city,
              rent: room.rent,
              maintenance: room.maintenance || 0,
              deposit: room.deposit,
              roomType: room.roomType,
              furnishing: room.furnishing,
              images: room.images || [],
              owner: {
                name: room.owner?.fullName || 'Property Owner',
                avatar: room.owner?.avatar || null,
                isVerified: room.owner?.isVerified ?? false,
              },
            }
          : null,
        compatibilityScore: match.compatibilityScore,
        rankingScore: match.rankingScore,
        strengths: match.strengths || [],
        mismatches: match.mismatches || [],
        factorBreakdown: match.factorBreakdown || {},
        algorithmMetadata: {
          version: engineResult.algorithmMetadata.engineVersion,
          hardConstraintPassed: match.eligible,
        },
      };

      if (!match.eligible) {
        formattedMatch.exclusionReasons = match.exclusionReasons || [];
      }

      return formattedMatch;
    });

    res.status(200).json({
      success: true,
      data: formattedData,
      meta: {
        totalEvaluated: engineResult.algorithmMetadata.candidateCount,
        eligibleMatches: engineResult.algorithmMetadata.eligibleCount,
        disqualifiedByHardConstraints: engineResult.algorithmMetadata.disqualifiedCount,
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
 * @desc    Preview compatibility for a specific room listing against authenticated seeker's profile
 * @route   POST /api/rooms/:id/compatibility-preview
 * @access  Private (Requires authentication and saved PreferenceProfile)
 */
export async function getCompatibilityPreview(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room listing ID format.',
        error: {
          code: 'INVALID_ROOM_ID',
          message: 'Invalid room listing ID format.',
          details: [],
        },
      });
    }

    // Load seeker's preference profile
    const profile = await PreferenceProfile.findOne({ user: userId });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
        error: {
          code: 'PROFILE_INCOMPLETE',
          message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
          completedCount: 0,
          totalFactors: 22,
          progressText: '0/22 factors completed',
          details: [],
        },
      });
    }

    const completion = checkFactorsCompletion(profile);
    if (!completion.isComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
        error: {
          code: 'PROFILE_INCOMPLETE',
          message: 'Please complete all 22 preference factors to complete onboarding and calculate your compatibility score.',
          completedCount: completion.completedCount,
          totalFactors: completion.totalFactors,
          progressText: completion.progressText,
          missingFactors: completion.missingFactors,
        },
      });
    }

    // Retrieve requested room listing
    const room = await RoomListing.findById(id)
      .populate('owner', 'fullName role avatar isVerified phone')
      .lean();

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

    if (room.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot preview compatibility for an inactive room listing.',
        error: {
          code: 'ROOM_INACTIVE',
          message: 'Cannot preview compatibility for an inactive room listing.',
          details: [],
        },
      });
    }

    // Fetch user interactions for Collaborative Filtering context
    const interactions = await Interaction.find({ user: userId })
      .select('room action dwellTimeSeconds createdAt')
      .lean();

    const formattedInteractions = interactions.map((i) => ({
      roomId: i.room ? i.room.toString() : '',
      action: i.action,
      dwellTimeSeconds: i.dwellTimeSeconds || 0,
      createdAt: i.createdAt ? i.createdAt.toISOString() : new Date().toISOString(),
    }));

    const candidatePayload = {
      roomId: room._id.toString(),
      id: room._id.toString(),
      rent: room.rent,
      maintenance: room.maintenance || 0,
      deposit: room.deposit,
      locality: room.locality,
      city: room.city,
      geoCoordinates: room.location?.coordinates,
      availableFrom: room.availableFrom,
      minStayMonths: room.minStayMonths || 1,
      roomType: room.roomType,
      commuteMins: room.commuteMins,
      livingConditions: room.livingConditions || {},
      status: room.status,
    };

    const matchingPayload = {
      seeker: {
        userId: userId.toString(),
        profile: {
          hardConstraints: profile.hardConstraints ? profile.hardConstraints.toObject() : {},
          flexiblePreferences: profile.flexiblePreferences ? profile.flexiblePreferences.toObject() : {},
          importanceWeights: profile.importanceWeights ? profile.importanceWeights.toObject() : {},
        },
        interactions: formattedInteractions,
      },
      candidates: [candidatePayload],
      options: {
        includeDisqualified: true,
      },
    };

    const engineResult = await calculateMatches(matchingPayload);
    const match = engineResult.matches[0];

    const previewResponse = {
      roomId: room._id.toString(),
      eligible: match.eligible,
      compatibilityScore: match.compatibilityScore,
      rankingScore: match.rankingScore,
      strengths: match.strengths || [],
      mismatches: match.mismatches || [],
      factorBreakdown: match.factorBreakdown || {},
      algorithmMetadata: {
        version: engineResult.algorithmMetadata.engineVersion,
        hardConstraintPassed: match.eligible,
      },
    };

    if (!match.eligible) {
      previewResponse.exclusionReasons = match.exclusionReasons || [];
    }

    res.status(200).json({
      success: true,
      data: previewResponse,
    });
  } catch (error) {
    next(error);
  }
}
