const express = require('express');
const router = express.Router();
const { getAllTags, createTag } = require('../controllers/tagController');


router.get('/', getAllTags);
router.post('/', createTag); 

module.exports = router;