import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api.js';
import AddQuestionModal from '../components/builder/AddQuestionModal.jsx';
import QuestionEditor from '../components/builder/QuestionEditor.jsx';
import { createEmptyQuestion } from '../components/builder/questionTypes.js';
import ImageUploader from '../components/ImageUploader.jsx';
import { isRichTextEmpty } from '../utils/sanitizeHtml.js';
import { getOptionText, normalizeOptionForForm } from '../utils/options.js';

function normalizeQuestionsForApi(questions, isQuiz) {
  return questions.map((q) => {
    const optsRaw = q.options || [];
    const opts = optsRaw
      .map((o) => {
        const text = getOptionText(o).trim();
        const imageUrl = typeof o === 'string' ? '' : String(o?.imageUrl || '').trim();
        return { text, imageUrl };
      })
      .filter((o) => o.text || o.imageUrl);

    const optionTexts = opts.map((o) => o.text);

    const base = {
      type: q.type,
      text: typeof q.text === 'string' ? q.text.trim() : '',
      imageUrl: String(q.imageUrl || '').trim(),
      isRequired: Boolean(q.isRequired),
      options: q.type === 'radio' || q.type === 'checkbox' ? opts : [],
    };
    if (q.questionId) {
      base.questionId = q.questionId;
    }
    if (isQuiz && (q.type === 'radio' || q.type === 'checkbox')) {
      const raw = (q.correctAnswers || []).filter(
        (c) => typeof c === 'string' && optionTexts.includes(c)
      );
      base.correctAnswers = q.type === 'radio' ? raw.slice(0, 1) : raw;
      base.points = Math.max(0, Number(q.points) || 0);
    } else {
      base.correctAnswers = [];
      base.points = 0;
    }
    return base;
  });
}

function mapServerQuestionToForm(q) {
  const qid = q.questionId || crypto.randomUUID();
  const opts = Array.isArray(q.options) ? q.options.map(normalizeOptionForForm) : [];
  return {
    localId: qid,
    questionId: q.questionId,
    type: q.type,
    text: q.text && String(q.text).trim() ? q.text : '<p></p>',
    imageUrl: q.imageUrl || '',
    isRequired: Boolean(q.isRequired),
    options: opts,
    correctAnswers: Array.isArray(q.correctAnswers) ? [...q.correctAnswers] : [],
    points: Math.max(0, Number(q.points) || 0),
  };
}

