const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function imageFileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  const err = new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP).');
  err.statusCode = 400;
  cb(err);
}

/** Chỉ dùng tham số tối thiểu — một số tổ hợp (allowed_formats + stream) có thể gây lỗi API Cloudinary. */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'online-survey',
  },
});

const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

function requireCloudinary(req, res, next) {
  if (!cloudinaryConfigured()) {
    return res.status(503).json({
      message:
        'Chưa cấu hình Cloudinary. Thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào file .env.',
    });
  }
  next();
}

module.exports = {
  uploadImage,
  requireCloudinary,
  cloudinaryConfigured,
};
