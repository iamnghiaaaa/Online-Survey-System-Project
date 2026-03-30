const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment (.env)');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment (.env)');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const apiRoutes = require('./routes/api');

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

const multerPkg = require('multer');

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  console.error('Unhandled error:', err.message || err);

  if (err instanceof multerPkg.MulterError) {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Ảnh vượt quá 5MB.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Tên trường file không đúng (cần gửi field "file").'
          : err.message || 'Lỗi tải file.';
    return res.status(400).json({ message: msg });
  }

  if (err.statusCode === 400 && err.message) {
    return res.status(400).json({ message: err.message });
  }

  if (err.http_code != null || /cloudinary|signature|api_key|401|403/i.test(String(err.message || ''))) {
    return res.status(502).json({
      message:
        'Cloudinary từ chối hoặc lỗi kết nối. Kiểm tra CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET trong backend/.env (đúng Dashboard), rồi khởi động lại server.',
    });
  }

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    message: isDev && err.message ? err.message : 'Lỗi máy chủ. Xem log terminal của backend.',
  });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

start();
