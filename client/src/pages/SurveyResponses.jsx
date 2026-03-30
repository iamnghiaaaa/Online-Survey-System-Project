import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api.js';
import { sanitizeSurveyHtml } from '../utils/sanitizeHtml.js';

function formatAnswer(val) {
  if (val === undefined || val === null) return '—';
  if (Array.isArray(val)) {
    if (val.length === 0) return '—';
    return val.join(', ');
  }
  if (typeof val === 'string' && val.trim() === '') return '—';
  return String(val);
}

export default function SurveyResponses() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    setError(null);
    setSurvey(null);
    setResponses([]);
    try {
      const surveyRes = await api.get(`/api/surveys/${surveyId}`);
      setSurvey(surveyRes.data);

      const respRes = await api.get(`/api/surveys/${surveyId}/responses`);
      setResponses(Array.isArray(respRes.data) ? respRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(() => survey?.questions || [], [survey]);

  const rows = useMemo(() => {
    return responses.map((r) => {
      const byId = {};
      for (const a of r.answers || []) {
        byId[a.questionId] = a.answerValue;
      }
      return {
        id: r.id,
        createdAt: r.createdAt,
        byId,
        score: r.score,
        respondentEmail: r.respondentEmail,
      };
    });
  }, [responses]);

  const showScoreCol = Boolean(survey?.isQuiz);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-sm font-medium text-[#673ab7] hover:underline">
            ← Bảng điều khiển
          </Link>
          <h1 className="mt-2 text-2xl font-normal text-gray-900 tracking-tight">
            {survey?.title || 'Câu trả lời'}
          </h1>
          {survey?.description ? (
            <p className="mt-1 text-sm text-gray-600">{survey.description}</p>
          ) : null}
        </div>
        {survey?.id && (
          <button
            type="button"
            className="rounded-lg border border-[#673ab7]/40 bg-[#f3e5f5]/50 px-3 py-1.5 text-sm font-medium text-[#5e35b1] hover:bg-[#ede7f6]"
            onClick={() => {
              const url = `${window.location.origin}/survey/${survey.id}`;
              navigator.clipboard.writeText(url).catch(() => window.prompt('Link:', url));
            }}
          >
            Copy link biểu mẫu
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Đang tải…</p>}

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">Chưa có lượt nộp nào.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[#dadce0] bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                  Thời gian nộp
                </th>
                <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Người nộp</th>
                {showScoreCol && (
                  <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Điểm</th>
                )}
                {columns.map((q) => (
                  <th
                    key={q.questionId}
                    className="min-w-[160px] max-w-[280px] px-4 py-3 font-medium text-gray-700 align-top"
                  >
                    <span
                      className="line-clamp-4 text-left text-sm [&_a]:text-[#5e35b1] [&_p]:m-0 [&_p]:inline"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSurveyHtml(q.text || ''),
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="group border-b border-gray-100 last:border-0 hover:bg-violet-50/50"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 text-gray-600 whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] group-hover:bg-violet-50/50">
                    {row.createdAt
                      ? new Date(row.createdAt).toLocaleString('vi-VN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs max-w-[140px] truncate group-hover:bg-violet-50/50">
                    {row.respondentEmail || '—'}
                  </td>
                  {showScoreCol && (
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap group-hover:bg-violet-50/50">
                      {row.score != null ? row.score : '—'}
                    </td>
                  )}
                  {columns.map((q) => (
                    <td
                      key={q.questionId}
                      className="px-4 py-3 text-gray-800 align-top group-hover:bg-violet-50/50"
                    >
                      <span className="line-clamp-4 break-words">
                        {formatAnswer(row.byId[q.questionId])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
