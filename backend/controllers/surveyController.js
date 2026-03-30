const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Response = require('../models/Response');
const {
  normalizeQuestionsInput,
  validateQuestionsForSave,
  coerceSurveyQuestionsFromDb,
} = require('../utils/surveyNormalize');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Ẩn đáp án đúng khi trả survey cho client (Form Viewer / public). */
function stripCorrectAnswersFromSurvey(surveyObj) {
  if (!surveyObj || !Array.isArray(surveyObj.questions)) return surveyObj;
  return {
    ...surveyObj,
    questions: surveyObj.questions.map((q) => {
      const { correctAnswers, ...rest } = q;
      return rest;
    }),
  };
}

async function listSurveys(req, res) {
  try {
    const surveys = await Survey.find()
      .select('title status isQuiz')
      .sort({ updatedAt: -1 })
      .lean();

    const payload = surveys.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      status: s.status,
      isQuiz: Boolean(s.isQuiz),
    }));

    res.json(payload);
  } catch (err) {
    console.error('listSurveys:', err);
    res.status(500).json({ message: 'Không thể tải danh sách biểu mẫu.' });
  }
}

async function getSurveyById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID biểu mẫu không hợp lệ.' });
    }

    const survey = await Survey.findById(id).lean();
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    const { _id, __v, ...rest } = coerceSurveyQuestionsFromDb(survey);

    if (survey.isQuiz && req.user) {
      const existing = await Response.findOne({
        surveyId: _id,
        userId: req.user.id,
      })
        .select('score')
        .lean();
      if (existing) {
        const safe = stripCorrectAnswersFromSurvey({ ...rest });
        return res.json({
          id: _id.toString(),
          title: safe.title,
          description: safe.description,
          coverUrl: safe.coverUrl || '',
          status: safe.status,
          isQuiz: true,
          createdAt: safe.createdAt,
          updatedAt: safe.updatedAt,
          questions: [],
          alreadyCompleted: true,
          existingResponseId: existing._id.toString(),
          existingScore: existing.score,
        });
      }
    }

    const safe = stripCorrectAnswersFromSurvey({ ...rest });
    res.json({ id: _id.toString(), ...safe });
  } catch (err) {
    console.error('getSurveyById:', err);
    res.status(500).json({ message: 'Không thể tải chi tiết biểu mẫu.' });
  }
}

async function createSurvey(req, res) {
  try {
    const { title, description, status, questions, isQuiz, coverUrl } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Trường title là bắt buộc.' });
    }

    const normalizedQuestions = normalizeQuestionsInput(questions);
    const qErr = validateQuestionsForSave(normalizedQuestions);
    if (qErr) {
      return res.status(400).json({ message: qErr });
    }

    const survey = await Survey.create({
      title: title.trim(),
      description: typeof description === 'string' ? description : '',
      coverUrl: typeof coverUrl === 'string' ? coverUrl.trim() : '',
      creatorId: req.user.id,
      status: status || 'draft',
      isQuiz: Boolean(isQuiz),
      questions: normalizedQuestions,
    });

    const plain = survey.toObject();
    const { _id, __v, ...rest } = plain;
    const safe = stripCorrectAnswersFromSurvey(rest);

    res.status(201).json({
      id: _id.toString(),
      ...safe,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') || 'Dữ liệu không hợp lệ.' });
    }
    console.error('createSurvey:', err);
    res.status(500).json({ message: 'Không thể tạo biểu mẫu.' });
  }
}

function assertCreator(survey, userId) {
  return String(survey.creatorId) === userId;
}

async function getSurveyForEdit(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID biểu mẫu không hợp lệ.' });
    }

    const survey = await Survey.findById(id).lean();
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    if (!assertCreator(survey, req.user.id)) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa biểu mẫu này.' });
    }

    const { _id, __v, ...rest } = coerceSurveyQuestionsFromDb(survey);
    res.json({ id: _id.toString(), ...rest });
  } catch (err) {
    console.error('getSurveyForEdit:', err);
    res.status(500).json({ message: 'Không thể tải biểu mẫu để chỉnh sửa.' });
  }
}

async function updateSurvey(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID biểu mẫu không hợp lệ.' });
    }

    const survey = await Survey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    if (!assertCreator(survey, req.user.id)) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật biểu mẫu này.' });
    }

    const { title, description, status, questions, isQuiz, coverUrl } = req.body;

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'Trường title là bắt buộc.' });
      }
      survey.title = title.trim();
    }
    if (description !== undefined) {
      survey.description = typeof description === 'string' ? description : '';
    }
    if (coverUrl !== undefined) {
      survey.coverUrl = typeof coverUrl === 'string' ? coverUrl.trim() : '';
    }
    if (status !== undefined && ['draft', 'published', 'closed'].includes(status)) {
      survey.status = status;
    }
    if (isQuiz !== undefined) {
      survey.isQuiz = Boolean(isQuiz);
    }
    if (questions !== undefined) {
      const normalizedQuestions = normalizeQuestionsInput(questions);
      const qErr = validateQuestionsForSave(normalizedQuestions);
      if (qErr) {
        return res.status(400).json({ message: qErr });
      }
      survey.questions = normalizedQuestions;
    }

    await survey.save();
    const plain = survey.toObject();
    const { _id, __v, ...rest } = plain;
    const safe = stripCorrectAnswersFromSurvey(rest);

    res.json({
      id: _id.toString(),
      ...safe,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(' ') || 'Dữ liệu không hợp lệ.' });
    }
    console.error('updateSurvey:', err);
    res.status(500).json({ message: 'Không thể cập nhật biểu mẫu.' });
  }
}

async function deleteSurvey(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID biểu mẫu không hợp lệ.' });
    }

    const survey = await Survey.findById(id);
    if (!survey) {
      return res.status(404).json({ message: 'Không tìm thấy biểu mẫu.' });
    }

    if (!assertCreator(survey, req.user.id)) {
      return res.status(403).json({ message: 'Không có quyền xóa biểu mẫu này.' });
    }

    await Response.deleteMany({ surveyId: survey._id });
    await Survey.deleteOne({ _id: survey._id });

    res.status(204).send();
  } catch (err) {
    console.error('deleteSurvey:', err);
    res.status(500).json({ message: 'Không thể xóa biểu mẫu.' });
  }
}

module.exports = {
  listSurveys,
  getSurveyById,
  createSurvey,
  getSurveyForEdit,
  updateSurvey,
  deleteSurvey,
};
