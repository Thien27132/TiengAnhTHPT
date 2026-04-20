# 📊 Hướng Dẫn Chức Năng Phân Tích Tỷ Lệ Sai Theo Tag

## 📌 Tổng Quan

Chức năng này cho phép **Admin** phân tích tỷ lệ sai của **toàn bộ học sinh** theo từng **Tag** (chủ đề). Dữ liệu được trình bày dưới dạng biểu đồ, bảng xếp hạng và danh sách học sinh cần hỗ trợ.

---

## 🎯 Các Tính Năng Chính

### 1️⃣ **Biểu Đồ Tỷ Lệ Sai Toàn Hệ Thống**
- Hiển thị tỷ lệ sai của mỗi **Tag** dưới dạng biểu đồ cột
- So sánh tỷ lệ sai vs tỷ lệ đúng
- Phân loại Tag theo độ khó: **Khó (>50%), Trung bình (30-50%), Dễ (<30%)**

**API Endpoint:**
```
GET /api/analysis/error-rate-system
```

**Dữ liệu trả về:**
```json
[
  {
    "TagID": 1,
    "TagName": "Cloze test",
    "TotalQuestions": 150,
    "TotalAttempts": 450,
    "UniqueStudents": 30,
    "IncorrectCount": 180,
    "CorrectCount": 270,
    "ErrorRate": 40.00,
    "SuccessRate": 60.00
  }
]
```

---

### 2️⃣ **Xếp Hạng Học Sinh Theo Tag**
- Xếp hạng học sinh từ **tốt → xấu** theo từng Tag
- Hiển thị số câu hỏi đúng/sai của mỗi học sinh
- Tỷ lệ sai cá nhân được highlight với màu sắc:
  - 🟢 **Xanh**: Tốt (<30% sai)
  - 🟡 **Vàng**: Trung bình (30-60%)
  - 🔴 **Đỏ**: Yếu (>60%)

**API Endpoint:**
```
GET /api/analysis/rank-students?tagId=1
```

**Dữ liệu trả về:**
```json
{
  "1": {
    "tagName": "Cloze test",
    "rankings": [
      {
        "Rank": 1,
        "StudentID": 5,
        "UserName": "Nguyễn Văn A",
        "TagID": 1,
        "TagName": "Cloze test",
        "TotalAttempted": 20,
        "CorrectCount": 18,
        "IncorrectCount": 2,
        "ErrorRate": 10.00
      }
    ]
  }
}
```

---

### 3️⃣ **Phân Bố Học Sinh Theo Mức Độ**
- Biểu đồ cột + Doughnut cho mỗi Tag
- Nhóm học sinh theo **khoảng tỷ lệ sai**:
  - 💪 Xuất sắc: < 20% sai
  - ⭐ Tốt: 20-40% sai
  - 👍 Khá: 40-60% sai
  - ⚠️ Yếu: 60-80% sai
  - 🔴 Rất yếu: > 80% sai

**API Endpoint:**
```
GET /api/analysis/distribution?tagId=1
```

**Dữ liệu trả về:**
```json
{
  "1": {
    "tagName": "Cloze test",
    "distribution": [
      {
        "errorGroup": "Xuất sắc (< 20%)",
        "studentCount": 8,
        "percentage": 26.67
      },
      {
        "errorGroup": "Tốt (20-40%)",
        "studentCount": 12,
        "percentage": 40.00
      }
    ]
  }
}
```

---

### 4️⃣ **Danh Sách Học Sinh Cần Focus**
- **⭐ Xuất Sắc**: Những học sinh có tỷ lệ sai < 30%
- **🔴 Cần Hỗ Trợ**: Những học sinh có tỷ lệ sai > 70%

Admin có thể nhanh chóng xác định:
- Học sinh nào cần khen thưởng
- Học sinh nào cần hỗ trợ thêm

**API Endpoint:**
```
GET /api/analysis/focus-list?tagId=1&topCount=5
```

**Dữ liệu trả về:**
```json
{
  "1": {
    "tagName": "Cloze test",
    "excellent": [
      {
        "StudentID": 5,
        "UserName": "Nguyễn Văn A",
        "ErrorRate": 10.00,
        "Status": "⭐ Xuất sắc"
      }
    ],
    "needSupport": [
      {
        "StudentID": 8,
        "UserName": "Trần Thị B",
        "ErrorRate": 85.00,
        "Status": "🔴 Cần hỗ trợ"
      }
    ]
  }
}
```

