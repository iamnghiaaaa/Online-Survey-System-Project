const mongoose = require('mongoose');
const crypto = require('crypto');

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      default: () => crypto.randomUUID(),
    },
    type: {
      type: String,
      enum: ['text', 'textarea', 'radio', 'checkbox'],
      required: true,
    },
    /** Nội dung HTML từ rich text editor */
    text: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    isRequired: { type: Boolean, default: false },
    /** Mỗi phần tử: { text, imageUrl } hoặc legacy string */
    options: { type: [mongoose.Schema.Types.Mixed], default: [] },
    correctAnswers: { type: [String], default: [] },
    points: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
    },
    isQuiz: { type: Boolean, default: false },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Survey', surveySchema);
