const express = require('express');
const router = express.Router();
const { createExam, submitExam, getAllExams, getExamDetail } = require('../controllers/examController');

// Khi gọi POST http://localhost:5000/api/exams/generate
router.post('/generate', createExam);
// Khi gọi POST http://localhost:5000/api/exams/submit
router.post('/submit', submitExam);

router.get('/', getAllExams); // GET /api/exams
router.get('/:id', getExamDetail); // GET /api/exams/5

module.exports = router;