import { QUESTION_TYPE_LABELS, QUESTION_TYPES } from './questionTypes.js';

export default function AddQuestionModal({ open, onClose, onPickType }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-q-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/35"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[#dadce0] bg-white p-6 shadow-lg">
        <h2 id="add-q-title" className="text-lg font-medium text-gray-900">
          Chọn loại câu hỏi
        </h2>
        <p className="mt-1 text-sm text-gray-500">Thêm một câu hỏi mới vào biểu mẫu.</p>
        <ul className="mt-4 space-y-2">
          {QUESTION_TYPES.map((type) => (
            <li key={type}>
              <button
                type="button"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-800 transition hover:border-[#673ab7]/40 hover:bg-[#f3e5f5]/40"
                onClick={() => {
                  onPickType(type);
                  onClose();
                }}
              >
                {QUESTION_TYPE_LABELS[type]}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
