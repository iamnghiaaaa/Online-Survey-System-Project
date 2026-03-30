/**
 * Chuẩn hóa câu hỏi / lựa chọn (tương thích dữ liệu cũ: options là string[]).
 */

function normalizeOption(opt) {
  if (typeof opt === 'string') {
    return { text: opt, imageUrl: '' };
  }
  if (opt && typeof opt === 'object') {
    return {
      text: typeof opt.text === 'string' ? opt.text : '',
      imageUrl: typeof opt.imageUrl === 'string' ? opt.imageUrl.trim() : '',
    };
  }
  return { text: '', imageUrl: '' };
}

function isEmptyRichText(s) {
  if (s === undefined || s === null) return true;
  const str = String(s);
  const plain = str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain === '';
}

function optionDisplayText(opt) {
  const t = typeof opt === 'string' ? opt : opt?.text;
  return typeof t === 'string' ? t : '';
}

function normalizeQuestion(q) {
  if (!q || typeof q !== 'object') return null;
  const options = Array.isArray(q.options) ? q.options.map(normalizeOption) : [];
  return {
    questionId: q.questionId,
    type: q.type,
    text: typeof q.text === 'string' ? q.text : '',
    imageUrl: typeof q.imageUrl === 'string' ? q.imageUrl.trim() : '',
    isRequired: Boolean(q.isRequired),
    options,
    correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers.map(String) : [],
    points: Math.max(0, Number(q.points) || 0),
  };
}

function normalizeQuestionsInput(questions) {
  if (!Array.isArray(questions)) return [];
  return questions.map(normalizeQuestion).filter(Boolean);
}

function optionTextsList(options) {
  return (options || []).map((o) => optionDisplayText(o).trim()).filter(Boolean);
}

/**
 * @returns {string|null} thông báo lỗi hoặc null
 */
function validateQuestionsForSave(questions) {
  if (!Array.isArray(questions)) return 'Danh sách câu hỏi không hợp lệ.';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.type || !['text', 'textarea', 'radio', 'checkbox'].includes(q.type)) {
      return `Câu ${i + 1}: kiểu câu hỏi không hợp lệ.`;
    }
    if (isEmptyRichText(q.text)) {
      return `Câu ${i + 1}: nội dung câu hỏi không được để trống.`;
    }
    if (q.type === 'radio' || q.type === 'checkbox') {
      const texts = optionTextsList(q.options);
      if (texts.length === 0) {
        return `Câu ${i + 1}: cần ít nhất một lựa chọn có nội dung.`;
      }
    }
  }
  return null;
}

function coerceSurveyQuestionsFromDb(survey) {
  if (!survey || !Array.isArray(survey.questions)) return survey;
  return {
    ...survey,
    questions: survey.questions.map((q) => ({
      ...q,
      imageUrl: typeof q.imageUrl === 'string' ? q.imageUrl : '',
      options: Array.isArray(q.options) ? q.options.map(normalizeOption) : [],
    })),
  };
}

function plainTextPreview(html, max = 100) {
  if (!html) return '';
  const t = String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

module.exports = {
  normalizeOption,
  normalizeQuestionsInput,
  validateQuestionsForSave,
  coerceSurveyQuestionsFromDb,
  isEmptyRichText,
  optionDisplayText,
  optionTextsList,
  plainTextPreview,
};
