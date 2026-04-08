const sql = require('mssql');
const path = require('path');
// Chỉ định chính xác đường dẫn đến file .env ở thư mục gốc
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost', // Thêm 'localhost' dự phòng ở đây
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("✅ Kết nối SQL Server thành công!");
    } catch (err) {
        console.error("❌ Kết nối SQL Server thất bại: ", err.message);
    }
};

module.exports = { sql, connectDB };