import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageUploader from '../components/ImageUploader.jsx';

const STATUS_LABEL = {
  draft: 'Bản nháp',
  published: 'Đang mở',
  closed: 'Đã đóng',
};

function statusClass(status) {
  if (status === 'published') return 'bg-green-50 text-green-800 border-green-200';
  if (status === 'closed') return 'bg-gray-100 text-gray-700 border-gray-200';
  return 'bg-amber-50 text-amber-900 border-amber-200';
}

export default function Dashboard() {
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState('mine');
  const [mySurveys, setMySurveys] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyId, setCopyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [surveysRes, responsesRes] = await Promise.all([
        api.get('/api/users/my-surveys'),
        api.get('/api/users/my-responses'),
      ]);
      setMySurveys(Array.isArray(surveysRes.data) ? surveysRes.data : []);
      setMyResponses(Array.isArray(responsesRes.data) ? responsesRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được dữ liệu.');
      setMySurveys([]);
      setMyResponses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDeleteSurvey = async (id) => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa form này và toàn bộ câu trả lời?'
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/surveys/${id}`);
      setMySurveys((prev) => prev.filter((s) => s.id !== id));
      toast.success('Đã xóa biểu mẫu.');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không xóa được biểu mẫu.';
      toast.error(msg);
    }
  };

  const copyShareLink = async (id) => {
    const url = `${window.location.origin}/survey/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyId(id);
      window.setTimeout(() => setCopyId(null), 2000);
    } catch {
      window.prompt('Sao chép liên kết:', url);
    }
  };

  const tabBtn = (id, label) => (
    <button
      type="button"
      key={id}
      onClick={() => setTab(id)}
      className={`border-b-2 px-1 pb-2 text-sm font-medium transition ${
        tab === id
          ? 'border-[#673ab7] text-[#673ab7]'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-900 tracking-tight">Bảng điều khiển</h1>
          <p className="mt-1 text-sm text-gray-600">Form / Quiz của bạn và lịch sử đã điền</p>
        </div>
        <Link
          to="/surveys/new"
          className="inline-flex items-center justify-center rounded-lg bg-[#673ab7] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5e35b1]"
        >
          Tạo biểu mẫu mới
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-900">Hồ sơ</p>
        <p className="mt-0.5 text-xs text-gray-500">Ảnh đại diện hiển thị trên thanh điều hướng.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-[#ede7f6] text-xl font-semibold text-[#5e35b1]">
              {(user?.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          </div>
          <ImageUploader
            label="Tải ảnh đại diện"
            uploadEndpoint="/api/upload-avatar"
            showPreview={false}
            onUploadSuccess={async () => {
              await refreshUser();
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-6 border-b border-gray-200">
        {tabBtn('mine', 'Form của tôi')}
        {tabBtn('history', 'Lịch sử điền form')}
      </div>

      {loading && <p className="mt-8 text-sm text-gray-500">Đang tải…</p>}

      {error && (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {location.state?.saved && (
        <div
          className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Biểu mẫu đã được lưu.
        </div>
      )}

      {location.state?.updated && (
        <div
          className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          Biểu mẫu đã được cập nhật.
        </div>
      )}

      {!loading && !error && tab === 'mine' && mySurveys.length === 0 && (
        <p className="mt-8 text-sm text-gray-600">
          Bạn chưa tạo biểu mẫu nào.{' '}
          <Link to="/surveys/new" className="font-medium text-[#673ab7] hover:underline">
            Tạo ngay
          </Link>
        </p>
      )}

      {!loading && !error && tab === 'mine' && mySurveys.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {mySurveys.map((s) => (
            <li
              key={s.id}
              className="flex flex-col rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-base font-medium text-gray-900 line-clamp-2">{s.title}</h2>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  {s.isQuiz && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                      Quiz
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass(s.status)}`}
                  >
                    {STATUS_LABEL[s.status] || s.status}
                  </span>
                </div>
              </div>
              <p className="mt-2 font-mono text-xs text-gray-400 truncate" title={s.id}>
                {s.id}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/survey/edit/${s.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Sửa
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteSurvey(s.id)}
                >
                  Xóa
                </button>
                <Link
                  to={`/surveys/${s.id}/responses`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Xem câu trả lời
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-[#673ab7]/40 bg-[#f3e5f5]/50 px-3 py-1.5 text-sm font-medium text-[#5e35b1] hover:bg-[#ede7f6]"
                  onClick={() => copyShareLink(s.id)}
                >
                  {copyId === s.id ? 'Đã sao chép!' : 'Copy link chia sẻ'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && tab === 'history' && myResponses.length === 0 && (
        <p className="mt-8 text-sm text-gray-600">Bạn chưa điền biểu mẫu nào (khi đã đăng nhập).</p>
      )}

      {!loading && !error && tab === 'history' && myResponses.length > 0 && (
        <ul className="mt-6 space-y-3">
          {myResponses.map((row) => (
            <li
              key={row.responseId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dadce0] bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  {row.survey?.title || 'Biểu mẫu đã xóa'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {row.createdAt ? new Date(row.createdAt).toLocaleString('vi-VN') : ''}
                </p>
                {row.survey?.isQuiz && row.score != null && (
                  <p className="text-sm text-[#5e35b1] mt-1">Điểm: {row.score}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/my-responses/${row.responseId}`}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Xem phản hồi đã gửi
                </Link>
                {row.survey?.isQuiz && row.surveyId && (
                  <Link
                    to={`/survey/${row.surveyId}/result/${row.responseId}`}
                    className="inline-flex items-center rounded-lg bg-[#673ab7] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#5e35b1]"
                  >
                    Xem điểm / Kết quả
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
