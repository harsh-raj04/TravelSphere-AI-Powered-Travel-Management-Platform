const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize }    = require('../middlewares/authorize');
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  setReviewing,
  postToMarketplace,
  sendQuote,
  updateRequestStatus,
  respondToRequest,
  getMessages,
  addMessage,
  createCustomOrder,
  verifyCustomPayment,
} = require('../controllers/customRequests.controller');

const customRequestsRouter = Router();

// Customer — submit (login required)
customRequestsRouter.post('/', authenticate, createRequest);

// Customer — view own requests & respond to quote
customRequestsRouter.get('/my',          authenticate, getMyRequests);
customRequestsRouter.patch('/:id/respond', authenticate, respondToRequest);

// Messages (customer and admin)
customRequestsRouter.get( '/:id/messages', authenticate, getMessages);
customRequestsRouter.post('/:id/messages', authenticate, addMessage);

// Payment (customer only)
customRequestsRouter.post('/:id/create-order',    authenticate, createCustomOrder);
customRequestsRouter.post('/:id/verify-payment',  authenticate, verifyCustomPayment);

// Admin actions
customRequestsRouter.get( '/',                        authenticate, authorize('admin'), getAllRequests);
customRequestsRouter.patch('/:id/reviewing',          authenticate, authorize('admin'), setReviewing);
customRequestsRouter.post( '/:id/post-to-marketplace',authenticate, authorize('admin'), postToMarketplace);
customRequestsRouter.post( '/:id/send-quote',         authenticate, authorize('admin'), sendQuote);
customRequestsRouter.patch('/:id',                    authenticate, authorize('admin'), updateRequestStatus);

module.exports = { customRequestsRouter };
