const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Bản đồ năng lực cá nhân của học sinh
router.get('/student-skill-map', analysisController.getStudentSkillMap);

// Tiến độ điểm số của học sinh theo đề thi
router.get('/student-progress', analysisController.getStudentProgress);

// Danh sách chi tiết câu trả lời sai kèm theo Tag
router.get('/incorrect-answers', analysisController.getIncorrectAnswersWithTags);

module.exports = router;
