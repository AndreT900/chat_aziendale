const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// All AI routes require authentication
router.use(protect);

// Query AI Assistant
router.post('/query', aiController.queryAI);

// Get AI statistics
router.get('/stats', aiController.getAIStats);

module.exports = router;
