/**
 * Script INSERT 43 tài liệu PDF vào bảng Resources
 * Chạy 1 lần duy nhất: node seed_resources.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Mapping: TagID -> tên file PDF (khớp với file thực tế trong public/documents/)
const resourceMapping = [
    { tagId: 1, tagName: 'Thì hiện tại đơn', file: 'THI-HIEN-TAI-DON.pdf' },
    { tagId: 2, tagName: 'Thì hiện tại tiếp diễn', file: 'THI-HIEN-TAI-TIEP-DIEN.pdf' },
    { tagId: 3, tagName: 'Thì hiện tại hoàn thành', file: 'THI-HIEN-TAI-HOAN-THANH.pdf' },
    { tagId: 4, tagName: 'Thì hiện tại hoàn thành tiếp diễn', file: 'THI-HIEN-TAI-HOAN-THANH-TIEP-DIEN.pdf' },
    { tagId: 5, tagName: 'Thì quá khứ đơn', file: 'THI-QUA-KHU-DON.pdf' },
    { tagId: 6, tagName: 'Thì quá khứ hoàn thành tiếp diễn', file: 'THI-QUA-KHU-HOAN-THANH-TIEP-DIEN.pdf' },
    { tagId: 7, tagName: 'Thì tương lai đơn', file: 'THI-TUONG-LAI-DON.pdf' },
    { tagId: 8, tagName: 'Thì quá khứ tiếp diễn', file: 'THI-QUA-KHU-TIEP-DIEN.pdf' },
    { tagId: 9, tagName: 'Thì quá khứ hoàn thành', file: 'THI-QUA-KHU-HOAN-THANH.pdf' },
    { tagId: 10, tagName: 'Thì tương lai tiếp diễn', file: 'THI-TUONG-LAI-TIEP-DIEN.pdf' },
    { tagId: 11, tagName: 'Thì tương lai hoàn thành', file: 'THI-TUONG-LAI-GAN.pdf' }, // Dùng file TUONG-LAI-GAN thay thế vì không có file TUONG-LAI-HOAN-THANH
    { tagId: 12, tagName: 'Thì tương lai hoàn thành tiếp diễn', file: 'THI-TUONG-LAI-HOAN-THANH-TIEP-DIEN.pdf' },
    { tagId: 13, tagName: 'Câu so sánh', file: 'CAU-SO-SANH.pdf' },
    { tagId: 14, tagName: 'Câu điều kiện', file: 'CAU-DIEU-KIEN.pdf' },
    { tagId: 15, tagName: 'Câu điều ước', file: 'CAU-DIEU-UOC.pdf' },
    { tagId: 16, tagName: 'Câu giả định', file: 'CAU-GIA-DINH.pdf' },
    { tagId: 17, tagName: 'Câu chủ/bị động', file: 'CAU-CHU-BI-DONG.pdf' },
    { tagId: 18, tagName: 'Mệnh đề quan hệ', file: 'MENH-DE-QUAN-HE.pdf' },
    { tagId: 19, tagName: 'Câu mệnh lệnh', file: 'CAU-MENH-LENH.pdf' },
    { tagId: 20, tagName: 'Câu hỏi đuôi', file: 'CAU-HOI-DUOI.pdf' },
    { tagId: 21, tagName: 'Câu đảo ngữ', file: 'CAU-DAO-NGU.pdf' },
    { tagId: 22, tagName: 'Câu tường thuật trực tiếp/gián tiếp', file: 'CAU-TUONG-THUAT.pdf' },
    { tagId: 23, tagName: 'Đại từ', file: 'DAI-TU.pdf' },
    { tagId: 24, tagName: 'Danh từ', file: 'DANH-TU.pdf' },
    { tagId: 25, tagName: 'Tính từ', file: 'TINH-TU.pdf' },
    { tagId: 26, tagName: 'Động từ', file: 'DONG-TU.pdf' },
    { tagId: 27, tagName: 'Trạng từ', file: 'TRANG-TU.pdf' },
    { tagId: 28, tagName: 'Lượng từ', file: 'LUONG-TU.pdf' },
    { tagId: 29, tagName: 'Giới từ', file: 'GIOI-TU.pdf' },
    { tagId: 30, tagName: 'Mạo từ', file: 'MAO-TU.pdf' },
    { tagId: 31, tagName: 'Liên từ', file: 'LIEN-TU.pdf' },
    { tagId: 32, tagName: 'Cụm từ cố định (Collocations)', file: 'CUM-TU-CO-DINH.pdf' },
    { tagId: 33, tagName: 'Thành ngữ (Idioms)', file: 'THANH-NGU.pdf' },
    { tagId: 34, tagName: 'Cụm động từ (Phrasal Verbs)', file: 'CUM-DONG-TU.pdf' },
    { tagId: 35, tagName: 'Từ đồng nghĩa/trái nghĩa', file: 'TU-DONG-NGHIA-TRAI-NGHIA.pdf' },
    { tagId: 36, tagName: 'Đọc điền từ (Cloze test)', file: 'DOC-DIEN-TU.pdf' },
    { tagId: 37, tagName: 'Tìm ý chính đoạn văn', file: 'TIM-Y-CHINH-DOAN-VAN.pdf' },
    { tagId: 38, tagName: 'Câu hỏi chi tiết (According to the passage)', file: 'CAU-HOI-CHI-TIET.pdf' },
    { tagId: 39, tagName: 'Câu hỏi suy luận (Inference)', file: 'CAU-HOI-SUY-LUAN.pdf' },
    { tagId: 40, tagName: 'Tìm từ thay thế (Referent questions)', file: 'TIM-TU-THAY-THE.pdf' },
    { tagId: 41, tagName: 'Tìm từ đồng nghĩa (Synonym questions)', file: 'TIM-TU-DONG-NGHIA.pdf' },
    { tagId: 42, tagName: 'Tìm từ trái nghĩa (Opposite questions)', file: 'TIM-TU-TRAI-NGHIA.pdf' },
    { tagId: 43, tagName: 'Sắp xếp câu và đoạn văn', file: 'SAP-XEP-CAU-VA-DOAN-VAN.pdf' },
];

async function seedResources() {
    try {
        console.log('🔌 Đang kết nối database...');
        await sql.connect(config);
        console.log('✅ Kết nối thành công!');

        // Kiểm tra xem bảng Resources đã có dữ liệu chưa
        const existingCount = await sql.query`SELECT COUNT(*) AS cnt FROM Resources`;
        const count = existingCount.recordset[0].cnt;
        
        if (count > 0) {
            console.log(`⚠️  Bảng Resources đã có ${count} records.`);
            console.log('🗑️  Đang xóa dữ liệu cũ...');
            await sql.query`DELETE FROM Resources`;
            console.log('✅ Đã xóa dữ liệu cũ.');
        }

        console.log('📝 Đang INSERT 43 tài liệu...');
        let successCount = 0;
        let errorCount = 0;

        for (const item of resourceMapping) {
            try {
                const request = new sql.Request();
                request.input('Title', sql.NVarChar(200), `Tài liệu ôn tập - ${item.tagName}`);
                request.input('Type', sql.NVarChar(50), 'pdf');
                request.input('ContentURL', sql.NVarChar(sql.MAX), `/documents/${item.file}`);
                request.input('TagID', sql.Int, item.tagId);
                request.input('UploadedBy', sql.Int, 1); // AdminID = 1

                await request.query`
                    INSERT INTO Resources (Title, Type, ContentURL, TagID, UploadedBy, CreatedAt)
                    VALUES (@Title, @Type, @ContentURL, @TagID, @UploadedBy, GETDATE())`;

                successCount++;
                console.log(`  ✅ [${item.tagId}] ${item.tagName} → ${item.file}`);
            } catch (err) {
                errorCount++;
                console.error(`  ❌ [${item.tagId}] ${item.tagName}: ${err.message}`);
            }
        }

        console.log('\n========================================');
        console.log(`📊 Kết quả: ${successCount} thành công, ${errorCount} lỗi`);
        console.log('========================================');

        // Kiểm tra lại
        const verifyResult = await sql.query`
            SELECT r.ResourceID, r.Title, r.ContentURL, t.TagName 
            FROM Resources r 
            JOIN Tags t ON r.TagID = t.TagID 
            ORDER BY r.TagID`;
        
        console.log(`\n📋 Tổng số records trong bảng Resources: ${verifyResult.recordset.length}`);
        verifyResult.recordset.forEach(row => {
            console.log(`  [${row.ResourceID}] ${row.TagName} → ${row.ContentURL}`);
        });

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await sql.close();
        console.log('\n🔌 Đã đóng kết nối database.');
        process.exit(0);
    }
}

seedResources();
