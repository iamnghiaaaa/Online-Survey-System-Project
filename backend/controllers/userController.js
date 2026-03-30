const mongoose = require('mongoose');
const Survey = require('../models/Survey');
const Response = require('../models/Response');

async function mySurveys(req, res) {
  try {
    const surveys = await Survey.find({ creatorId: req.user.id })
      .select('title status isQuiz createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const payload = surveys.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      status: s.status,
      isQuiz: Boolean(s.isQuiz),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    res.json(payload);
  } catch (err) {
    console.error('mySurveys:', err);
    res.status(500).json({ message: 'Không thể tải danh sách biểu mẫu của bạn.' });
  }
}

async function myResponses(req, res) {
  try {
    const list = await Response.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('surveyId', 'title description isQuiz status')
      .lean();

    const payload = list.map((r) => {
      const surv = r.surveyId;
      return {
        responseId: r._id.toString(),
        surveyId: surv ? surv._id.toString() : null,
        survey: surv
          ? {
              title: surv.title,
              description: surv.description,
              isQuiz: Boolean(surv.isQuiz),
              status: surv.status,
            }
          : null,
        score: r.score,
        createdAt: r.createdAt,
      };
    });

    res.json(payload);
  } catch (err) {
    console.error('myResponses:', err);
    res.status(500).json({ message: 'Không thể tải lịch sử điền form.' });
  }
}

async function getMyResponseById(req, res) {
  try {
    const { responseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(responseId)) {
      return res.status(400).json({ message: 'ID không hợp lệ.' });
    }

    const responseDoc = await Response.findOne({
      _id: responseId,
      userId: req.user.id,
    }).lean();

    if (!responseDoc) {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi phản hồi.' });
    }

    const survey = await Survey.findById(responseDoc.surveyId).lean();
    if (!survey) {
      return res.status(404).json({ message: 'Biểu mẫu không còn tồn tại.' });
    }

    const qMap = new Map((survey.questions || []).map((q) => [q.questionId, q]));
    const items = (responseDoc.answers || []).map((a) => {
      const q = qMap.get(a.questionId);
      return {
        questionId: a.questionId,
        questionText: q ? q.text : '(Câu hỏi đã bị xóa hoặc đổi ID)',
        type: q ? q.type : null,
        answerValue: a.answerValue,
      };
    });

    res.json({
      responseId: responseDoc._id.toString(),
      surveyId: survey._id.toString(),
      surveyTitle: survey.title,
      surveyDescription: survey.description || '',
      isQuiz: Boolean(survey.isQuiz),
      score: responseDoc.score,
      submittedAt: responseDoc.createdAt,
      items,
    });
  } catch (err) {
    console.error('getMyResponseById:', err);
    res.status(500).json({ message: 'Không thể tải phản hồi.' });
  }
}

module.exports = { mySurveys, myResponses, getMyResponseById };
