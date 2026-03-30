const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const { computeQuizScore, buildQuizBreakdown, normAnswerString } = require('../utils/quizScoring');
const { plainTextPreview, optionTextsList } = require('../utils/surveyNormalize');
const { getJwtSecret } = require('../middleware/auth');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function isAnswerEmpty(answerValue) {
  if (answerValue === undefined || answerValue === null) return true;
  if (typeof answerValue === 'string') return answerValue.trim() === '';
  if (Array.isArray(answerValue)) {
    if (answerValue.length === 0) return true;
    return answerValue.every((v) => typeof v === 'string' && v.trim() === '');
  }
  return false;
}

function normalizeAnswerMap(answersInput) {
  if (!Array.isArray(answersInput)) return new Map();
  const map = new Map();
  for (const item of answersInput) {
    if (item && typeof item.questionId === 'string' && item.questionId.trim()) {
      map.set(item.questionId.trim(), item.answerValue);
    }
  }
  return map;
}

async function submitResponse(req, res) {
  try {
    const { id: surveyId } = req.params;
    if (!isValidObjectId(surveyId)) {
      return res.status(400).json({ message: 'ID biểu mẫu không hợp lệ.' });
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    if (survey.isQuiz) {
      if (!req.user) {
        return res.status(401).json({
          message: 'Vui lòng đăng nhập để làm bài kiểm tra.',
        });
      }
      const existing = await Response.findOne({
        surveyId,
        userId: req.user.id,
      }).lean();
      if (existing) {
        return res.status(403).json({
          message:
            'Bạn đã hoàn thành bài kiểm tra này, mỗi tài khoản chỉ được làm 1 lần.',
        });
      }
    }

    const { answers: answersBody, respondentEmail: bodyEmail } = req.body || {};
    const answerByQuestionId = normalizeAnswerMap(answersBody);

    const questionIds = new Set(survey.questions.map((q) => q.questionId));
    for (const qid of answerByQuestionId.keys()) {
      if (!questionIds.has(qid)) {
        return res.status(400).json({ message: `questionId không tồn tại trên biểu mẫu: ${qid}` });
      }
    }

    for (const q of survey.questions) {
      if (!q.isRequired) continue;
      const raw = answerByQuestionId.get(q.questionId);
      if (isAnswerEmpty(raw)) {
        return res.status(400).json({
          message: `Câu hỏi bắt buộc chưa được trả lời: ${plainTextPreview(q.text)}`,
          questionId: q.questionId,
        });
      }
    }

    const allowedNormFor = (q) => {
      const texts = optionTextsList(q.options);
      return new Set(texts.map((t) => normAnswerString(t)));
    };

    for (const q of survey.questions) {
      if (!answerByQuestionId.has(q.questionId)) continue;
      const raw = answerByQuestionId.get(q.questionId);
      if (q.type === 'radio') {
        if (typeof raw !== 'string' || !raw.trim()) continue;
        const allowed = allowedNormFor(q);
        if (allowed.size && !allowed.has(normAnswerString(raw))) {
          return res.status(400).json({
            message: `Giá trị lựa chọn không hợp lệ cho câu: ${plainTextPreview(q.text)}`,
            questionId: q.questionId,
          });
        }
      }
      if (q.type === 'checkbox') {
        const arr = Array.isArray(raw) ? raw : [];
        const allowed = allowedNormFor(q);
        if (allowed.size) {
          for (const v of arr) {
            if (typeof v === 'string' && v.trim() && !allowed.has(normAnswerString(v))) {
              return res.status(400).json({
                message: `Giá trị lựa chọn không hợp lệ cho câu: ${plainTextPreview(q.text)}`,
                questionId: q.questionId,
              });
            }
          }
        }
      }
    }

    const answers = [];
    for (const q of survey.questions) {
      if (!answerByQuestionId.has(q.questionId)) continue;
      answers.push({
        questionId: q.questionId,
        answerValue: answerByQuestionId.get(q.questionId),
      });
    }

    const score = survey.isQuiz ? computeQuizScore(survey, answers) : null;

    let respondentEmail = '';
    if (req.user) {
      respondentEmail = req.user.email || '';
    } else if (bodyEmail && typeof bodyEmail === 'string') {
      respondentEmail = bodyEmail.trim();
    }

    const doc = await Response.create({
      surveyId,
      answers,
      score,
      userId: req.user ? req.user.id : null,
      respondentEmail,
    });

    res.status(201).json({
      id: doc._id.toString(),
      surveyId: doc.surveyId.toString(),
      answers: doc.answers,
      score: doc.score,
      isQuiz: Boolean(survey.isQuiz),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') || 'Dữ liệu không hợp lệ.' });
    }
    console.error('submitResponse:', err);
    res.status(500).json({ message: 'Không thể gửi câu trả lời.' });
  }
}

async function listResponses(req, res) {
  try {
    const { id: surveyId } = req.params;
    if (!isValidObjectId(surveyId)) {
      return res.status(400).json({ message: 'ID biểu mẫu không hợp lệ.' });
    }

    const survey = await Survey.findById(surveyId).lean();
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    if (String(survey.creatorId) !== req.user.id) {
      return res.status(403).json({ message: 'Không có quyền xem câu trả lời của biểu mẫu này.' });
    }

    const responses = await Response.find({ surveyId })
      .sort({ createdAt: -1 })
      .lean();

    const payload = responses.map((r) => ({
      id: r._id.toString(),
      surveyId: r.surveyId.toString(),
      answers: r.answers,
      score: r.score,
      userId: r.userId ? r.userId.toString() : null,
      respondentEmail: r.respondentEmail || '',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    res.json(payload);
  } catch (err) {
    console.error('listResponses:', err);
    res.status(500).json({ message: 'Không thể tải câu trả lời.' });
  }
}

async function getResponseSummary(req, res) {
  try {
    const { id: surveyId, responseId } = req.params;
    if (!isValidObjectId(surveyId) || !isValidObjectId(responseId)) {
      return res.status(400).json({ message: 'ID không hợp lệ.' });
    }

    const survey = await Survey.findById(surveyId).lean();
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    if (!survey.isQuiz) {
      return res.status(400).json({ message: 'Biểu mẫu này không phải bài kiểm tra.' });
    }

    const responseDoc = await Response.findById(responseId).lean();
    if (!responseDoc || String(responseDoc.surveyId) !== surveyId) {
      return res.status(404).json({ message: 'Không tìm thấy bài nộp.' });
    }

    if (responseDoc.userId) {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Yêu cầu đăng nhập để xem kết quả.' });
      }
      try {
        const payload = jwt.verify(auth.slice(7), getJwtSecret());
        if (String(responseDoc.userId) !== String(payload.userId)) {
          return res.status(403).json({ message: 'Không có quyền xem kết quả này.' });
        }
      } catch {
        return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' });
      }
    }

    const { score, maxScore, items } = buildQuizBreakdown(survey, responseDoc.answers || []);

    res.json({
      surveyId,
      responseId: responseDoc._id.toString(),
      title: survey.title,
      score,
      maxScore,
      items,
    });
  } catch (err) {
    console.error('getResponseSummary:', err);
    res.status(500).json({ message: 'Không thể tải kết quả.' });
  }
}

module.exports = {
  submitResponse,
  listResponses,
  getResponseSummary,
};
