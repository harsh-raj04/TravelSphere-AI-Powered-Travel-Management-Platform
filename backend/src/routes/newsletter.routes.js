const express = require('express');
const { subscribe, unsubscribe } = require('../controllers/newsletter.controller');

const newsletterRouter = express.Router();

newsletterRouter.post('/subscribe', subscribe);
newsletterRouter.post('/unsubscribe', unsubscribe);

module.exports = { newsletterRouter };
