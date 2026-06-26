const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "Thiếu Token!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Trong này có cả userId và role
        next();
    } catch (err) {
        res.status(403).json({ message: "Token không hợp lệ!" });
    }
};

// Middleware kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: "Chỉ Admin mới có quyền này!" });
    }
    next();
};

module.exports = { verifyToken, isAdmin };