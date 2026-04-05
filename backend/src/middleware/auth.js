const { verifyToken } = require('../config/auth');

function requireAuth(request, response, next) {
  const header = request.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    return response.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    request.user = verifyToken(token);
    return next();
  } catch (error) {
    return response.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
