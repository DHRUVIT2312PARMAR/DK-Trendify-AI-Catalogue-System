const express = require('express');
const { calculateProfit } = require('../controllers/profitController');
const { validateBody, profitSchema } = require('../middleware/validators');
const { requireAuth } = require('../middleware/auth');

const profitRouter = express.Router();

profitRouter.post('/', requireAuth, validateBody(profitSchema), calculateProfit);

module.exports = {
  profitRouter,
};
