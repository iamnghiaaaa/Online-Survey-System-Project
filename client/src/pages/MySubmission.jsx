import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api.js';
import { sanitizeSurveyHtml } from '../utils/sanitizeHtml.js';

function formatAnswer(val) {
  if (val === undefined || val === null) return '—';
  if (Array.isArray(val)) return val.length ? val.join(', ') : '—';
  if (typeof val === 'string' && val.trim() === '') return '—';
  return String(val);
}

export default function MySubmission() {
  const { responseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!responseId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get(`/api/users/my-responses/${responseId}`);
      setData(d);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được dữ liệu.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [responseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-sm text-gray-600">Đang tải…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/" className="text-sm font-medium text-[#673ab7] hover:underline">
          ← Bảng điều khiển
        </Link>
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to="/" className="text-sm font-medium text-[#673ab7] hover:underline">
        ← Bảng điều khiển
      </Link>
      <header className="mt-4 rounded-xl border border-[#dadce0] bg-white px-6 py-6 shadow-sm">
        <h1 className="text-2xl font-normal text-gray-900">{data.surveyTitle}</h1>
        {data.surveyDescription ? (
          <p className="mt-2 text-sm text-gray-600">{data.surveyDescription}</p>
        ) : null}
        <p className="mt-3 text-xs text-gray-500">
          Đã gửi:{' '}
          {data.submittedAt ? new Date(data.submittedAt).toLocaleString('vi-VN') : '—'}
        </p>
        {data.isQuiz && data.score != null && (
          <p className="mt-2 text-sm font-medium text-[#5e35b1]">Điểm: {data.score}</p>
        )}
        {data.isQuiz && data.surveyId && (
          <div className="mt-4">
            <Link
              to={`/survey/${data.surveyId}/result/${data.responseId}`}
              className="text-sm font-medium text-[#673ab7] hover:underline"
            >
              Xem chi tiết chấm điểm →
            </Link>
          </div>
        )}
      </header>

      <div className="mt-6 space-y-3">
        <h2 className="text-sm font-medium text-gray-800">Nội dung bạn đã gửi</h2>
        {(data.items || []).map((item, i) => (
          <div
            key={item.questionId}
            className="rounded-xl border border-[#dadce0] bg-white px-5 py-4 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-900">
              <span>{i + 1}. </span>
              <span
                className="[&_a]:text-[#5e35b1] [&_p]:m-0 [&_p]:inline"
                dangerouslySetInnerHTML={{
                  __html: sanitizeSurveyHtml(item.questionText || ''),
                }}
              />
            </p>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap break-words">
              {formatAnswer(item.answerValue)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
