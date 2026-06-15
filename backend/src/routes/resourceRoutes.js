const express = require('express');
const router = express.Router();
const { 
    getAllResources, 
    getResourcesByTagId, 
    getRecommendedResources 
} = require('../controllers/resourceController');

// Lấy tất cả tài liệu
router.get('/', getAllResources);

// Gợi ý tài liệu cho học sinh (dựa trên tag sai nhiều nhất)
router.get('/recommended', getRecommendedResources);

// Lấy tài liệu theo TagID
router.get('/by-tag/:tagId', getResourcesByTagId);

module.exports = router;
