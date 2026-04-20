const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');

// 1. Import routes
const authRoutes = require('./src/routes/auth');
const tagRoutes = require('./src/routes/tagRoutes'); 
const questionRoutes = require('./src/routes/questionRoutes');
const examRoutes = require('./src/routes/examRoutes');
const analysisRoutes = require('./src/routes/analysisRoutes');

const app = express();

// --- BỘ MIDDLEWARE (PHẢI ĐỂ LÊN ĐẦU) ---
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// --- CÁC ROUTE (ĐỂ SAU MIDDLEWARE) ---
app.use('/api/exams', examRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);

// Kết nối DB
connectDB();

app.get('/', (req, res) => {
    res.send('Server TiengAnhTHPT đã sẵn sàng!');
});

const PORT = process.env.PORT || 5000;

app.use((req, res) => {
    res.status(404).json({ message: "Đường dẫn không tồn tại!" });
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});

