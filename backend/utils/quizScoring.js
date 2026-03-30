/** Chuẩn hóa để so khớp đáp án (bỏ HTML nếu có, gộp khoảng trắng, không phân biệt hoa thường). */
function normAnswerString(s) {
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normList(arr) {
  return (arr || []).map(normAnswerString).filter(Boolean);
}

/**
 * So khớp đáp án (không phân biệt hoa thường, trim).
 */
function isAnswerCorrect(question, answerValue) {
  const correct = question.correctAnswers || [];
  if (correct.length === 0) return false;

  const correctSet = normList(correct);

  if (question.type === 'radio' || question.type === 'text' || question.type === 'textarea') {
    const user =
      typeof answerValue === 'string' ? normAnswerString(answerValue) : '';
    if (!user) return false;
    return correctSet.includes(user);
  }

  if (question.type === 'checkbox') {
    const userArr = Array.isArray(answerValue) ? answerValue : [];
    const userSet = normList(userArr);
    if (userSet.length !== correctSet.length) return false;
    const sortedU = [...userSet].sort();
    const sortedC = [...correctSet].sort();
    return sortedU.every((v, i) => v === sortedC[i]);
  }

  return false;
}

function pointsForQuestion(question) {
  return Math.max(0, Number(question.points) || 0);
}

/**
 * @param {object} survey — document có isQuiz, questions
 * @param {Array<{questionId, answerValue}>} answersArray
 * @returns {number|null} tổng điểm hoặc null nếu không phải quiz
 */
function computeQuizScore(survey, answersArray) {
  if (!survey.isQuiz) return null;
  const map = new Map(answersArray.map((a) => [a.questionId, a.answerValue]));
  let total = 0;
  for (const q of survey.questions || []) {
    if (!map.has(q.questionId)) continue;
    if (isAnswerCorrect(q, map.get(q.questionId))) {
      total += pointsForQuestion(q);
    }
  }
  return total;
}

function maxQuizScore(survey) {
  if (!survey.isQuiz) return 0;
  return (survey.questions || []).reduce((sum, q) => sum + pointsForQuestion(q), 0);
}

/**
 * Chi tiết từng câu (dùng cho API summary).
 */
function buildQuizBreakdown(survey, answersArray) {
  const map = new Map(answersArray.map((a) => [a.questionId, a.answerValue]));
  const items = [];

  for (const q of survey.questions || []) {
    const userAnswer = map.has(q.questionId) ? map.get(q.questionId) : undefined;
    const hasKey = (q.correctAnswers || []).length > 0;
    const correct = hasKey && isAnswerCorrect(q, userAnswer);
    const pts = pointsForQuestion(q);
    const earned = correct ? pts : 0;

    items.push({
      questionId: q.questionId,
      questionText: q.text,
      type: q.type,
      userAnswer: userAnswer === undefined ? null : userAnswer,
      isCorrect: hasKey ? correct : null,
      pointsEarned: hasKey ? earned : null,
      pointsPossible: hasKey ? pts : null,
      correctAnswers: hasKey ? [...(q.correctAnswers || [])] : [],
    });
  }

  return {
    score: computeQuizScore(survey, answersArray),
    maxScore: maxQuizScore(survey),
    items,
  };
}

module.exports = {
  isAnswerCorrect,
  computeQuizScore,
  maxQuizScore,
  buildQuizBreakdown,
  normAnswerString,
};
