const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error('Missing JWT_SECRET in environment');
  }
  return s;
}

async function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Yêu cầu đăng nhập.' });
    }
    const token = auth.slice(7);
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.userId).select('-password').lean();
    if (!user) {
      return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || '',
    };
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
    });
  }
}

/** Gắn req.user nếu có Bearer hợp lệ; không chặn request nếu không có token. */
async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return next();
    }
    const token = auth.slice(7);
    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.userId).select('-password').lean();
    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl || '',
      };
    }
  } catch (_) {
    /* bỏ qua token lỗi — coi như khách */
  }
  next();
}

module.exports = { verifyToken, optionalAuth, getJwtSecret };
