const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Tỷ lệ sai theo tag (Toàn hệ thống)
router.get('/error-rate-system', analysisController.getErrorRateByTagSystem);

// Tỷ lệ sai theo tag (Chi tiết từng học sinh hoặc tất cả)
router.get('/error-rate-student', analysisController.getErrorRateByTagStudent);

// So sánh tỷ lệ sai với trung bình
router.get('/compare-average', analysisController.compareErrorRateWithAverage);

// Xếp hạng học sinh theo tag
router.get('/rank-students', analysisController.rankStudentsByTag);

// Phân bố học sinh theo mức độ
router.get('/distribution', analysisController.getStudentDistributionByErrorRate);

// Danh sách học sinh cần focus
router.get('/focus-list', analysisController.getStudentsFocusList);

// Bản đồ năng lực cá nhân của học sinh
router.get('/student-skill-map', analysisController.getStudentSkillMap);

// Tiến độ điểm số của học sinh theo đề thi
router.get('/student-progress', analysisController.getStudentProgress);

// Danh sách chi tiết câu trả lời sai kèm theo Tag
router.get('/incorrect-answers', analysisController.getIncorrectAnswersWithTags);

module.exports = router;
