const express = require('express');
const router = express.Router();
const { createQuestion, getAllQuestions } = require('../controllers/questionController');

// Khi gọi POST http://localhost:5000/api/questions
router.post('/', createQuestion); 
router.get('/', getAllQuestions); // Thêm dòng này để lấy danh sách

module.exports = router;