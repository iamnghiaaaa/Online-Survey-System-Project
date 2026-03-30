export const QUESTION_TYPE_LABELS = {
  text: 'Trả lời ngắn',
  textarea: 'Đoạn',
  radio: 'Trắc nghiệm ',
  checkbox: 'Hộp kiểm',
};

export const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS);

export function createEmptyQuestion(type) {
  const base = {
    localId: crypto.randomUUID(),
    type,
    text: '<p></p>',
    imageUrl: '',
    isRequired: false,
    options: [],
    correctAnswers: [],
    points: 0,
  };
  if (type === 'radio' || type === 'checkbox') {
    base.options = [
      { text: 'Lựa chọn 1', imageUrl: '' },
      { text: 'Lựa chọn 2', imageUrl: '' },
    ];
  }
  return base;
}
