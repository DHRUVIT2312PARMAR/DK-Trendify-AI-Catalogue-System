const express = require('express');
const { signup, login, me } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiters');
const { validateBody, signupSchema, loginSchema } = require('../middleware/validators');
const { requireAuth } = require('../middleware/auth');

const authRouter = express.Router();

authRouter.post('/signup', authLimiter, validateBody(signupSchema), signup);
authRouter.post('/login', authLimiter, validateBody(loginSchema), login);
authRouter.get('/me', requireAuth, me);

module.exports = {
  authRouter,
};
