-- =====================================================
-- INSERT 43 tài liệu PDF vào bảng Resources
-- Mỗi record map 1 file PDF ↔ 1 TagID
-- AdminID (UploadedBy) = 1
-- =====================================================
-- Lưu ý: ContentURL là đường dẫn tương đối, 
-- backend sẽ serve qua static middleware tại /documents/

INSERT INTO Resources (Title, Type, ContentURL, TagID, UploadedBy, CreatedAt) VALUES
(N'Tài liệu ôn tập - Thì hiện tại đơn', 'pdf', '/documents/THI-HIEN-TAI-DON.pdf', 1, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì hiện tại tiếp diễn', 'pdf', '/documents/THI-HIEN-TAI-TIEP-DIEN.pdf', 2, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì hiện tại hoàn thành', 'pdf', '/documents/THI-HIEN-TAI-HOAN-THANH.pdf', 3, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì hiện tại hoàn thành tiếp diễn', 'pdf', '/documents/THI-HIEN-TAI-HOAN-THANH-TIEP-DIEN.pdf', 4, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì quá khứ đơn', 'pdf', '/documents/THI-QUA-KHU-DON.pdf', 5, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì quá khứ hoàn thành tiếp diễn', 'pdf', '/documents/THI-QUA-KHU-HOAN-THANH-TIEP-DIEN.pdf', 6, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì tương lai đơn', 'pdf', '/documents/THI-TUONG-LAI-DON.pdf', 7, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì quá khứ tiếp diễn', 'pdf', '/documents/THI-QUA-KHU-TIEP-DIEN.pdf', 8, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì quá khứ hoàn thành', 'pdf', '/documents/THI-QUA-KHU-HOAN-THANH.pdf', 9, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì tương lai tiếp diễn', 'pdf', '/documents/THI-TUONG-LAI-TIEP-DIEN.pdf', 10, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì tương lai hoàn thành', 'pdf', '/documents/THI-TUONG-LAI-HOAN-THANH.pdf', 11, 1, GETDATE()),
(N'Tài liệu ôn tập - Thì tương lai hoàn thành tiếp diễn', 'pdf', '/documents/THI-TUONG-LAI-HOAN-THANH-TIEP-DIEN.pdf', 12, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu so sánh', 'pdf', '/documents/CAU-SO-SANH.pdf', 13, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu điều kiện', 'pdf', '/documents/CAU-DIEU-KIEN.pdf', 14, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu điều ước', 'pdf', '/documents/CAU-DIEU-UOC.pdf', 15, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu giả định', 'pdf', '/documents/CAU-GIA-DINH.pdf', 16, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu chủ/bị động', 'pdf', '/documents/CAU-CHU-BI-DONG.pdf', 17, 1, GETDATE()),
(N'Tài liệu ôn tập - Mệnh đề quan hệ', 'pdf', '/documents/MENH-DE-QUAN-HE.pdf', 18, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu mệnh lệnh', 'pdf', '/documents/CAU-MENH-LENH.pdf', 19, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu hỏi đuôi', 'pdf', '/documents/CAU-HOI-DUOI.pdf', 20, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu đảo ngữ', 'pdf', '/documents/CAU-DAO-NGU.pdf', 21, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu tường thuật trực tiếp/gián tiếp', 'pdf', '/documents/CAU-TUONG-THUAT.pdf', 22, 1, GETDATE()),
(N'Tài liệu ôn tập - Đại từ', 'pdf', '/documents/DAI-TU.pdf', 23, 1, GETDATE()),
(N'Tài liệu ôn tập - Danh từ', 'pdf', '/documents/DANH-TU.pdf', 24, 1, GETDATE()),
(N'Tài liệu ôn tập - Tính từ', 'pdf', '/documents/TINH-TU.pdf', 25, 1, GETDATE()),
(N'Tài liệu ôn tập - Động từ', 'pdf', '/documents/DONG-TU.pdf', 26, 1, GETDATE()),
(N'Tài liệu ôn tập - Trạng từ', 'pdf', '/documents/TRANG-TU.pdf', 27, 1, GETDATE()),
(N'Tài liệu ôn tập - Lượng từ', 'pdf', '/documents/LUONG-TU.pdf', 28, 1, GETDATE()),
(N'Tài liệu ôn tập - Giới từ', 'pdf', '/documents/GIOI-TU.pdf', 29, 1, GETDATE()),
(N'Tài liệu ôn tập - Mạo từ', 'pdf', '/documents/MAO-TU.pdf', 30, 1, GETDATE()),
(N'Tài liệu ôn tập - Liên từ', 'pdf', '/documents/LIEN-TU.pdf', 31, 1, GETDATE()),
(N'Tài liệu ôn tập - Cụm từ cố định (Collocations)', 'pdf', '/documents/CUM-TU-CO-DINH.pdf', 32, 1, GETDATE()),
(N'Tài liệu ôn tập - Thành ngữ (Idioms)', 'pdf', '/documents/THANH-NGU.pdf', 33, 1, GETDATE()),
(N'Tài liệu ôn tập - Cụm động từ (Phrasal Verbs)', 'pdf', '/documents/CUM-DONG-TU.pdf', 34, 1, GETDATE()),
(N'Tài liệu ôn tập - Từ đồng nghĩa/trái nghĩa', 'pdf', '/documents/TU-DONG-NGHIA-TRAI-NGHIA.pdf', 35, 1, GETDATE()),
(N'Tài liệu ôn tập - Đọc điền từ (Cloze test)', 'pdf', '/documents/DOC-DIEN-TU.pdf', 36, 1, GETDATE()),
(N'Tài liệu ôn tập - Tìm ý chính đoạn văn', 'pdf', '/documents/TIM-Y-CHINH-DOAN-VAN.pdf', 37, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu hỏi chi tiết (According to the passage)', 'pdf', '/documents/CAU-HOI-CHI-TIET.pdf', 38, 1, GETDATE()),
(N'Tài liệu ôn tập - Câu hỏi suy luận (Inference)', 'pdf', '/documents/CAU-HOI-SUY-LUAN.pdf', 39, 1, GETDATE()),
(N'Tài liệu ôn tập - Tìm từ thay thế (Referent questions)', 'pdf', '/documents/TIM-TU-THAY-THE.pdf', 40, 1, GETDATE()),
(N'Tài liệu ôn tập - Tìm từ đồng nghĩa (Synonym questions)', 'pdf', '/documents/TIM-TU-DONG-NGHIA.pdf', 41, 1, GETDATE()),
(N'Tài liệu ôn tập - Tìm từ trái nghĩa (Opposite questions)', 'pdf', '/documents/TIM-TU-TRAI-NGHIA.pdf', 42, 1, GETDATE()),
(N'Tài liệu ôn tập - Sắp xếp câu và đoạn văn', 'pdf', '/documents/SAP-XEP-CAU-VA-DOAN-VAN.pdf', 43, 1, GETDATE());

-- Kiểm tra kết quả
SELECT r.ResourceID, r.Title, r.ContentURL, t.TagName 
FROM Resources r 
JOIN Tags t ON r.TagID = t.TagID 
ORDER BY r.TagID;
