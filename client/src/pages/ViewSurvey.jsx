import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { sanitizeSurveyHtml, plainTextSnippet } from '../utils/sanitizeHtml.js';
import { getOptionText, getOptionImage } from '../utils/options.js';

function buildInitialAnswers(questions) {
  const next = {};
  for (const q of questions || []) {
    next[q.questionId] = q.type === 'checkbox' ? [] : '';
  }
  return next;
}

function validateRequired(survey, answersState) {
  for (const q of survey.questions || []) {
    if (!q.isRequired) continue;
    const v = answersState[q.questionId];
    const label = plainTextSnippet(q.text, 80);
    if (q.type === 'checkbox') {
      if (!Array.isArray(v) || v.length === 0) {
        return {
          message: `Vui lòng chọn ít nhất một lựa chọn: ${label}`,
          questionId: q.questionId,
        };
      }
    } else if (v === undefined || v === null || String(v).trim() === '') {
      return { message: `Trường bắt buộc: ${label}`, questionId: q.questionId };
    }
  }
  return null;
}

function buildSubmitAnswers(survey, answersState) {
  const list = [];
  for (const q of survey.questions || []) {
    const v = answersState[q.questionId];
    if (q.type === 'checkbox') {
      if (Array.isArray(v) && v.length > 0) {
        list.push({ questionId: q.questionId, answerValue: v });
      }
    } else if (typeof v === 'string' && v.trim() !== '') {
      list.push({ questionId: q.questionId, answerValue: v.trim() });
    }
  }
  return list;
}

