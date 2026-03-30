import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api.js';
import { sanitizeSurveyHtml } from '../utils/sanitizeHtml.js';

function formatVal(v) {
  if (v === null || v === undefined) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'string' && v.trim() === '') return '—';
  return String(v);
}

export default function SurveyResult() {
  const { surveyId, responseId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!surveyId || !responseId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get(
        `/api/surveys/${surveyId}/responses/${responseId}/summary`
      );
      setData(d);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được kết quả.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [surveyId, responseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4">
        <p className="text-sm text-gray-600">Đang tải kết quả…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white px-6 py-5 shadow-sm text-center">
          <p className="text-red-700 text-sm font-medium">Không thể hiển thị điểm</p>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Link
            to={`/survey/${surveyId}`}
            className="mt-4 inline-block text-sm font-medium text-[#673ab7] hover:underline"
          >
            ← Về biểu mẫu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f2fa] pb-16 pt-8 px-4 sm:px-6">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-6 rounded-xl border border-[#dadce0] bg-white px-6 py-6 shadow-sm">
          <h1 className="text-2xl font-normal text-gray-900">{data.title}</h1>
          <p className="mt-4 text-3xl font-medium text-[#673ab7]">
            {data.score} / {data.maxScore}
            <span className="ml-2 text-base font-normal text-gray-600">điểm</span>
          </p>
        </div>

        <ul className="space-y-3">
          {(data.items || []).map((item, i) => (
            <li
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
              <p className="mt-2 text-sm text-gray-700">
                <span className="text-gray-500">Bạn trả lời:</span> {formatVal(item.userAnswer)}
              </p>
              {(item.isCorrect !== null || (item.correctAnswers && item.correctAnswers.length > 0)) && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  {item.isCorrect === true && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-800">
                      Đúng
                      {item.pointsEarned > 0 ? ` (+${item.pointsEarned} điểm)` : ''}
                    </span>
                  )}
                  {item.isCorrect === false && (
                    <>
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">Sai</span>
                      {item.correctAnswers?.length > 0 && (
                        <span className="text-gray-600">
                          Đáp án đúng: {item.correctAnswers.join(', ')}
                        </span>
                      )}
                    </>
                  )}
                  {item.isCorrect === null && (
                    <span className="text-gray-500 text-xs">Không chấm điểm (chưa có đáp án mẫu)</span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center">
          <Link to={`/survey/${surveyId}`} className="text-sm font-medium text-[#673ab7] hover:underline">
            ← Về biểu mẫu
          </Link>
        </p>
      </div>
    </div>
  );
}
