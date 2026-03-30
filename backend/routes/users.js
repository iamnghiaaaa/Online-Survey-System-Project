const express = require('express');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/my-surveys', verifyToken, userController.mySurveys);
router.get('/my-responses', verifyToken, userController.myResponses);
router.get('/my-responses/:responseId', verifyToken, userController.getMyResponseById);

module.exports = router;
