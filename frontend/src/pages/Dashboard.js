import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    
    // Lấy dữ liệu từ localStorage
    const userData = localStorage.getItem('user');
    
    // Kiểm tra xem dữ liệu có tồn tại và không phải là "undefined" hay không
    const user = userData && userData !== "undefined" ? JSON.parse(userData) : null;

    const handleLogout = () => {
        localStorage.clear(); 
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h1>TiengAnhTHPT</h1>
                <button onClick={handleLogout} style={styles.logoutBtn}>Đăng xuất</button>
            </nav>
            
            <div style={styles.content}>
                <h2>Chào mừng, {user.FullName || 'Người dùng'}!</h2>
                <div style={styles.card}>
                    <p><strong>Vai trò:</strong> {user.role === 'Admin' ? '👑 Quản trị viên' : '📖 Học sinh'}</p>
                    <p><strong>Email:</strong> {user.Email}</p>
                </div>

                {user.role === 'Admin' ? (
                    <div style={styles.adminSection}>
                        <h3>Khu vực dành cho Giáo viên</h3>
                        <button style={styles.actionBtn}>Thêm câu hỏi mới</button>
                        <button style={styles.actionBtn}>Quản lý đề thi</button>
                    </div>
                ) : (
                    <div style={styles.studentSection}>
                        <h3>Khu vực dành cho Học sinh</h3>
                        <button style={styles.actionBtn}>Vào ôn luyện</button>
                        <button style={styles.actionBtn}>Xem lịch sử thi</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' },
    navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: '#007bff', color: 'white' },
    content: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' },
    logoutBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' },
    adminSection: { borderTop: '2px solid #007bff', paddingTop: '10px' },
    studentSection: { borderTop: '2px solid #28a745', paddingTop: '10px' },
    actionBtn: { margin: '5px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default Dashboard;