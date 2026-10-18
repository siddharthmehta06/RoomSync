import express from 'express';
import {
  getSavedRooms,
  saveRoom,
  removeSavedRoom,
} from '../controllers/savedRoomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getSavedRooms);
router.post('/:roomId', protect, saveRoom);
router.delete('/:roomId', protect, removeSavedRoom);

export default router;
