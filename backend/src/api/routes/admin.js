// backend/src/api/routes/admin.js
import express from 'express';
import { AdminController } from '../controllers/AdminController.js';

const router = express.Router();

router.get('/stats', AdminController.getStats);
router.post('/cleanup', AdminController.cleanup);
router.post('/sync', AdminController.syncFromJson);

export default router;