export default function ViewSurvey() {
  const { surveyId } = useParams();
  const { user, ready } = useAuth();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrorId, setFieldErrorId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastResponseId, setLastResponseId] = useState(null);
  const [submittedIsQuiz, setSubmittedIsQuiz] = useState(false);

  const fetchSurvey = useCallback(async () => {
    if (!surveyId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get(`/api/surveys/${surveyId}`);
      setSurvey(data);
      setAnswers(buildInitialAnswers(data.questions));
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Không tải được biểu mẫu.';
      setLoadError(msg);
      setSurvey(null);
    } finally {
      setLoading(false);
    }
  }, [surveyId, user?.id]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const setTextValue = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setFieldErrorId(null);
    setSubmitError(null);
  };

  const toggleCheckbox = (questionId, option) => {
    setAnswers((prev) => {
      const cur = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = cur.includes(option)
        ? cur.filter((x) => x !== option)
        : [...cur, option];
      return { ...prev, [questionId]: next };
    });
    setFieldErrorId(null);
    setSubmitError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!survey || submitted) return;

    const validation = validateRequired(survey, answers);
    if (validation) {
      setSubmitError(validation.message);
      setFieldErrorId(validation.questionId);
      return;
    }

    const payload = { answers: buildSubmitAnswers(survey, answers) };
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrorId(null);

    try {
      const { data } = await api.post(`/api/surveys/${surveyId}/submit`, payload);
      setLastResponseId(data.id);
      setSubmittedIsQuiz(Boolean(data.isQuiz));
      setSubmitted(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gửi câu trả lời thất bại.';
      setSubmitError(msg);
      if (err.response?.data?.questionId) {
        setFieldErrorId(err.response.data.questionId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4">
        <p className="text-sm text-gray-600">Đang tải biểu mẫu…</p>
      </div>
    );
  }

  if (loadError || !survey) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white px-6 py-5 shadow-sm text-center">
          <p className="text-red-700 text-sm font-medium">Không thể mở biểu mẫu</p>
          <p className="mt-2 text-sm text-gray-600">{loadError}</p>
        </div>
      </div>
    );
  }

  if (survey.isQuiz && !ready) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4">
        <p className="text-sm text-gray-600">Đang kiểm tra phiên đăng nhập…</p>
      </div>
    );
  }

  if (survey.isQuiz && !user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`/survey/${surveyId}`)}`}
        replace
        state={{ message: 'Vui lòng đăng nhập để làm bài kiểm tra.' }}
      />
    );
  }

  if (survey.isQuiz && survey.alreadyCompleted) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full rounded-2xl border border-[#dadce0] bg-white px-8 py-10 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-[#5e35b1]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-normal text-gray-900">{survey.title}</h1>
          <p className="mt-4 text-sm text-gray-700 leading-relaxed">
            Bạn đã hoàn thành bài kiểm tra này.
          </p>
          {survey.existingScore != null && (
            <p className="mt-3 text-sm font-medium text-[#5e35b1]">
              Điểm đã lưu: {survey.existingScore}
            </p>
          )}
          {survey.existingResponseId && (
            <div className="mt-6">
              <Link
                to={`/survey/${surveyId}/result/${survey.existingResponseId}`}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#673ab7] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#5e35b1]"
              >
                Xem điểm / Kết quả chi tiết
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f6f2fa] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2e7d32]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-normal text-gray-900">Đã gửi phản hồi</h1>
          <p className="mt-2 text-sm text-gray-600">
            {submittedIsQuiz
              ? 'Bài làm của bạn đã được ghi nhận.'
              : 'Câu trả lời của bạn đã được ghi lại. Cảm ơn bạn đã hoàn thành biểu mẫu.'}
          </p>
          {submittedIsQuiz && lastResponseId && (
            <div className="mt-6">
              <Link
                to={`/survey/${surveyId}/result/${lastResponseId}`}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#673ab7] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#5e35b1]"
              >
                Xem điểm (View Score)
              </Link>
            </div>
          )}
          {!submittedIsQuiz && (
            <p className="mt-4 text-xs text-gray-500">Bạn có thể đóng tab này.</p>
          )}
        </div>
      </div>
    );
  }

  const inputRing =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-[15px] text-gray-900 shadow-sm transition focus:border-[#673ab7] focus:outline-none focus:ring-2 focus:ring-[#673ab7]/25';

  return (
    <div className="min-h-screen bg-[#f6f2fa] pb-16 pt-8 px-4 sm:px-6">
      <div className="mx-auto max-w-[640px]">
        {survey.coverUrl ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-[#dadce0] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.12)]">
            <img
              src={survey.coverUrl}
              alt=""
              className="max-h-[280px] w-full object-cover"
            />
          </div>
        ) : null}
        <header className="mb-6 rounded-xl border border-[#dadce0] bg-white px-6 py-8 shadow-[0_1px_2px_rgba(60,64,67,0.15)]">
          <h1 className="text-[32px] leading-tight font-normal tracking-tight text-gray-900">
            {survey.title}
          </h1>
          {survey.description ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{survey.description}</p>
          ) : null}
          {survey.isQuiz ? (
            <p className="mt-2 text-xs font-medium text-[#5e35b1]">Bài kiểm tra — sẽ có điểm sau khi nộp.</p>
          ) : null}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(survey.questions || []).map((q, index) => {
            const err = fieldErrorId === q.questionId;
            return (
              <fieldset
                key={q.questionId}
                className={`rounded-xl border bg-white px-6 py-6 shadow-[0_1px_2px_rgba(60,64,67,0.12)] ${
                  err ? 'border-red-300 ring-2 ring-red-100' : 'border-[#dadce0]'
                }`}
              >
                <legend className="sr-only">
                  Câu {index + 1}: {plainTextSnippet(q.text, 120)}
                </legend>
                <div className="mb-4">
                  <div className="text-base text-gray-900 survey-form-prose">
                    <span className="font-medium [&_a]:text-[#5e35b1] [&_a]:underline">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: sanitizeSurveyHtml(q.text || ''),
                        }}
                      />
                    </span>
                    {q.isRequired ? (
                      <span className="text-red-600" aria-hidden>
                        {' '}
                        *
                      </span>
                    ) : null}
                  </div>
                </div>

                {q.imageUrl ? (
                  <div className="mb-4 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    <img
                      src={q.imageUrl}
                      alt=""
                      className="max-h-56 w-full object-contain"
                    />
                  </div>
                ) : null}

                {q.type === 'text' && (
                  <input
                    type="text"
                    className={`w-full ${inputRing}`}
                    value={answers[q.questionId] ?? ''}
                    onChange={(e) => setTextValue(q.questionId, e.target.value)}
                    aria-invalid={err}
                    aria-required={q.isRequired}
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    className={`w-full min-h-[120px] resize-y ${inputRing}`}
                    value={answers[q.questionId] ?? ''}
                    onChange={(e) => setTextValue(q.questionId, e.target.value)}
                    aria-invalid={err}
                    aria-required={q.isRequired}
                  />
                )}

                {q.type === 'radio' && (
                  <ul className="space-y-2">
                    {(q.options || []).map((opt, oi) => {
                      const val = getOptionText(opt);
                      const img = getOptionImage(opt);
                      const id = `${q.questionId}-r-${oi}`;
                      return (
                        <li key={id}>
                          <label
                            htmlFor={id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                          >
                            <input
                              id={id}
                              type="radio"
                              name={q.questionId}
                              className="mt-1 h-4 w-4 shrink-0 border-gray-300 text-[#673ab7] focus:ring-[#673ab7]"
                              checked={answers[q.questionId] === val}
                              onChange={() => setTextValue(q.questionId, val)}
                              aria-invalid={err}
                              aria-required={q.isRequired}
                            />
                            <span className="flex flex-1 flex-wrap items-center gap-2 text-[15px] text-gray-800">
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  className="h-10 w-10 shrink-0 rounded border border-gray-200 object-cover"
                                />
                              ) : null}
                              <span>{val}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {q.type === 'checkbox' && (
                  <ul className="space-y-2">
                    {(q.options || []).map((opt, oi) => {
                      const val = getOptionText(opt);
                      const img = getOptionImage(opt);
                      const id = `${q.questionId}-cb-${oi}`;
                      const checked = (answers[q.questionId] || []).includes(val);
                      return (
                        <li key={id}>
                          <label
                            htmlFor={id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                          >
                            <input
                              id={id}
                              type="checkbox"
                              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#673ab7] focus:ring-[#673ab7]"
                              checked={checked}
                              onChange={() => toggleCheckbox(q.questionId, val)}
                              aria-invalid={err}
                              aria-required={q.isRequired}
                            />
                            <span className="flex flex-1 flex-wrap items-center gap-2 text-[15px] text-gray-800">
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  className="h-10 w-10 shrink-0 rounded border border-gray-200 object-cover"
                                />
                              ) : null}
                              <span>{val}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
            );
          })}

          {submitError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[36px] items-center justify-center rounded bg-[#673ab7] px-6 text-sm font-medium text-white shadow-sm transition hover:bg-[#5e35b1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Đang gửi…' : 'Nộp bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
