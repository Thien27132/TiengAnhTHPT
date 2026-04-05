import axios from 'axios';

// 1. Tạo một instance của Axios với cấu hình cơ bản
const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Địa chỉ Backend từ file .env của bạn
    headers: {
        'Content-Type': 'application/json',
    },
});

// 2. Thiết lập Interceptor cho Request (Yêu cầu gửi đi)
axiosClient.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage mà bạn đã lưu lúc đăng nhập thành công
        const token = localStorage.getItem('token'); 
        
        if (token) {
            // Tự động thêm "Authorization: Bearer <token>" vào Header
            // Đây chính là định dạng mà authMiddleware.js đang chờ đợi
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. (Tùy chọn) Interceptor cho Response (Kết quả trả về)
axiosClient.interceptors.response.use(
    (response) => {
        // Nếu kết quả trả về thành công, chỉ lấy phần dữ liệu (data)
        return response.data;
    },
    (error) => {
        // Nếu Server báo lỗi 401 (Hết hạn token), có thể đẩy người dùng ra trang Login
        if (error.response && error.response.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;