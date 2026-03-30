require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');
const Survey = require('./models/Survey');
const Response = require('./models/Response');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment (.env)');
  process.exit(1);
}

const SALT = 10;

function opt(text, imageUrl = '') {
  return { text, imageUrl };
}

async function seed() {
  await mongoose.connect(MONGODB_URI);

  await Response.deleteMany({});
  await Survey.deleteMany({});
  await User.deleteMany({});
  console.log('Cleared Response, Survey, User collections');

  const hash = await bcrypt.hash('password123', SALT);
  const [admin, product] = await User.insertMany([
    { name: 'Admin Demo', email: 'admin@example.com', password: hash },
    { name: 'Product Owner', email: 'product@example.com', password: hash },
  ]);
  console.log('Users: admin@example.com / password123, product@example.com / password123');

  const surveySimple = {
    title: 'Phản hồi nhanh',
    description: 'Form chỉ gồm câu hỏi dạng văn bản.',
    creatorId: admin._id,
    status: 'published',
    isQuiz: false,
    questions: [
      {
        questionId: 'simple-q1-name',
        type: 'text',
        text: '<p>Họ và tên của bạn là gì?</p>',
        imageUrl: '',
        isRequired: true,
        options: [],
        correctAnswers: [],
        points: 0,
      },
      {
        questionId: 'simple-q2-note',
        type: 'textarea',
        text: '<p>Bạn muốn chia sẻ thêm điều gì?</p>',
        imageUrl: '',
        isRequired: false,
        options: [],
        correctAnswers: [],
        points: 0,
      },
    ],
  };

  const surveyComplex = {
    title: 'Khảo sát trải nghiệm sản phẩm',
    description: 'Kết hợp text, textarea, radio và checkbox.',
    creatorId: product._id,
    status: 'published',
    isQuiz: false,
    questions: [
      {
        questionId: 'complex-q1-email',
        type: 'text',
        text: '<p>Email liên hệ</p>',
        imageUrl: '',
        isRequired: true,
        options: [],
        correctAnswers: [],
        points: 0,
      },
      {
        questionId: 'complex-q2-satisfaction',
        type: 'radio',
        text: '<p>Mức độ hài lòng chung?</p>',
        imageUrl: '',
        isRequired: true,
        options: [
          opt('Rất hài lòng'),
          opt('Hài lòng'),
          opt('Bình thường'),
          opt('Không hài lòng'),
        ],
        correctAnswers: [],
        points: 0,
      },
      {
        questionId: 'complex-q3-topics',
        type: 'checkbox',
        text: '<p>Bạn quan tâm chủ đề nào? (chọn nhiều)</p>',
        imageUrl: '',
        isRequired: false,
        options: [opt('Web'), opt('Mobile'), opt('DevOps'), opt('Data')],
        correctAnswers: [],
        points: 0,
      },
      {
        questionId: 'complex-q4-suggestion',
        type: 'textarea',
        text: '<p>Góp ý cải thiện</p>',
        imageUrl: '',
        isRequired: false,
        options: [],
        correctAnswers: [],
        points: 0,
      },
    ],
  };

  const surveyQuiz = {
    title: 'Quiz kiến thức chung (mẫu)',
    description: 'Bài kiểm tra ngắn có chấm điểm.',
    creatorId: admin._id,
    status: 'published',
    isQuiz: true,
    questions: [
      {
        questionId: 'quiz-q1-capital',
        type: 'radio',
        text: '<p>Thủ đô của Việt Nam là gì?</p>',
        imageUrl: '',
        isRequired: true,
        options: [opt('Hà Nội'), opt('TP.HCM'), opt('Đà Nẵng'), opt('Huế')],
        correctAnswers: ['Hà Nội'],
        points: 2,
      },
      {
        questionId: 'quiz-q2-stack',
        type: 'checkbox',
        text: '<p>Công nghệ nào thuộc MERN? (chọn tất cả đúng)</p>',
        imageUrl: '',
        isRequired: true,
        options: [
          opt('MongoDB'),
          opt('Express'),
          opt('React'),
          opt('PostgreSQL'),
        ],
        correctAnswers: ['MongoDB', 'Express', 'React'],
        points: 3,
      },
    ],
  };

  const [s1, s2, s3] = await Survey.insertMany([surveySimple, surveyComplex, surveyQuiz]);
  console.log('Inserted surveys:', s1._id.toString(), s2._id.toString(), s3._id.toString());

  const responses = [
    {
      surveyId: s1._id,
      userId: null,
      respondentEmail: '',
      score: null,
      answers: [
        { questionId: 'simple-q1-name', answerValue: 'Nguyễn Văn A' },
        { questionId: 'simple-q2-note', answerValue: 'Giao diện dễ nhìn.' },
      ],
    },
    {
      surveyId: s1._id,
      userId: null,
      respondentEmail: '',
      score: null,
      answers: [
        { questionId: 'simple-q1-name', answerValue: 'Trần Thị B' },
        { questionId: 'simple-q2-note', answerValue: '' },
      ],
    },
    {
      surveyId: s2._id,
      userId: null,
      respondentEmail: '',
      score: null,
      answers: [
        { questionId: 'complex-q1-email', answerValue: 'user1@example.com' },
        { questionId: 'complex-q2-satisfaction', answerValue: 'Rất hài lòng' },
        {
          questionId: 'complex-q3-topics',
          answerValue: ['Web', 'Data'],
        },
        {
          questionId: 'complex-q4-suggestion',
          answerValue: 'Thêm dark mode.',
        },
      ],
    },
    {
      surveyId: s2._id,
      userId: null,
      respondentEmail: '',
      score: null,
      answers: [
        { questionId: 'complex-q1-email', answerValue: 'user2@example.com' },
        { questionId: 'complex-q2-satisfaction', answerValue: 'Bình thường' },
        {
          questionId: 'complex-q3-topics',
          answerValue: ['Mobile'],
        },
        {
          questionId: 'complex-q4-suggestion',
          answerValue: 'Ổn định hơn khi offline.',
        },
      ],
    },
    {
      surveyId: s2._id,
      userId: null,
      respondentEmail: '',
      score: null,
      answers: [
        { questionId: 'complex-q1-email', answerValue: 'user3@example.com' },
        { questionId: 'complex-q2-satisfaction', answerValue: 'Hài lòng' },
        {
          questionId: 'complex-q3-topics',
          answerValue: ['Web', 'Mobile', 'DevOps'],
        },
        {
          questionId: 'complex-q4-suggestion',
          answerValue: '',
        },
      ],
    },
    {
      surveyId: s3._id,
      userId: admin._id,
      respondentEmail: admin.email,
      score: 5,
      answers: [
        { questionId: 'quiz-q1-capital', answerValue: 'Hà Nội' },
        {
          questionId: 'quiz-q2-stack',
          answerValue: ['MongoDB', 'Express', 'React'],
        },
      ],
    },
  ];

  await Response.insertMany(responses);
  console.log(`Inserted ${responses.length} responses`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
