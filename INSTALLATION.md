# 🚀 Hướng Dẫn Triển Khai Chức Năng Phân Tích Tỷ Lệ Sai

## 📋 Danh Sách Công Việc

### **1. DATABASE - Tạo Procedures**

Chạy các SQL procedures từ file `backend/src/queries/analysisQueries.sql`:

```sql
-- Procedures cần tạo:
- sp_GetErrorRateByTagSystem
- sp_GetErrorRateByTagStudent
- sp_CompareErrorRateWithAverage
- sp_RankStudentsByTag
- sp_StudentDistributionByErrorRate
- sp_GetStudentsFocusList
```

**Cách chạy:**
1. Mở SQL Server Management Studio
2. Chọn database `TiengAnhTHPT`
3. Mở file `backend/src/queries/analysisQueries.sql`
4. Nhấn F5 hoặc Ctrl+Shift+E để thực thi

---

### **2. BACKEND - Cài Đặt**

#### **Bước 1: Cập nhật các file**
✅ Đã cập nhật:
- `backend/server.js` - Thêm route `/api/analysis`
- `backend/src/routes/analysisRoutes.js` - Routes cho analysis
- `backend/src/controllers/analysisController.js` - Controllers

#### **Bước 2: Kiểm tra package.json**
Đảm bảo các dependencies đã cài đặt:
```json
{
  "mssql": "^9.0.0 hoặc cao hơn",
  "express": "^4.18.0 hoặc cao hơn"
}
```

Nếu chưa có, chạy:
```bash
cd backend
npm install mssql express
npm install
```

#### **Bước 3: Kiểm tra kết nối Database**
Đảm bảo file `.env` có:
```
DB_USER=your_username
DB_PASSWORD=your_password
DB_SERVER=localhost (hoặc server name)
DB_DATABASE=TiengAnhTHPT
PORT=5000
```

#### **Bước 4: Khởi động Backend**
```bash
cd backend
npm start
```

Kiểm tra console:
```
✅ Kết nối SQL Server thành công!
🚀 Server đang chạy tại: http://localhost:5000
```

---

### **3. FRONTEND - Cài Đặt**

#### **Bước 1: Cài Đặt Chart.js**
```bash
cd frontend
npm install chart.js react-chartjs-2
```

#### **Bước 2: Cập nhật App.js**
✅ Đã cập nhật:
- Import `AnalysisPage`
- Thêm route `/analysis`

#### **Bước 3: Tạo các Component**
✅ Đã tạo:
- `frontend/src/pages/AnalysisPage.js` - Component chính
- `frontend/src/pages/ErrorRateChart.js` - Biểu đồ tỷ lệ sai
- `frontend/src/pages/StudentRanking.js` - Xếp hạng học sinh
- `frontend/src/pages/DistributionChart.js` - Phân bố học sinh
- `frontend/src/pages/FocusList.js` - Danh sách cần focus
- `frontend/src/pages/AnalysisPage.css` - CSS

#### **Bước 4: Tạo API Client**
✅ Đã tạo:
- `frontend/src/api/analysisApi.js` - API calls

#### **Bước 5: Khởi động Frontend**
```bash
cd frontend
npm start
```

Truy cập: `http://localhost:3000/analysis`

---

## 🧪 Kiểm Tra Chức Năng

### **Test 1: API Analysis**

Chạy các request này bằng Postman hoặc curl:

```bash
# 1. Lấy tỷ lệ sai toàn hệ thống
curl http://localhost:5000/api/analysis/error-rate-system

# 2. Xếp hạng học sinh (không filter tag)
curl http://localhost:5000/api/analysis/rank-students

# 3. Xếp hạng theo tag cụ thể (TagID = 1)
curl http://localhost:5000/api/analysis/rank-students?tagId=1

# 4. Phân bố học sinh
curl http://localhost:5000/api/analysis/distribution

# 5. Danh sách học sinh cần focus
curl http://localhost:5000/api/analysis/focus-list
```

**Kết quả mong muốn:** HTTP 200 + JSON data

---

### **Test 2: Frontend UI**

