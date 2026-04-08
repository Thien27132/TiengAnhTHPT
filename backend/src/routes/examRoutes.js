const express = require('express');
const router = express.Router();
const { createExam, submitExam, getAllExams, getExamDetail, deleteExam, getStudentExamHistory, getExamResultDetail } = require('../controllers/examController');

// Khi gọi POST http://localhost:5000/api/exams/generate
router.post('/generate', createExam);
// Khi gọi POST http://localhost:5000/api/exams/submit
router.post('/submit', submitExam);

router.get('/', getAllExams); // GET /api/exams
// Specific routes BEFORE generic :id route
router.get('/student/:studentId/results', getStudentExamHistory); // GET /api/exams/student/:studentId/results
router.get('/result/:resultId', getExamResultDetail); // GET /api/exams/result/:resultId
router.get('/:id', getExamDetail); // GET /api/exams/5
router.delete('/:id', deleteExam); // DELETE /api/exams/5

module.exports = router;