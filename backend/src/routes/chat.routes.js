const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');
const ctrl = require('../controllers/chat.controller');

const chatRouter = express.Router();

// ── Profile ────────────────────────────────────────────────────────────────
chatRouter.get('/profile', authenticate, ctrl.getMyProfile);
chatRouter.post('/profile', authenticate, ctrl.createProfile);
chatRouter.patch('/profile', authenticate, ctrl.updateProfile);

// ── Rooms ──────────────────────────────────────────────────────────────────
chatRouter.get('/rooms', ctrl.getRooms);
chatRouter.get('/rooms/:slug', ctrl.getRoomBySlug);
chatRouter.post('/rooms/:roomId/join', authenticate, ctrl.joinRoom);
chatRouter.post('/groups', authenticate, ctrl.createGroup);
chatRouter.get('/my-groups', authenticate, ctrl.getMyGroups);
chatRouter.post('/groups/:roomId/invite', authenticate, ctrl.inviteToGroup);

// ── Messages ───────────────────────────────────────────────────────────────
chatRouter.get('/rooms/:roomId/messages', authenticate, ctrl.getMessages);
chatRouter.delete('/messages/:messageId', authenticate, ctrl.deleteMessage);
chatRouter.post('/messages/:messageId/flag', authenticate, ctrl.flagMessage);

// ── Online users ───────────────────────────────────────────────────────────
chatRouter.get('/rooms/:roomId/online', ctrl.getOnlineUsers);

// ── Private Messaging ──────────────────────────────────────────────────────
chatRouter.get('/conversations', authenticate, ctrl.getPrivateConversations);
chatRouter.post('/conversations/start', authenticate, ctrl.startPrivateChat);

// ── Block / Unblock ────────────────────────────────────────────────────────
chatRouter.post('/block/:targetProfileId', authenticate, ctrl.blockUser);
chatRouter.delete('/block/:targetProfileId', authenticate, ctrl.unblockUser);

// ── Admin Moderation ───────────────────────────────────────────────────────
chatRouter.get('/admin/stats', authenticate, authorize('admin'), ctrl.adminGetStats);
chatRouter.get('/admin/flagged', authenticate, authorize('admin'), ctrl.adminGetFlaggedMessages);
chatRouter.get('/admin/users', authenticate, authorize('admin'), ctrl.adminGetUsers);
chatRouter.get('/admin/groups', authenticate, authorize('admin'), ctrl.adminGetGroups);
chatRouter.get('/admin/rooms/:roomId/messages', authenticate, authorize('admin'), ctrl.adminGetRoomMessages);
chatRouter.delete('/admin/messages/:messageId', authenticate, authorize('admin'), ctrl.adminDeleteMessageRest);
chatRouter.post('/admin/messages/:messageId/dismiss-flag', authenticate, authorize('admin'), ctrl.adminDismissFlag);
chatRouter.post('/admin/users/:profileId/ban', authenticate, authorize('admin'), ctrl.adminBanUserFromChat);
chatRouter.post('/admin/users/:profileId/unban', authenticate, authorize('admin'), ctrl.adminUnbanUser);
chatRouter.post('/admin/users/:profileId/warn', authenticate, authorize('admin'), ctrl.adminWarnUser);
chatRouter.delete('/admin/groups/:roomId', authenticate, authorize('admin'), ctrl.adminDisbandGroup);

module.exports = { chatRouter };