export default function CreateSurvey() {
  const navigate = useNavigate();
  const { surveyId: editSurveyId } = useParams();
  const isEdit = Boolean(editSurveyId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formCoverUrl, setFormCoverUrl] = useState('');
  const [surveyStatus, setSurveyStatus] = useState('published');
  const [isQuiz, setIsQuiz] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingSurvey, setLoadingSurvey] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!editSurveyId) {
      setLoadingSurvey(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoadingSurvey(true);
      setLoadError(null);
      try {
        const { data } = await api.get(`/api/surveys/${editSurveyId}/edit`);
        if (cancelled) return;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setFormCoverUrl(data.coverUrl || '');
        setSurveyStatus(data.status || 'draft');
        setIsQuiz(Boolean(data.isQuiz));
        setQuestions((data.questions || []).map(mapServerQuestionToForm));
      } catch (err) {
        if (cancelled) return;
        const msg =
          err.response?.data?.message ||
          err.message ||
          'Không tải được biểu mẫu để chỉnh sửa.';
        setLoadError(msg);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoadingSurvey(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editSurveyId]);

  const updateQuestion = useCallback((localId, updater) => {
    setQuestions((prev) =>
      prev.map((q) => (q.localId === localId ? updater(q) : q))
    );
  }, []);

  const removeQuestion = useCallback((localId) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== localId));
  }, []);

  const moveQuestion = useCallback((localId, delta) => {
    setQuestions((prev) => {
      const i = prev.findIndex((q) => q.localId === localId);
      if (i < 0) return prev;
      const j = i + delta;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const handlePickType = (type) => {
    setQuestions((prev) => [...prev, createEmptyQuestion(type)]);
  };

  const handleIsQuizToggle = (checked) => {
    setIsQuiz(checked);
    if (!checked) {
      setQuestions((prev) =>
        prev.map((q) => ({ ...q, correctAnswers: [], points: 0 }))
      );
    }
  };

  const validate = () => {
    if (!title.trim()) return 'Vui lòng nhập tiêu đề biểu mẫu.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (isRichTextEmpty(q.text)) {
        return `Câu ${i + 1}: nội dung câu hỏi không được để trống.`;
      }
      if (q.type === 'radio' || q.type === 'checkbox') {
        const texts = (q.options || []).map((o) => getOptionText(o).trim()).filter(Boolean);
        if (texts.length === 0) return `Câu ${i + 1}: cần ít nhất một lựa chọn có nội dung.`;
      }
      if (isQuiz && (q.type === 'radio' || q.type === 'checkbox')) {
        const pts = Math.max(0, Number(q.points) || 0);
        const ca = (q.correctAnswers || []).filter(Boolean);
        if (pts > 0 && ca.length === 0) {
          return `Câu ${i + 1}: đã đặt điểm > 0 cần chọn ít nhất một đáp án đúng.`;
        }
      }
    }
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        coverUrl: formCoverUrl.trim(),
        status: isEdit ? surveyStatus : 'published',
        isQuiz,
        questions: normalizeQuestionsForApi(questions, isQuiz),
      };
      if (isEdit) {
        await api.put(`/api/surveys/${editSurveyId}`, payload);
        toast.success('Đã cập nhật biểu mẫu.');
        navigate('/', { replace: true, state: { updated: true } });
      } else {
        await api.post('/api/surveys', payload);
        toast.success('Đã tạo biểu mẫu.');
        navigate('/', { replace: true, state: { saved: true } });
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || 'Lưu thất bại.';
      setError(errMsg);
      if (err.response?.status === 403) {
        toast.error(errMsg || 'Bạn không có quyền thực hiện thao tác này.');
      } else {
        toast.error(errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#673ab7] focus:outline-none focus:ring-2 focus:ring-[#673ab7]/25';

  if (isEdit && loadingSurvey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <p className="text-sm text-gray-600">Đang tải biểu mẫu…</p>
      </div>
    );
  }

  if (isEdit && loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {loadError}
        </div>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-medium text-[#673ab7] hover:underline"
        >
          ← Về bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-normal text-gray-900 tracking-tight">
          {isEdit ? 'Chỉnh sửa biểu mẫu' : 'Tạo biểu mẫu'}
        </h1>
        <Link
          to="/"
          className="text-sm font-medium text-[#673ab7] hover:underline"
        >
          ← Về bảng điều khiển
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-[#dadce0] bg-white p-6 shadow-sm space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">Ảnh bìa biểu mẫu</p>
            <p className="text-xs text-gray-500 mb-3">
              Tải ảnh đại diện cho form (tùy chọn). Ảnh hiển thị phía trên tiêu đề khi người dùng mở form.
            </p>
            <ImageUploader
              label="Chọn ảnh bìa"
              previewUrl={formCoverUrl || null}
              onUploadSuccess={(url) => setFormCoverUrl(url)}
              onRemovePreview={formCoverUrl ? () => setFormCoverUrl('') : undefined}
            />
            {formCoverUrl ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <img
                  src={formCoverUrl}
                  alt=""
                  className="max-h-52 w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Đặt làm bài kiểm tra</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Người làm phải đăng nhập và chỉ được nộp 1 lần.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                role="switch"
                aria-checked={isQuiz}
                className="h-5 w-5 rounded border-gray-300 text-[#673ab7] focus:ring-[#673ab7]"
                checked={isQuiz}
                onChange={(e) => handleIsQuizToggle(e.target.checked)}
              />
              <span className="text-sm text-gray-700">{isQuiz ? 'Bật' : 'Tắt'}</span>
            </label>
          </div>

          <div>
            <label htmlFor="survey-title" className="block text-sm font-medium text-gray-800 mb-1">
              Tiêu đề
            </label>
            <input
              id="survey-title"
              type="text"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề biểu mẫu"
              required
            />
          </div>
          <div>
            <label htmlFor="survey-desc" className="block text-sm font-medium text-gray-800 mb-1">
              Mô tả
            </label>
            <textarea
              id="survey-desc"
              className={`min-h-[88px] resize-y ${inputClass}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn (tùy chọn)"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-gray-900">Câu hỏi</h2>
          <button
            type="button"
            className="rounded-lg bg-[#673ab7] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5e35b1]"
            onClick={() => setModalOpen(true)}
          >
            Thêm câu hỏi
          </button>
        </div>

        {questions.length === 0 && (
          <p className="text-sm text-gray-500 rounded-xl border border-dashed border-gray-300 bg-white/60 px-4 py-8 text-center">
            Chưa có câu hỏi. Nhấn &quot;Thêm câu hỏi&quot; để bắt đầu.
          </p>
        )}

        <div className="space-y-4">
          {questions.map((q, index) => (
            <QuestionEditor
              key={q.localId}
              question={q}
              index={index}
              total={questions.length}
              isQuiz={isQuiz}
              onChange={updateQuestion}
              onRemove={removeQuestion}
              onMoveUp={(id) => moveQuestion(id, -1)}
              onMoveDown={(id) => moveQuestion(id, 1)}
            />
          ))}
        </div>

        {error && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#673ab7] px-6 text-sm font-medium text-white shadow-sm hover:bg-[#5e35b1] disabled:opacity-60"
          >
            {saving ? 'Đang lưu…' : isEdit ? 'Cập nhật Form' : 'Lưu Form'}
          </button>
        </div>
      </form>

      <AddQuestionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onPickType={handlePickType}
      />
    </div>
  );
}
