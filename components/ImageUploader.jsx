import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api.js';

export default function ImageUploader({
  onUploadSuccess,
  uploadEndpoint = '/api/upload',
  className = '',
  compact = false,
  label = 'Tải ảnh',
  showPreview = true,
  previewUrl = null,
  onRemovePreview,
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP).');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setLoading(true);
    try {
      const { data } = await api.post(uploadEndpoint, fd);
      if (data?.url) {
        onUploadSuccess?.(data.url, data);
        toast.success(
          uploadEndpoint.includes('avatar') ? 'Đã cập nhật ảnh đại diện.' : 'Đã tải ảnh lên.'
        );
      } else {
        toast.error('Máy chủ không trả về URL ảnh.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Tải ảnh thất bại. Kiểm tra cấu hình Cloudinary trên server.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const btnClass = compact
    ? 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-violet-50 hover:border-[#673ab7]/30 hover:text-[#5e35b1] disabled:opacity-50'
    : 'inline-flex items-center gap-2 rounded-lg border border-[#673ab7]/30 bg-[#f3e5f5]/40 px-3 py-2 text-sm font-medium text-[#5e35b1] hover:bg-[#ede7f6] disabled:opacity-50';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleChange}
        aria-hidden
      />
      <button
        type="button"
        className={btnClass}
        onClick={pick}
        disabled={loading}
        title={label}
        aria-label={label}
      >
        {loading ? (
          <span className="text-xs">…</span>
        ) : compact ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {label}
          </>
        )}
      </button>
      {showPreview && previewUrl ? (
        <div className="relative inline-flex items-center gap-2">
          <img
            src={previewUrl}
            alt=""
            className="h-12 w-12 rounded-lg border border-gray-200 object-cover shadow-sm"
          />
          {onRemovePreview ? (
            <button
              type="button"
              className="text-xs font-medium text-red-600 hover:underline"
              onClick={onRemovePreview}
            >
              Gỡ ảnh
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
