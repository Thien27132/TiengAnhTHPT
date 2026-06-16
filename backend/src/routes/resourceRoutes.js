const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    getAllResources, 
    getResourcesByTagId, 
    getRecommendedResources,
    createResource,
    deleteResource
} = require('../controllers/resourceController');

// Cấu hình multer để upload file PDF
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../public/documents'));
    },
    filename: (req, file, cb) => {
        // Xử lý tên file: bỏ dấu + thêm timestamp tránh trùng
        const nameWithoutExt = path.parse(file.originalname).name;
        const ext = path.parse(file.originalname).ext; // .pdf
        const safeName = nameWithoutExt
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .replace(/[^a-zA-Z0-9.\-_]/g, '-')
            .replace(/-+/g, '-')
            .toUpperCase();
        // Thêm timestamp để không bao giờ trùng tên
        const uniqueName = `${safeName}-${Date.now()}${ext.toUpperCase()}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file PDF'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // Tối đa 50MB
});

// Lấy tất cả tài liệu (hỗ trợ ?search=xxx)
router.get('/', getAllResources);

// Gợi ý tài liệu cho học sinh (dựa trên tag sai nhiều nhất)
router.get('/recommended', getRecommendedResources);

// Lấy tài liệu theo TagID
router.get('/by-tag/:tagId', getResourcesByTagId);

// Thêm tài liệu mới (upload PDF)
router.post('/', upload.single('file'), createResource);

// Xóa tài liệu
router.delete('/:id', deleteResource);

module.exports = router;
