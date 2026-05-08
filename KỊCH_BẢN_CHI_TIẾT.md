# KỊCH BẢN CHI TIẾT - HỆ THỐNG QUẢN LÝ ÔN LUYỆN TIẾNG ANH THPT

## 2.3.3 KỊCH BẢN CHO CÁC CHỨC NĂNG CỦA QUẢN TRỊ VIÊN

---

## 1. QUẢN LÝ CÂUHỎI

### 1.1 Thêm Câu Hỏi Mới

**Use case:** Thêm câu hỏi mới vào ngân hàng câu hỏi

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công vào hệ thống quản trị
- Admin có quyền truy cập mục "Quản lý câu hỏi"
- Hệ thống có ít nhất một Tag kiến thức được định nghĩa

**Hậu điều kiện:**
- Câu hỏi mới được lưu chính xác vào cơ sở dữ liệu với đủ thông tin
- Câu hỏi có thể được sử dụng trong việc tạo đề thi
- Admin nhận được thông báo xác nhận thành công

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin truy cập mục "Quản lý câu hỏi" trên thanh điều hướng | Admin | Hệ thống hiển thị giao diện quản lý câu hỏi, danh sách các câu hỏi hiện có với 20 câu/trang |
| 2 | Admin nhìn thấy danh sách câu hỏi và các nút: "Thêm câu hỏi", bộ lọc (nội dung, độ khó, Tag) | Admin | Hiển thị các nút chức năng: Thêm, Sửa, Xóa; Hiển thị bộ lọc và thanh tìm kiếm |
| 3 | Admin click vào nút "Thêm câu hỏi" | Admin | Hệ thống mở form thêm câu hỏi với các trường: Nội dung câu hỏi (*), 4 phương án (A,B,C,D) (*), Đáp án đúng (*), Mức độ khó (*), Tag kiến thức (*), Ghi chú (tuỳ chọn) |
| 4 | Admin điền nội dung câu hỏi (VD: "Which word has the correct pronunciation?") | Admin | Form cập nhật liên tục, cho phép paste dài, hỗ trợ định dạng văn bản cơ bản |
| 5 | Admin nhập các phương án A, B, C, D (VD: A. /tæks/, B. /tɛks/, C. /tɪks/, D. /tʊks/) | Admin | Hiển thị 4 trường input phương án, có icon xóa nhanh từng phương án |
| 6 | Admin chọn phương án đúng bằng radio button (VD: Chọn phương án A) | Admin | Hệ thống highlight phương án được chọn làm đáp án đúng |
| 7 | Admin chọn mức độ khó từ dropdown (Dễ / Trung bình / Khó) | Admin | Dropdown mở ra 3 lựa chọn, Admin chọn một |
| 8 | Admin chọn các Tag kiến thức liên quan (VD: #ReadingComprehension, #Vocabulary, #Grammar) | Admin | Hệ thống hiển thị danh sách Tag có sẵn, cho phép chọn nhiều Tag (checkbox hoặc multi-select) |
| 9 | Admin điền thêm ghi chú (tuỳ chọn) nếu cần | Admin | Trường ghi chú được cập nhật |
| 10 | Admin click nút "Lưu câu hỏi" | Admin | Hệ thống validate dữ liệu |
| 11 | - | Hệ thống | Kiểm tra: các trường bắt buộc có giá trị không?, đáp án đúng có hợp lệ không?, Tag được chọn có tồn tại không? |
| 12 | - | Hệ thống | Nếu hợp lệ: lưu câu hỏi vào CSDL, trả về ID câu hỏi, hiển thị thông báo "Thêm câu hỏi thành công" (popup xanh) |
| 13 | Admin nhìn thấy thông báo thành công | Admin | Form được reset, quay trở lại danh sách câu hỏi, câu hỏi mới xuất hiện ở đầu danh sách |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 6.1 | Admin để trống trường "Nội dung câu hỏi" | Hiển thị cảnh báo màu đỏ dưới trường với chữ "Nội dung câu hỏi không được để trống" | Form không được submit, Admin phải nhập dữ liệu |
| 6.2 | Admin để trống một hoặc nhiều phương án (A, B, C, D) | Hiển thị cảnh báo: "Tất cả 4 phương án phải được điền đầy đủ" | Form không được submit |
| 6.3 | Admin không chọn đáp án đúng | Hiển thị cảnh báo: "Vui lòng chọn phương án đúng" | Form không được submit |
| 6.4 | Admin không chọn mức độ khó | Hiển thị cảnh báo: "Vui lòng chọn mức độ khó" | Form không được submit |
| 6.5 | Admin không gắn bất kỳ Tag nào | Hiển thị cảnh báo màu cam: "Vui lòng gắn ít nhất một Tag kiến thức để câu hỏi có thể được sử dụng trong hệ gợi ý" | Form vẫn có thể submit nhưng hiển thị cảnh báo |
| 6.6 | Lỗi kết nối cơ sở dữ liệu khi lưu | Hiển thị thông báo lỗi: "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau" | Form giữ nguyên dữ liệu đã nhập, Admin có thể thử lại |
| 6.7 | Admin click "Hủy" trước khi lưu | Hệ thống hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn hủy bỏ? Dữ liệu sẽ không được lưu." | Nếu xác nhận: quay về danh sách; Nếu hủy: tiếp tục form |

---

### 1.2 Sửa Câu Hỏi Hiện Có

**Use case:** Cập nhật, chỉnh sửa thông tin câu hỏi đã tồn tại

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Tồn tại ít nhất một câu hỏi trong hệ thống
- Admin đang ở giao diện danh sách câu hỏi

**Hậu điều kiện:**
- Thông tin câu hỏi được cập nhật chính xác trong cơ sở dữ liệu
- Những đề thi sử dụng câu hỏi này có thể được tự động cập nhật nếu cần thiết
- Admin nhận được thông báo xác nhận sửa thành công

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin đang ở danh sách câu hỏi | Admin | Danh sách hiển thị với mỗi hàng có thông tin: ID, Nội dung (tóm tắt), Độ khó, Tags, Ngày tạo, và các nút: Xem, Sửa, Xóa |
| 2 | Admin click vào nút "Sửa" ở hàng câu hỏi muốn chỉnh sửa | Admin | Hệ thống mở form sửa câu hỏi với tất cả các trường được điền sẵn thông tin hiện tại |
| 3 | Form sửa hiển thị đầy đủ: Nội dung câu, 4 phương án, đáp án đúng (được đánh dấu), mức độ khó, Tags đã chọn, ghi chú | Hệ thống | Các trường có thể chỉnh sửa, các nút: "Cập nhật", "Hủy" |
| 4 | Admin chỉnh sửa nội dung câu hỏi (nếu cần) | Admin | Form cập nhật liên tục |
| 5 | Admin chỉnh sửa một hoặc nhiều phương án (nếu cần) | Admin | Các trường phương án được cập nhật |
| 6 | Admin thay đổi đáp án đúng (nếu cần) bằng radio button | Admin | Phương án đúng mới được highlight |
| 7 | Admin thay đổi mức độ khó (nếu cần) | Admin | Dropdown cập nhật |
| 8 | Admin thêm/bỏ Tags (nếu cần) | Admin | Multi-select Tags được cập nhật, hỗ trợ chọn thêm hoặc bỏ chọn |
| 9 | Admin chỉnh sửa ghi chú (nếu cần) | Admin | Trường ghi chú được cập nhật |
| 10 | Admin click "Cập nhật" để lưu thay đổi | Admin | Hệ thống validate dữ liệu (giống như thêm mới) |
| 11 | - | Hệ thống | Kiểm tra toàn bộ trường bắt buộc, hợp lệ |
| 12 | - | Hệ thống | Nếu hợp lệ: cập nhật câu hỏi vào CSDL, hiển thị thông báo "Cập nhật câu hỏi thành công" |
| 13 | Admin nhìn thấy thông báo thành công | Admin | Form đóng, quay về danh sách, hàng câu hỏi được cập nhật với thông tin mới |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 7.1 | Admin để trống các trường bắt buộc (tương tự như thêm mới) | Hiển thị cảnh báo đỏ tương ứng | Form không được submit |
| 7.2 | Admin xóa hết Tags (để trống Tags) | Hiển thị cảnh báo: "Vui lòng gắn ít nhất một Tag" | Form có thể submit với cảnh báo cam |
| 7.3 | Admin không thay đổi bất kỳ trường nào và click "Cập nhật" | Hệ thống vẫn execute lệnh update | Thông báo "Cập nhật thành công" (dù không có thay đổi) |
| 7.4 | Lỗi kết nối cơ sở dữ liệu | Thông báo lỗi: "Lỗi cập nhật. Vui lòng thử lại" | Form giữ nguyên dữ liệu đã nhập |
| 7.5 | Admin click "Hủy" | Hộp thoại xác nhận: "Bạn có chắc chắn muốn hủy? Những thay đổi sẽ không được lưu." | Nếu xác nhận: quay về danh sách; Nếu hủy: tiếp tục form |
| 7.6 | Câu hỏi đã bị xóa bởi admin khác trong khi form sửa đang mở | Khi admin click "Cập nhật", hiển thị lỗi: "Câu hỏi này không còn tồn tại" | Form đóng, quay về danh sách |
| 7.7 | Một câu hỏi được sử dụng trong nhiều đề thi | Hệ thống cho phép cập nhật, có cảnh báo: "Câu hỏi này được sử dụng trong X đề thi. Thay đổi có thể ảnh hưởng" | Admin có thể tiếp tục cập nhật |

---

### 1.3 Xóa Câu Hỏi

**Use case:** Xóa câu hỏi khỏi ngân hàng câu hỏi

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Tồn tại ít nhất một câu hỏi trong hệ thống
- Admin đang ở giao diện danh sách câu hỏi

**Hậu điều kiện:**
- Câu hỏi được xóa khỏi ngân hàng
- Câu hỏi không thể được sử dụng trong các đề thi mới
- Các đề thi cũ chứa câu hỏi này vẫn giữ nguyên (dữ liệu lịch sử)

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin đang ở danh sách câu hỏi | Admin | Danh sách câu hỏi hiển thị |
| 2 | Admin click vào nút "Xóa" ở hàng câu hỏi muốn xóa | Admin | Hệ thống kiểm tra trạng thái câu hỏi |
| 3 | - | Hệ thống | Nếu câu hỏi không được sử dụng trong đề nào: mở hộp thoại xác nhận |
| 4 | Hộp thoại hiển thị: "Bạn có chắc chắn muốn xóa câu hỏi này? \n Nội dung: [nội dung tóm tắt]\n Hành động này không thể hoàn tác." | Admin | Có 2 nút: "Xóa", "Hủy" |
| 5 | Admin click "Xóa" để xác nhận | Admin | Hệ thống xóa câu hỏi từ CSDL |
| 6 | - | Hệ thống | Xóa thành công, hiển thị thông báo: "Xóa câu hỏi thành công", đóng hộp thoại |
| 7 | Danh sách được cập nhật, câu hỏi vừa xóa không còn trong danh sách | Admin | Câu hỏi biến mất khỏi danh sách |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 8.1 | Câu hỏi được sử dụng trong 1 hoặc nhiều đề thi hiện có | Không mở hộp thoại xóa, hiển thị cảnh báo: "Không thể xóa câu hỏi này vì nó được sử dụng trong X đề thi. Vui lòng xóa câu hỏi khỏi các đề thi trước khi xóa." | Admin không thể xóa, phải remove khỏi đề trước |
| 8.2 | Admin click "Hủy" trong hộp thoại xác nhận | Hộp thoại đóng | Quay trở lại danh sách, câu hỏi vẫn tồn tại |
| 8.3 | Lỗi kết nối CSDL khi xóa | Hộp thoại lỗi: "Lỗi khi xóa câu hỏi. Vui lòng thử lại" | Câu hỏi vẫn tồn tại, Admin có thể thử lại |
| 8.4 | Câu hỏi bị xóa bởi admin khác trước khi xóa được thực hiện | Lỗi: "Câu hỏi này đã bị xóa bởi người dùng khác" | Hộp thoại đóng, danh sách refresh |
| 8.5 | Admin chọn nhiều câu hỏi và xóa hàng loạt (nếu hệ thống hỗ trợ) | Hộp thoại: "Bạn có chắc chắn muốn xóa X câu hỏi?" | Có thể chọn xóa hàng loạt hoặc hủy |

---

### 1.4 Tìm Kiếm và Lọc Câu Hỏi

**Use case:** Tìm kiếm và lọc danh sách câu hỏi theo tiêu chí

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Hệ thống có ít nhất 10 câu hỏi

**Hậu điều kiện:**
- Danh sách câu hỏi được hiển thị theo tiêu chí tìm kiếm/lọc
- Admin có thể quản lý các câu hỏi cụ thể dễ dàng hơn

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin ở danh sách câu hỏi | Admin | Hiển thị thanh tìm kiếm và bộ lọc (Độ khó, Tag) |
| 2 | Admin nhập từ khóa tìm kiếm ở thanh tìm kiếm (VD: "pronunciation") | Admin | Tìm kiếm real-time (với delay 500ms) |
| 3 | - | Hệ thống | Lọc danh sách theo nội dung câu hỏi chứa từ khóa, hiển thị kết quả (Tìm thấy X câu) |
| 4 | Admin chọn lọc theo "Độ khó" (VD: Khó) | Admin | Bộ lọc cập nhật, hiển thị chỉ câu khó |
| 5 | Admin chọn lọc theo "Tag" (VD: #Grammar, #Vocabulary) | Admin | Bộ lọc cập nhật, hiển thị câu có các Tag được chọn (OR condition) |
| 6 | Admin có thể kết hợp tìm kiếm + lọc Độ khó + lọc Tag | Admin | Danh sách cập nhật với tất cả điều kiện |
| 7 | Admin click "Reset bộ lọc" để xóa tất cả điều kiện | Admin | Danh sách quay về ban đầu, hiển thị tất cả câu hỏi |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 9.1 | Tìm kiếm không có kết quả | Hiển thị: "Không tìm thấy câu hỏi nào phù hợp" | Danh sách trống, gợi ý nhập lại từ khóa |
| 9.2 | Admin xóa từ khóa tìm kiếm | Danh sách quay về trạng thái được lọc trước đó | Hiển thị danh sách theo bộ lọc (nếu có) |

---

## 2. QUẢN LÝ KHO TÀI LIỆU ÔN TẬP

### 2.1 Thêm Tài Liệu Mới

**Use case:** Thêm tài liệu ôn tập mới vào kho tài liệu

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công vào hệ thống quản trị
- Admin có quyền truy cập mục "Quản lý tài liệu"
- Hệ thống có ít nhất một Tag kiến thức được định nghĩa
- File tài liệu đã được chuẩn bị (PDF hoặc link bài giảng)

**Hậu điều kiện:**
- Tài liệu được lưu chính xác vào cơ sở dữ liệu
- Tài liệu được liên kết đúng với các Tag kiến thức
- Tài liệu có thể được sử dụng trong hệ gợi ý cho học sinh
- Admin nhận được thông báo xác nhận thành công

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin truy cập mục "Quản lý tài liệu" trên thanh điều hướng | Admin | Hệ thống hiển thị giao diện quản lý tài liệu, danh sách các tài liệu hiện có |
| 2 | Admin nhìn thấy nút "Thêm tài liệu" | Admin | Danh sách tài liệu được hiển thị với: Tiêu đề, Loại tài liệu, Tags, Ngày tạo, Nút: Xem, Sửa, Xóa |
| 3 | Admin click "Thêm tài liệu" | Admin | Hệ thống mở form thêm tài liệu với các trường: Tiêu đề (*), Mô tả (*), Loại tài liệu (*), File/Link tài liệu (*), Tags kiến thức (*), Trạng thái xuất bản |
| 4 | Admin nhập tiêu đề tài liệu (VD: "Chinh phục từ vựng Band 7 - Phần 1") | Admin | Trường tiêu đề được cập nhật |
| 5 | Admin nhập mô tả chi tiết tài liệu (VD: "Hướng dẫn chi tiết về cách học từ vựng nâng cao, bao gồm 50 từ vựng kinh điển trong các bài thi...") | Admin | Textarea mô tả được cập nhật, hỗ trợ định dạng cơ bản |
| 6 | Admin chọn loại tài liệu từ dropdown (PDF / Link bài giảng / Video) | Admin | Dropdown mở ra 3 lựa chọn, Admin chọn một |
| 7a | **Nếu chọn "PDF":** Admin click "Chọn file" và upload file PDF | Admin | Hộp thoại chọn file mở ra, Admin chọn file từ máy tính (file size ≤ 50MB, định dạng .pdf) |
| 7b | - | Hệ thống | Kiểm tra file: dung lượng ≤ 50MB, định dạng đúng, hiển thị tên file đã chọn, dung lượng file (VD: "document.pdf - 2.5 MB") |
| 7c | **Nếu chọn "Link bài giảng":** Admin nhập URL link bài giảng | Admin | Trường input URL được cập nhật, Admin nhập link (VD: https://www.youtube.com/watch?v=...) |
| 7d | - | Hệ thống | Validate URL format, hiển thị preview link (nếu hỗ trợ) |
| 8 | Admin chọn Tags kiến thức liên quan (VD: #Vocabulary, #Band7, #CommonMistakes) | Admin | Multi-select Tags hiển thị, Admin chọn một hoặc nhiều Tags |
| 9 | Admin có thể chọn "Đã xuất bản" hoặc "Nháp" để quyết định xuất bản tài liệu hay chưa | Admin | Checkbox "Xuất bản ngay" được chọn/bỏ chọn |
| 10 | Admin click "Lưu tài liệu" | Admin | Hệ thống validate dữ liệu |
| 11 | - | Hệ thống | Kiểm tra: Tiêu đề không trống?, Mô tả không trống?, Loại tài liệu được chọn?, File/Link được upload/nhập?, Tags được gắn?, Nếu upload file: dung lượng OK? |
| 12 | - | Hệ thống | Nếu PDF: lưu file vào cloud storage (VD: Azure Blob Storage), lấy URL; Nếu Link: validate link |
| 13 | - | Hệ thống | Lưu tài liệu vào CSDL với trạng thái (Published/Draft), hiển thị thông báo "Thêm tài liệu thành công" |
| 14 | Admin nhìn thấy thông báo thành công | Admin | Form đóng, quay về danh sách tài liệu, tài liệu mới xuất hiện ở đầu danh sách |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 10.1 | Admin để trống tiêu đề | Hiển thị cảnh báo: "Tiêu đề tài liệu không được để trống" | Form không được submit |
| 10.2 | Admin để trống mô tả | Hiển thị cảnh báo: "Mô tả không được để trống" | Form không được submit |
| 10.3 | Admin không chọn loại tài liệu | Hiển thị cảnh báo: "Vui lòng chọn loại tài liệu" | Form không được submit |
| 10.4 | Admin chọn loại "PDF" nhưng không upload file | Hiển thị cảnh báo: "Vui lòng upload file PDF" | Form không được submit |
| 10.5 | Admin chọn loại "Link" nhưng không nhập URL | Hiển thị cảnh báo: "Vui lòng nhập URL link bài giảng" | Form không được submit |
| 10.6 | File PDF vượt quá 50MB | Hiển thị cảnh báo: "File vượt quá dung lượng tối đa 50MB. Vui lòng chọn file khác" | File không được upload, Admin phải chọn file khác |
| 10.7 | File PDF có định dạng sai (VD: .doc, .xlsx) | Hiển thị cảnh báo: "Định dạng file không hỗ trợ. Vui lòng upload file .pdf" | File không được upload |
| 10.8 | Admin không gắn bất kỳ Tag nào | Hiển thị cảnh báo màu cam: "Vui lòng gắn ít nhất một Tag kiến thức" | Form vẫn có thể submit nhưng cảnh báo |
| 10.9 | Admin nhập URL không hợp lệ (VD: "không phải URL") | Hiển thị cảnh báo: "URL không hợp lệ. Vui lòng kiểm tra lại" | Form không được submit |
| 10.10 | Lỗi upload file PDF lên cloud storage | Hiển thị thông báo lỗi: "Lỗi upload file. Vui lòng thử lại sau" | Form giữ nguyên dữ liệu, Admin có thể thử lại |
| 10.11 | Lỗi kết nối CSDL khi lưu | Hiển thị lỗi: "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau" | Form giữ nguyên dữ liệu |
| 10.12 | Admin click "Hủy" | Hộp thoại xác nhận: "Bạn có chắc chắn muốn hủy? Dữ liệu sẽ không được lưu." | Nếu xác nhận: quay về danh sách; Nếu hủy: tiếp tục form |

---

### 2.2 Sửa Tài Liệu

**Use case:** Cập nhật, chỉnh sửa thông tin tài liệu đã tồn tại

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Tồn tại ít nhất một tài liệu trong kho
- Admin đang ở giao diện danh sách tài liệu

**Hậu điều kiện:**
- Thông tin tài liệu được cập nhật chính xác trong cơ sở dữ liệu
- Tags liên kết được cập nhật chính xác
- Hệ gợi ý sẽ lấy thông tin tài liệu mới nhất

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin đang ở danh sách tài liệu | Admin | Danh sách hiển thị với thông tin: Tiêu đề, Loại, Tags, Ngày tạo, Trạng thái, Nút: Xem, Sửa, Xóa |
| 2 | Admin click "Sửa" ở hàng tài liệu muốn chỉnh sửa | Admin | Hệ thống mở form sửa tài liệu với tất cả trường được điền sẵn |
| 3 | Form sửa hiển thị: Tiêu đề, Mô tả, Loại tài liệu, File/Link hiện tại, Tags đã gắn, Trạng thái xuất bản | Hệ thống | Các nút: "Cập nhật", "Hủy" |
| 4 | Admin chỉnh sửa tiêu đề (nếu cần) | Admin | Trường tiêu đề được cập nhật |
| 5 | Admin chỉnh sửa mô tả (nếu cần) | Admin | Trường mô tả được cập nhật |
| 6 | Admin thay đổi loại tài liệu (nếu cần) | Admin | Dropdown loại tài liệu được cập nhật |
| 7 | Admin thay đổi file/link (nếu cần): | Admin | - |
| 7a | **Nếu thay file PDF:** Admin click "Chọn file mới" | Admin | Hộp thoại chọn file mở ra, Admin chọn file mới; File cũ sẽ bị thay thế |
| 7b | **Nếu thay Link:** Admin chỉnh sửa URL | Admin | Trường URL được cập nhật |
| 8 | Admin cập nhật Tags (thêm/bỏ Tags) | Admin | Multi-select Tags được cập nhật |
| 9 | Admin thay đổi trạng thái xuất bản (Published/Draft) | Admin | Trạng thái được cập nhật |
| 10 | Admin click "Cập nhật" | Admin | Hệ thống validate dữ liệu |
| 11 | - | Hệ thống | Kiểm tra toàn bộ trường bắt buộc, hợp lệ (giống như thêm mới) |
| 12 | - | Hệ thống | Nếu thay file: xóa file cũ từ cloud, upload file mới; Cập nhật tài liệu vào CSDL |
| 13 | - | Hệ thống | Hiển thị thông báo: "Cập nhật tài liệu thành công" |
| 14 | Admin nhìn thấy thông báo thành công | Admin | Form đóng, quay về danh sách, hàng tài liệu được cập nhật |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 11.1 | Admin để trống các trường bắt buộc (tương tự như thêm mới) | Hiển thị cảnh báo tương ứng | Form không được submit |
| 11.2 | Admin không gắn Tags | Hiển thị cảnh báo: "Vui lòng gắn ít nhất một Tag" | Form vẫn có thể submit với cảnh báo |
| 11.3 | File PDF mới vượt quá 50MB | Hiển thị cảnh báo: "File vượt quá dung lượng tối đa" | File không được upload, phải chọn file khác |
| 11.4 | Lỗi upload file mới | Hiển thị lỗi, file cũ vẫn được giữ | Admin có thể thử lại |
| 11.5 | Admin không thay đổi bất kỳ trường nào nhưng click "Cập nhật" | Hệ thống vẫn thực hiện update | Thông báo "Cập nhật thành công" |
| 11.6 | Tài liệu bị xóa bởi admin khác | Lỗi: "Tài liệu này không còn tồn tại" | Form đóng, quay về danh sách |
| 11.7 | Admin click "Hủy" | Hộp thoại xác nhận: "Bạn có chắc chắn muốn hủy?" | Nếu xác nhận: quay về danh sách; Nếu hủy: tiếp tục form |

---

### 2.3 Xóa Tài Liệu

**Use case:** Xóa tài liệu khỏi kho tài liệu ôn tập

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Tồn tại ít nhất một tài liệu trong kho
- Admin đang ở giao diện danh sách tài liệu

**Hậu điều kiện:**
- Tài liệu được xóa khỏi kho
- File (nếu là PDF) được xóa khỏi cloud storage
- Tài liệu không còn được gợi ý cho học sinh
- Dữ liệu lịch sử được giữ lại (nếu cần)

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin đang ở danh sách tài liệu | Admin | Danh sách tài liệu hiển thị |
| 2 | Admin click "Xóa" ở hàng tài liệu muốn xóa | Admin | Hộp thoại xác nhận mở ra |
| 3 | Hộp thoại hiển thị: "Bạn có chắc chắn muốn xóa tài liệu này? \n Tiêu đề: [tiêu đề tài liệu]\n Hành động này không thể hoàn tác." | Admin | Có 2 nút: "Xóa", "Hủy" |
| 4 | Admin click "Xóa" để xác nhận | Admin | Hệ thống xóa tài liệu |
| 5 | - | Hệ thống | Nếu là PDF: xóa file khỏi cloud storage; Xóa bản ghi tài liệu từ CSDL |
| 6 | - | Hệ thống | Hiển thị thông báo: "Xóa tài liệu thành công", đóng hộp thoại |
| 7 | Danh sách được cập nhật, tài liệu vừa xóa không còn trong danh sách | Admin | Tài liệu biến mất |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 12.1 | Admin click "Hủy" | Hộp thoại đóng | Quay trở lại danh sách, tài liệu vẫn tồn tại |
| 12.2 | Lỗi xóa file PDF từ cloud storage | Lỗi: "Lỗi xóa tài liệu. Vui lòng thử lại" | Tài liệu vẫn tồn tại trong kho |
| 12.3 | Lỗi kết nối CSDL | Lỗi: "Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại" | Tài liệu vẫn tồn tại |
| 12.4 | Tài liệu bị xóa bởi admin khác trước khi xóa | Lỗi: "Tài liệu này đã bị xóa bởi người dùng khác" | Hộp thoại đóng, danh sách refresh |
| 12.5 | Admin chọn xóa nhiều tài liệu (nếu hỗ trợ) | Hộp thoại: "Bạn có chắc chắn muốn xóa X tài liệu?" | Có thể xóa hàng loạt hoặc hủy |

---

### 2.4 Tìm Kiếm và Lọc Tài Liệu

**Use case:** Tìm kiếm và lọc danh sách tài liệu theo tiêu chí

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Hệ thống có ít nhất 5 tài liệu trong kho

**Hậu điều kiện:**
- Danh sách tài liệu được hiển thị theo tiêu chí tìm kiếm/lọc
- Admin dễ dàng tìm được tài liệu cần quản lý

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin ở danh sách tài liệu | Admin | Hiển thị thanh tìm kiếm và bộ lọc (Loại tài liệu, Tag, Trạng thái) |
| 2 | Admin nhập từ khóa tìm kiếm ở thanh tìm kiếm (VD: "Band 7") | Admin | Tìm kiếm real-time |
| 3 | - | Hệ thống | Lọc theo tiêu đề, mô tả tài liệu chứa từ khóa, hiển thị kết quả |
| 4 | Admin lọc theo "Loại tài liệu" (VD: PDF, Link bài giảng, Video) | Admin | Bộ lọc cập nhật, danh sách chỉ hiển thị tài liệu loại đó |
| 5 | Admin lọc theo "Tag" (VD: #Vocabulary, #Grammar) | Admin | Bộ lọc cập nhật, hiển thị tài liệu có Tags được chọn |
| 6 | Admin lọc theo "Trạng thái" (Published / Draft) | Admin | Bộ lọc cập nhật, hiển thị tài liệu theo trạng thái |
| 7 | Admin kết hợp tìm kiếm + lọc nhiều tiêu chí | Admin | Danh sách cập nhật với tất cả điều kiện |
| 8 | Admin click "Reset bộ lọc" | Admin | Tất cả bộ lọc xóa, danh sách quay về ban đầu |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 13.1 | Tìm kiếm không có kết quả | Hiển thị: "Không tìm thấy tài liệu nào phù hợp" | Danh sách trống, gợi ý thử lại |
| 13.2 | Admin xóa từ khóa tìm kiếm | Danh sách quay về trạng thái được lọc trước | Hiển thị danh sách theo bộ lọc |

---

### 2.5 Xem Chi Tiết Tài Liệu

**Use case:** Xem chi tiết tài liệu, preview nội dung

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Tồn tại ít nhất một tài liệu trong kho
- Admin đang ở danh sách tài liệu

**Hậu điều kiện:**
- Admin có thể xem được nội dung tài liệu hoặc link bài giảng
- Admin có thể kiểm tra thông tin tài liệu trước khi sửa/xóa

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin click nút "Xem" ở hàng tài liệu | Admin | Hệ thống mở modal hoặc trang mới để xem chi tiết |
| 2 | Chi tiết tài liệu được hiển thị: Tiêu đề, Mô tả, Loại, Tags, Ngày tạo, Trạng thái | Hệ thống | Hiển thị đầy đủ thông tin |
| 3a | **Nếu là PDF:** Hiển thị preview PDF hoặc nút download | Hệ thống | Admin có thể xem PDF trong browser hoặc download |
| 3b | **Nếu là Link:** Hiển thị link, admin có thể click để mở | Hệ thống | Hiển thị URL dạng link có thể click |
| 4 | Admin có nút "Sửa", "Xóa", "Đóng" | Hệ thống | Admin có thể thực hiện hành động tiếp theo hoặc đóng modal |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|----|
| 14.1 | File PDF lỗi hoặc bị hỏng | Thông báo: "Không thể preview file PDF. Vui lòng download để xem" | Cung cấp nút download thay thế |
| 14.2 | Link tài liệu không còn hợp lệ | Thông báo: "Không thể mở link. URL có thể đã hết hạn" | Hiển thị URL cho admin kiểm tra |
| 14.3 | Tài liệu bị xóa trong khi xem | Thông báo: "Tài liệu không còn tồn tại" | Modal đóng, quay về danh sách |

---

## TÓMNGOẠI LỆ CHUNG

| Mã | Tình Huống | Hệ Thống | Kết Quả |
|----|-----------|----------|--------|
| E1 | Admin bị timeout (session hết hạn) | Hệ thống redirect đến trang login | Admin phải đăng nhập lại |
| E2 | Lỗi mạng trong quá trình lưu dữ liệu | Hiển thị thông báo lỗi, giữ form | Admin có thể thử lại |
| E3 | Server lỗi (500 Internal Server Error) | Hiển thị: "Lỗi hệ thống. Vui lòng liên hệ quản trị viên" | Yêu cầu thử lại hoặc liên hệ support |
| E4 | Quota storage đầy (khi upload PDF) | Thông báo: "Dung lượng lưu trữ hết. Vui lòng liên hệ quản trị viên" | Không thể upload, cần xóa tài liệu cũ |
| E5 | Admin không có quyền thực hiện hành động | Thông báo: "Bạn không có quyền thực hiện hành động này" | Không hiển thị nút hoặc vô hiệu hóa |

---

## LIÊN KẾT VỚI CÁC KỊCH BẢN KHÁC

- **Quản lý câu hỏi** ← → **Thiết lập ma trận đề thi**: Câu hỏi từ ngân hàng được sử dụng để tạo đề thi
- **Quản lý tài liệu ôn tập** ← → **Hệ gợi ý cho học sinh**: Tags của tài liệu được sử dụng để gợi ý cho học sinh dựa trên kết quả thi
- **Quản lý câu hỏi** ← → **Quản lý tài liệu ôn tập**: Cùng sử dụng hệ thống Tags để tổ chức dữ liệu

---

## 3. THIẾT LẬP MA TRẬN ĐỀ THI

### 3.1 Tạo Đề Tự Động

**Use case:** Tạo đề thi theo ma trận tự động từ ngân hàng câu hỏi

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Ngân hàng câu hỏi có đủ dữ liệu theo các Tag và độ khó cần thiết
- Admin có quyền truy cập mục "Quản lý đề thi"

**Hậu điều kiện:**
- Đề thi mới được tạo tự động theo ma trận đã cấu hình
- Đề thi sẵn sàng để xuất bản hoặc lưu nháp
- Các câu hỏi trong đề được gán đúng theo tỷ lệ độ khó và Tag

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin truy cập mục "Quản lý đề thi" trong trang quản trị | Admin | Hệ thống hiển thị giao diện quản lý đề thi, danh sách đề thi hiện có |
| 2 | Admin click nút "Tạo đề thi mới" | Admin | Hệ thống mở modal hoặc trang tạo đề thi mới với lựa chọn "Tự động" và "Thủ công" |
| 3 | Admin chọn chế độ "Tự động" | Admin | Hệ thống hiển thị form cấu hình ma trận tự động |
| 4 | Admin nhập Tên đề thi, Thời gian làm bài, Tổng số câu hỏi | Admin | Các trường input được hiển thị và cập nhật |
| 5 | Admin định nghĩa tỷ lệ câu hỏi theo độ khó (VD: 40% Dễ, 40% Trung bình, 20% Khó) | Admin | Hệ thống hiển thị các thanh trượt hoặc input tỷ lệ, tự động kiểm tra tổng % = 100% |
| 6 | Admin chọn tỷ lệ câu hỏi theo Tag kiến thức (VD: 50% Đọc hiểu, 30% Ngữ pháp, 20% Từ vựng) | Admin | Hệ thống hiển thị ô nhập tỷ lệ cho mỗi Tag, tự động kiểm tra tổng % = 100% |
| 7 | Admin click nút "Khởi tạo đề" | Admin | Hệ thống kiểm tra ma trận, truy vấn ngân hàng câu hỏi |
| 8 | - | Hệ thống | Trích xuất câu hỏi tự động theo tỷ lệ độ khó và Tag đã định nghĩa |
| 9 | - | Hệ thống | Hiển thị danh sách câu hỏi đề xuất cho đề thi và số lượng câu hỏi đã chọn |
| 10 | Admin rà soát danh sách câu hỏi được chọn | Admin | Hệ thống cho phép xem tóm tắt câu, độ khó và Tags của từng câu |
| 11 | Admin click "Xuất bản" hoặc "Lưu nháp" | Admin | Hệ thống lưu đề thi với trạng thái tương ứng |
| 12 | - | Hệ thống | Hiển thị thông báo "Tạo đề tự động thành công" và chuyển đến trang chi tiết đề thi |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|--------|
| 3.1.1 | Tổng tỷ lệ độ khó hoặc tỷ lệ Tag không bằng 100% | Hiển thị cảnh báo: "Tổng tỷ lệ phải bằng 100%" | Admin không thể khởi tạo đề |
| 3.1.2 | Ngân hàng câu hỏi không đủ theo yêu cầu ma trận | Hiển thị lỗi: "Không đủ dữ liệu câu hỏi để tạo đề theo ma trận này" | Admin cần điều chỉnh ma trận hoặc bổ sung câu hỏi |
| 3.1.3 | Không có Tag được chọn hoặc Tag không hợp lệ | Hiển thị cảnh báo: "Vui lòng chọn ít nhất một Tag hợp lệ" | Form không được submit |
| 3.1.4 | Lỗi kết nối cơ sở dữ liệu khi trích xuất câu hỏi | Hiển thị lỗi: "Lỗi truy xuất dữ liệu. Vui lòng thử lại sau" | Admin có thể thử lại |
| 3.1.5 | Admin click "Hủy" trước khi khởi tạo đề | Hệ thống hiển thị hộp thoại xác nhận | Nếu xác nhận: quay về danh sách đề thi; nếu không: tiếp tục form |

---

### 3.2 Tạo Đề Thủ Công

**Use case:** Tạo đề thi bằng cách chọn thủ công từng câu hỏi từ ngân hàng

**Actor:** Quản trị viên (Admin)

**Tiền điều kiện:**
- Admin đã đăng nhập thành công
- Ngân hàng câu hỏi có dữ liệu đa dạng theo Tag, độ khó
- Admin có quyền truy cập mục "Quản lý đề thi"

**Hậu điều kiện:**
- Đề thi mới được tạo thủ công theo lựa chọn của Admin
- Đề thi sẵn sàng để xuất bản hoặc lưu nháp
- Admin có thể điều chỉnh số lượng và cấu trúc câu hỏi thủ công

**Kịch bản chính:**

| Bước | Diễn tả | Actor | Hệ thống |
|------|---------|-------|----------|
| 1 | Admin truy cập mục "Quản lý đề thi" | Admin | Hệ thống hiển thị danh sách đề thi hiện có |
| 2 | Admin click nút "Tạo đề thi mới" | Admin | Hệ thống mở modal hoặc trang tạo đề thi mới |
| 3 | Admin chọn chế độ "Thủ công" | Admin | Hệ thống hiển thị form tạo đề thi thủ công |
| 4 | Admin nhập Tên đề thi, Thời gian làm bài, Tổng số câu hỏi mong muốn | Admin | Các trường input được hiển thị và cập nhật |
| 5 | Admin chọn Tags kiến thức cần có trong đề thi | Admin | Hệ thống hiển thị danh sách Tag và bộ lọc câu hỏi theo Tag |
| 6 | Admin chọn độ khó mong muốn cho từng nhóm câu hỏi | Admin | Hệ thống cho phép lọc theo Dễ/Trung bình/Khó và hiển thị số lượng câu hỏi khả dụng |
| 7 | Admin click "Tìm câu hỏi" hoặc "Lọc câu hỏi" | Admin | Hệ thống hiển thị danh sách câu hỏi phù hợp với tiêu chí |
| 8 | Admin chọn từng câu hỏi để thêm vào đề thi | Admin | Hệ thống hiển thị số lượng câu đã chọn và tổng số câu cần đạt |
| 9 | Admin điều chỉnh bằng cách thêm/bớt câu hỏi cho đến đạt đủ tổng số | Admin | Hệ thống cập nhật trạng thái đề thi, cảnh báo nếu quá hoặc thiếu câu |
| 10 | Admin click "Lưu đề" hoặc "Xuất bản" | Admin | Hệ thống lưu đề thi với toàn bộ câu hỏi đã chọn |
| 11 | - | Hệ thống | Hiển thị thông báo "Tạo đề thủ công thành công" và chuyển đến chi tiết đề thi |

**Ngoại lệ:**

| Mã | Điều kiện | Hệ thống | Kết quả |
|----|-----------|---------|--------|
| 3.2.1 | Admin chưa chọn đủ số câu hỏi theo tổng yêu cầu | Hiển thị cảnh báo: "Vui lòng chọn đủ X câu hỏi" | Không thể lưu hoặc xuất bản đề |
| 3.2.2 | Admin chọn câu hỏi trùng lặp | Hệ thống hiển thị cảnh báo: "Câu hỏi đã được thêm vào đề" | Yêu cầu chọn câu hỏi khác |
| 3.2.3 | Câu hỏi không hợp lệ hoặc đã bị xóa | Hiển thị lỗi: "Một số câu hỏi không còn tồn tại. Vui lòng cập nhật đề" | Admin cần loại bỏ câu hỏi lỗi |
| 3.2.4 | Lỗi tải danh sách câu hỏi | Hiển thị lỗi: "Lỗi truy xuất câu hỏi. Vui lòng thử lại" | Admin có thể tải lại trang hoặc thử lại |
| 3.2.5 | Admin click "Hủy" trước khi lưu đề | Hệ thống hiển thị hộp thoại xác nhận | Nếu xác nhận: quay về danh sách đề thi; nếu không: tiếp tục form |

---

## GHI CHÚ BỔ SUNG

- **Tags kiến thức**: Cần có quản lý riêng cho Tags (CRUD), Admin có thể tạo Tags mới khi quản lý câu hỏi/tài liệu
- **Phân quyền**: Hệ thống nên có quản lý phân quyền để chỉ Admin mới có thể thực hiện các hành động này
- **Audit log**: Ghi log tất cả hành động của Admin (thêm, sửa, xóa) cho mục đích kiểm toán
- **Bulk operations**: Cân nhắc hỗ trợ các hành động hàng loạt (xóa nhiều câu hỏi/tài liệu cùng lúc)
- **Import/Export**: Cân nhắc hỗ trợ nhập/xuất dữ liệu (CSV, Excel) cho câu hỏi và tài liệu
- **Notification**: Admin nhận được thông báo khi có lỗi hoặc hành động quan trọng

---

