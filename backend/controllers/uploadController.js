const User = require('../models/User');

function pickImageUrl(file) {
  if (!file) return null;
  return file.path || file.secure_url || file.url || null;
}

async function uploadImage(req, res) {
  try {
    const url = pickImageUrl(req.file);
    if (!url) {
      return res.status(400).json({ message: 'Không nhận được file ảnh.' });
    }
    res.json({ url });
  } catch (err) {
    console.error('uploadImage:', err);
    res.status(500).json({ message: 'Tải ảnh lên thất bại. Vui lòng thử lại.' });
  }
}

async function uploadAvatar(req, res) {
  try {
    const url = pickImageUrl(req.file);
    if (!url) {
      return res.status(400).json({ message: 'Không nhận được file ảnh.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl: url },
      { new: true }
    )
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    res.json({
      url,
      avatarUrl: url,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || '',
      },
    });
  } catch (err) {
    console.error('uploadAvatar:', err);
    res.status(500).json({ message: 'Cập nhật ảnh đại diện thất bại.' });
  }
}

module.exports = { uploadImage, uploadAvatar };
