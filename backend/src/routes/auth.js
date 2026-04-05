const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// SỬA DÒNG NÀY: Thêm { } để lấy lẻ từng hàm từ Object export ra
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Đường dẫn: POST http://localhost:5000/api/auth/register
router.post('/register', register);

// Đường dẫn: POST http://localhost:5000/api/auth/login
router.post('/login', login);

// Route cho tất cả User đã đăng nhập (Học sinh & Admin)
router.get('/me', verifyToken, (req, res) => {
    res.json({ message: "Chào mừng bạn trở lại!", user: req.user });
});

// THÊM THỬ 1 ROUTE: Chỉ Admin mới được vào (Dùng để test isAdmin)
router.get('/admin-dashboard', verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Chào Sếp! Đây là bảng điều khiển của Admin." });
});

module.exports = router;