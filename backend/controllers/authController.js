const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');

const SALT = 10;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function signToken(userId) {
  return jwt.sign({ userId: userId.toString() }, getJwtSecret(), { expiresIn: JWT_EXPIRES });
}

function userPublic(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
  };
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Tên là bắt buộc.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email là bắt buộc.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu tối thiểu 6 ký tự.' });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Email đã được sử dụng.' });
    }

    const hash = await bcrypt.hash(password, SALT);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hash,
    });

    const token = signToken(user._id);
    res.status(201).json({
      user: userPublic(user),
      token,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email đã được sử dụng.' });
    }
    console.error('register:', err);
    res.status(500).json({ message: 'Đăng ký thất bại.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = signToken(user._id);
    res.json({
      user: userPublic(user),
      token,
    });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ message: 'Đăng nhập thất bại.' });
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
