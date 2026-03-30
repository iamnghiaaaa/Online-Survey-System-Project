const express = require('express');
const surveyController = require('../controllers/surveyController');
const responseController = require('../controllers/responseController');
const uploadController = require('../controllers/uploadController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { uploadImage, requireCloudinary } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/upload',
  verifyToken,
  requireCloudinary,
  uploadImage.single('file'),
  uploadController.uploadImage
);
router.post(
  '/upload-avatar',
  verifyToken,
  requireCloudinary,
  uploadImage.single('file'),
  uploadController.uploadAvatar
);

router.get('/surveys', surveyController.listSurveys);
router.post('/surveys', verifyToken, surveyController.createSurvey);

router.get('/surveys/:id/edit', verifyToken, surveyController.getSurveyForEdit);
router.delete('/surveys/:id', verifyToken, surveyController.deleteSurvey);
router.put('/surveys/:id', verifyToken, surveyController.updateSurvey);

router.get('/surveys/:id/responses/:responseId/summary', responseController.getResponseSummary);
router.get('/surveys/:id/responses', verifyToken, responseController.listResponses);
router.post('/surveys/:id/submit', optionalAuth, responseController.submitResponse);

router.get('/surveys/:id', optionalAuth, surveyController.getSurveyById);

module.exports = router;
