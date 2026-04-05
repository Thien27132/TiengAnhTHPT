const express = require('express');
const router = express.Router();
const { getAllTags, createTag } = require('../controllers/tagController');
// const { authMiddleware, adminMiddleware } = require('../middlewares/auth'); // Nếu bạn đã làm ở tuần 4

router.get('/', getAllTags);
router.post('/', createTag); // Sau này nhớ thêm adminMiddleware vào đây

module.exports = router;