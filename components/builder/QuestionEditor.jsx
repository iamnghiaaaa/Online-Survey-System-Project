import { useState } from 'react';
import { QUESTION_TYPE_LABELS } from './questionTypes.js';
import QuestionRichEditor from '../QuestionRichEditor.jsx';
import ImageUploader from '../ImageUploader.jsx';
import { getOptionText } from '../../utils/options.js';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#673ab7] focus:outline-none focus:ring-2 focus:ring-[#673ab7]/25';

export default function QuestionEditor({
  question,
  index,
  total,
  isQuiz,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) {
  const [answerKeyOpen, setAnswerKeyOpen] = useState(false);
  const {
    localId,
    type,
    text,
    imageUrl = '',
    isRequired,
    options,
    correctAnswers = [],
    points = 0,
  } = question;
  const showOptions = type === 'radio' || type === 'checkbox';
  const showQuizKey = isQuiz && showOptions;

  const patch = (partial) => {
    onChange(localId, (q) => ({ ...q, ...partial }));
  };

  const setOptionAt = (optIndex, textVal) => {
    onChange(localId, (q) => {
      const next = [...(q.options || [])].map((o) =>
        typeof o === 'string' ? { text: o, imageUrl: '' } : { ...o }
      );
      const oldText = getOptionText(next[optIndex]);
      next[optIndex] = {
        ...normalizeOpt(next[optIndex]),
        text: textVal,
      };
      let ca = [...(q.correctAnswers || [])];
      if (q.type === 'radio') {
        if (ca[0] === oldText) ca = textVal.trim() ? [textVal] : [];
      } else {
        ca = ca.map((c) => (c === oldText ? textVal : c)).filter((c) =>
          next.some((o) => getOptionText(o) === c)
        );
      }
      return { ...q, options: next, correctAnswers: ca };
    });
  };

  const setOptionImageAt = (optIndex, url) => {
    onChange(localId, (q) => {
      const next = [...(q.options || [])].map((o) =>
        typeof o === 'string' ? { text: o, imageUrl: '' } : { ...o }
      );
      next[optIndex] = { ...normalizeOpt(next[optIndex]), imageUrl: url };
      return { ...q, options: next };
    });
  };

  const addOption = () => {
    onChange(localId, (q) => {
      const list = [...(q.options || [])].map((o) =>
        typeof o === 'string' ? { text: o, imageUrl: '' } : { ...o }
      );
      const n = list.length + 1;
      return {
        ...q,
        options: [...list, { text: `Lựa chọn ${n}`, imageUrl: '' }],
      };
    });
  };

  const removeOption = (optIndex) => {
    onChange(localId, (q) => {
      const list = [...(q.options || [])].map((o) =>
        typeof o === 'string' ? { text: o, imageUrl: '' } : { ...o }
      );
      const removedText = getOptionText(list[optIndex]);
      const next = list.filter((_, i) => i !== optIndex);
      let ca = (q.correctAnswers || []).filter((c) => c !== removedText);
      return {
        ...q,
        options: next.length ? next : [{ text: '', imageUrl: '' }],
        correctAnswers: ca,
      };
    });
  };

  const setRadioCorrect = (optText) => {
    patch({ correctAnswers: [optText] });
  };

  const toggleCheckboxCorrect = (optText) => {
    const cur = new Set(correctAnswers || []);
    if (cur.has(optText)) cur.delete(optText);
    else cur.add(optText);
    patch({ correctAnswers: [...cur] });
  };

  return (
    <div className="rounded-xl border border-[#dadce0] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-[#673ab7]">
            Câu {index + 1}
          </span>
          <p className="text-sm text-gray-500">{QUESTION_TYPE_LABELS[type]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30"
            disabled={index === 0}
            onClick={() => onMoveUp(localId)}
            title="Lên"
            aria-label="Di chuyển lên"
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30"
            disabled={index >= total - 1}
            onClick={() => onMoveDown(localId)}
            title="Xuống"
            aria-label="Di chuyển xuống"
          >
            ↓
          </button>
          <button
            type="button"
            className="ml-1 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            onClick={() => onRemove(localId)}
          >
            Xóa
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-medium text-gray-600">Nội dung câu hỏi</label>
            <ImageUploader
              compact
              label="Tải ảnh minh họa câu hỏi"
              previewUrl={imageUrl || null}
              onUploadSuccess={(url) => patch({ imageUrl: url })}
              onRemovePreview={imageUrl ? () => patch({ imageUrl: '' }) : undefined}
            />
          </div>
          <QuestionRichEditor
            value={text}
            onChange={(html) => patch({ text: html })}
            id={`q-text-${localId}`}
          />
        </div>

        {imageUrl ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <img src={imageUrl} alt="" className="max-h-48 w-full object-contain" />
          </div>
        ) : null}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-[#673ab7] focus:ring-[#673ab7]"
            checked={isRequired}
            onChange={(e) => patch({ isRequired: e.target.checked })}
          />
          Bắt buộc trả lời
        </label>

        {showOptions && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Lựa chọn</span>
              <button
                type="button"
                className="text-sm font-medium text-[#673ab7] hover:underline"
                onClick={addOption}
              >
                + Thêm lựa chọn
              </button>
            </div>
            <ul className="space-y-2">
              {(options || []).map((opt, i) => {
                const optText = getOptionText(opt);
                const optImg = typeof opt === 'string' ? '' : opt?.imageUrl || '';
                return (
                  <li key={`${localId}-opt-${i}`} className="flex flex-wrap items-start gap-2">
                    <input
                      type="text"
                      className={`flex-1 min-w-[140px] ${inputClass}`}
                      value={optText}
                      onChange={(e) => setOptionAt(i, e.target.value)}
                      placeholder={`Lựa chọn ${i + 1}`}
                    />
                    <ImageUploader
                      compact
                      label="Tải ảnh lựa chọn"
                      showPreview={false}
                      onUploadSuccess={(url) => setOptionImageAt(i, url)}
                    />
                    {optImg ? (
                      <img
                        src={optImg}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded border border-gray-200 object-cover"
                      />
                    ) : null}
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      disabled={(options || []).length <= 1}
                      onClick={() => removeOption(i)}
                      aria-label="Xóa lựa chọn"
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {showQuizKey && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm font-medium text-[#5e35b1]"
              onClick={() => setAnswerKeyOpen((o) => !o)}
              aria-expanded={answerKeyOpen}
            >
              <span>Đáp án (Answer Key)</span>
              <span className="text-gray-500">{answerKeyOpen ? '▾' : '▸'}</span>
            </button>
            {answerKeyOpen && (
              <div className="mt-3 space-y-3 border-t border-violet-200 pt-3">
                <p className="text-xs text-gray-600">
                  Đánh dấu đáp án đúng và nhập điểm cho câu này.
                </p>
                {type === 'radio' && (
                  <ul className="space-y-2">
                    {(options || []).map((opt, oi) => {
                      const t = getOptionText(opt);
                      const id = `correct-${localId}-${oi}`;
                      return (
                        <li key={id}>
                          <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              id={id}
                              type="radio"
                              name={`correct-${localId}`}
                              className="h-4 w-4 border-gray-300 text-[#673ab7]"
                              checked={(correctAnswers || [])[0] === t}
                              onChange={() => setRadioCorrect(t)}
                            />
                            <span>{t || '(trống)'}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {type === 'checkbox' && (
                  <ul className="space-y-2">
                    {(options || []).map((opt, oi) => {
                      const t = getOptionText(opt);
                      return (
                        <li key={`cb-${localId}-${oi}`}>
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-[#673ab7]"
                              checked={(correctAnswers || []).includes(t)}
                              onChange={() => toggleCheckboxCorrect(t)}
                            />
                            <span>{t || '(trống)'}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Điểm</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={`max-w-[120px] ${inputClass}`}
                    value={Number.isFinite(points) ? points : 0}
                    onChange={(e) => patch({ points: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeOpt(o) {
  if (typeof o === 'string') return { text: o, imageUrl: '' };
  return { text: o?.text || '', imageUrl: o?.imageUrl || '' };
}