---

## 🛠️ Cách Sử Dụng

### **Bước 1: Truy Cập Trang Phân Tích**
- Đăng nhập bằng tài khoản **Admin**
- Nhấp vào menu **"📊 Phân Tích Tỷ Lệ Sai"** hoặc vào URL `/analysis`

### **Bước 2: Chọn Tab Muốn Xem**
- 📈 **Tỷ Lệ Sai**: Biểu đồ tổng quát
- 🏆 **Xếp Hạng**: Xếp hạng học sinh
- 📊 **Phân Bố**: Phân bố theo mức độ
- ⭐ **Cần Focus**: Danh sách cần chú ý

### **Bước 3: Lọc Theo Tag (Tùy Chọn)**
- Nhấp vào một Tag trong bảng tỷ lệ sai
- Các tab khác sẽ cập nhật để chỉ hiển thị dữ liệu của Tag đó

### **Bước 4: Phân Tích & Hành Động**
- Xem tỷ lệ sai của mỗi Tag
- Xác định học sinh xuất sắc để khen thưởng
- Xác định học sinh yếu để hỗ trợ thêm
- Tổ chức buổi dạy thêm cho các chủ đề khó

---

## 📈 Ví Dụ Thực Tế

### **Scenario: Phân tích Tag "Mệnh đề quan hệ"**

1. **Từ biểu đồ tỷ lệ sai:**
   - Mệnh đề quan hệ: **55% sai** → Tag khó, cần chú ý

2. **Từ xếp hạng học sinh:**
   - Top 3 học sinh tốt nhất: Có thể làm bạn hướng dẫn
   - Bottom 5 học sinh yếu nhất: Cần dạy thêm

3. **Từ phân bố:**
   - 30% học sinh xuất sắc
   - 40% học sinh trung bình
   - 30% học sinh yếu
   → Cân nhắc dạy lại toàn bộ lớp

4. **Từ danh sách focus:**
   - 5 học sinh xuất sắc: Cho làm tài liệu tham khảo
   - 5 học sinh cần hỗ trợ: Tổ chức buổi học thêm

---

## 🔧 Kỹ Thuật Phía Backend

### **SQL Procedures Được Sử Dụng:**

1. `sp_GetErrorRateByTagSystem` - Tỷ lệ sai toàn hệ thống
2. `sp_RankStudentsByTag` - Xếp hạng học sinh
3. `sp_StudentDistributionByErrorRate` - Phân bố học sinh
4. `sp_GetStudentsFocusList` - Danh sách focus

### **Database Schema:**

```sql
-- Bảng chính liên quan
- ResultDetail (Chi tiết kết quả làm bài)
  - ResultID
  - QuestionID
  - IsCorrect (1 = Đúng, 0 = Sai)

- Question_Tags (Liên kết giữa câu hỏi và tag)
  - QuestionID
  - TagID

- Tags (Danh sách tag/chủ đề)
  - TagID
  - TagName

- ExamResults (Kết quả bài thi)
  - ResultID
  - StudentID
  - ExamID
```

---

## 💡 Gợi Ý Sử Dụng

### ✅ **Nên Làm**
- Kiểm tra tỷ lệ sai hàng tuần/hàng tháng
- Tập trung vào các Tag có tỷ lệ sai > 50%
- Khen thưởng học sinh xuất sắc
- Lập kế hoạch dạy thêm dựa trên dữ liệu

### ❌ **Không Nên Làm**
- Quá lo lắng với những Tag có tỷ lệ sai 40-50%
- Xem xét chỉ kết quả từ 1-2 học sinh
- Bỏ qua những học sinh cần hỗ trợ

---

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra xem đã có dữ liệu câu hỏi & kết quả thi chưa
2. Xác nhận các Tags đã được gán cho câu hỏi
3. Kiểm tra kết nối Database
4. Liên hệ team phát triển nếu lỗi vẫn tiếp diễn

---

**Cập nhật lần cuối:** 20/04/2026
