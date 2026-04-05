import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient'; // Sử dụng cấu hình API chung


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();


    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Xóa thông báo lỗi cũ trước khi thử lại
        console.log("🚀 Đang thử đăng nhập với:", email);


        try {
            // Gọi API qua axiosClient
            // Chú ý: data nhận về đã được interceptor "gọt vỏ" (không cần res.data)
            const data = await axiosClient.post('/auth/login', { email, password });
           
            console.log("Dữ liệu nhận về từ Server:", data);  // <--- THÊM DÒNG NÀY để xem thực sự Backend đang trả về cái gì


            if (data.token) {
                // 1. Lưu Token xác thực
                localStorage.setItem('token', data.token);
               
                // 2. Lưu thông tin User để Dashboard hiển thị
                // Lấy thông tin user từ object mà Backend trả về
                const userToSave = {
                    FullName: data.user.FullName,
                    Email: data.user.Email,
                    role: data.user.role
                };
               
                localStorage.setItem('user', JSON.stringify(userToSave));


                console.log("✅ Đăng nhập thành công! Đang chuyển hướng...");
                console.log("✅ Đăng nhập thành công với role:", data.user.role);

                // ĐIỀU HƯỚNG DỰA TRÊN ROLE
                if (data.user.role === 'Admin') {
                    navigate('/admin'); // Nếu là Admin thì vào khu quản trị
                } else {
                    navigate('/dashboard'); // Nếu là Học sinh thì vào trang luyện thi
                }
            }
        } catch (err) {
            console.error("❌ Lỗi đăng nhập:", err);
            // Hiển thị lỗi từ Backend hoặc lỗi mặc định
            setError(err.response?.data?.message || "Email hoặc mật khẩu không đúng!");
        }
    };


    return (
        <div style={styles.container}>
            <form onSubmit={handleLogin} style={styles.form}>
                <h2>Đăng Nhập</h2>
                {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    required
                />
                <button type="submit" style={styles.button}>Vào hệ thống</button>
                <p>Chưa có tài khoản? <a href="/register">Đăng ký ngay</a></p>
            </form>
        </div>
    );
};


const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#e9ecef' },
    form: { padding: '2rem', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px', textAlign: 'center' },
    input: { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};


export default Login;