1. **Đăng nhập bằng tài khoản Admin**
2. **Truy cập `/analysis`**
3. **Kiểm tra các Tab:**
   - 📈 Tỷ Lệ Sai - Hiển thị biểu đồ
   - 🏆 Xếp Hạng - Hiển thị bảng học sinh
   - 📊 Phân Bố - Hiển thị biểu đồ phân bố
   - ⭐ Cần Focus - Hiển thị danh sách

---

## 🐛 Troubleshooting

### **Lỗi: "Lỗi tải dữ liệu phân tích"**
- ✅ Kiểm tra Backend có chạy không
- ✅ Kiểm tra Database connection
- ✅ Kiểm tra procedures đã tạo chưa
- ✅ Kiểm tra CORS configuration

### **Lỗi: "Không có dữ liệu"**
- ✅ Kiểm tra có bài thi trong database không
- ✅ Kiểm tra kết quả thi (ExamResults)
- ✅ Kiểm tra tags được gán cho câu hỏi

### **Biểu đồ không hiển thị**
- ✅ Kiểm tra Chart.js đã cài đặt
- ✅ Kiểm tra Browser console có lỗi không
- ✅ Kiểm tra data format là mảng không

---

## 📁 File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── analysisController.js ✅
│   ├── routes/
│   │   └── analysisRoutes.js ✅
│   └── queries/
│       └── analysisQueries.sql ✅
└── server.js ✅ (Updated)

frontend/
├── src/
│   ├── api/
│   │   └── analysisApi.js ✅
│   ├── pages/
│   │   ├── AnalysisPage.js ✅
│   │   ├── ErrorRateChart.js ✅
│   │   ├── StudentRanking.js ✅
│   │   ├── DistributionChart.js ✅
│   │   ├── FocusList.js ✅
│   │   └── AnalysisPage.css ✅
│   └── App.js ✅ (Updated)
```

---

## 📊 API Endpoints

| Method | Endpoint | Mô Tả |
|--------|----------|-------|
| GET | `/api/analysis/error-rate-system` | Tỷ lệ sai toàn hệ thống |
| GET | `/api/analysis/error-rate-student` | Tỷ lệ sai từng học sinh |
| GET | `/api/analysis/compare-average` | So sánh với trung bình |
| GET | `/api/analysis/rank-students` | Xếp hạng học sinh |
| GET | `/api/analysis/distribution` | Phân bố theo mức độ |
| GET | `/api/analysis/focus-list` | Danh sách cần focus |

**Query Parameters:**
- `tagId` (optional): Lọc theo Tag
- `topCount` (optional): Số lượng trả về

---

## 🎓 Hướng Dẫn Sử Dụng Cho Admin

1. **Truy cập trang Analysis:** `/analysis`
2. **Xem biểu đồ tỷ lệ sai:** Tab "📈 Tỷ Lệ Sai"
3. **Xem xếp hạng học sinh:** Tab "🏆 Xếp Hạng"
4. **Phân tích phân bố:** Tab "📊 Phân Bố"
5. **Tìm học sinh cần focus:** Tab "⭐ Cần Focus"
6. **Lọc theo Tag:** Nhấp vào Tag trong bảng tỷ lệ sai

---

## 🔄 Cập Nhật Dữ Liệu

- Dữ liệu cập nhật **thời gian thực** từ database
- Khi có bài thi mới, nhấn **F5** để refresh
- Không cần khởi động lại server

---

## ✅ Checklist Triển Khai

- [ ] Tạo SQL Procedures
- [ ] Kiểm tra Database connection
- [ ] Cập nhật Backend files
- [ ] Chạy `npm install` (backend)
- [ ] Cài Chart.js (frontend)
- [ ] Cập nhật Frontend files
- [ ] Chạy `npm install` (frontend)
- [ ] Khởi động Backend: `npm start`
- [ ] Khởi động Frontend: `npm start`
- [ ] Truy cập `/analysis` và kiểm tra
- [ ] Test tất cả tabs
- [ ] Test API endpoints
- [ ] Kiểm tra Responsive design

---

**🎉 Hoàn tất! Chức năng phân tích tỷ lệ sai đã sẵn sàng sử dụng.**

Nếu có vấn đề, kiểm tra ANALYSIS_GUIDE.md để biết thêm chi tiết.
