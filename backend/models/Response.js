const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    answerValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    respondentEmail: { type: String, default: '', trim: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: null },
  },
  { timestamps: true }
);

responseSchema.index({ surveyId: 1, userId: 1 });

module.exports = mongoose.model('Response', responseSchema);
