const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../config/auth');

async function signup(request, response, next) {
  try {
    const { name, email, password, role } = request.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return response.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role });
    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, name: user.name });

    return response.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email });

    if (!user) {
      return response.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return response.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({ id: user._id.toString(), email: user.email, role: user.role, name: user.name });

    return response.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function me(request, response) {
  return response.json({
    success: true,
    data: {
      user: request.user,
    },
  });
}

module.exports = {
  signup,
  login,
  me,
};
