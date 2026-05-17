const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const jwt = require('jsonwebtoken');
const {
  streamChat,
  getConversation,
  getMyConversations,
  getAIAnalytics,
  submitFeedback,
} = require('../controllers/ai.controller');

const aiRouter = express.Router();

// Optional auth — attaches req.user if token present, proceeds either way
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    } catch (_) {}
  }
  next();
}

// Public / optionally authenticated
aiRouter.post('/chat', optionalAuth, streamChat);
aiRouter.get('/conversations/:sessionId', getConversation);
aiRouter.patch('/conversations/:sessionId/feedback', authenticate, submitFeedback);

// Requires login
aiRouter.get('/my-conversations', authenticate, getMyConversations);

// Admin only
aiRouter.get('/analytics', authenticate, authorize('admin'), getAIAnalytics);

module.exports = { aiRouter };
