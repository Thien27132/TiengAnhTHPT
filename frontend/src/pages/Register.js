import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await axiosClient.post('/auth/register', formData);
            setMessage(data.message);
            setTimeout(() => navigate('/login'), 2000); // Đăng ký xong tự chuyển sang Login
        } catch (err) {
            setMessage(err.response?.data?.message || 'Đăng ký thất bại');
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2>Đăng Ký Tài Khoản</h2>
                <input type="text" placeholder="Họ tên" onChange={(e) => setFormData({...formData, fullName: e.target.value})} required style={styles.input} />
                <input type="email" placeholder="Email" onChange={(e) => setFormData({...formData, email: e.target.value})} required style={styles.input} />
                <input type="password" placeholder="Mật khẩu" onChange={(e) => setFormData({...formData, password: e.target.value})} required style={styles.input} />
                <button type="submit" style={styles.button}>Đăng Ký</button>
                {message && <p>{message}</p>}
                <p>Đã có tài khoản? <a href="/login">Đăng nhập ngay</a></p>
            </form>
        </div>
    );
};

// CSS inline đơn giản 
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    form: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px', textAlign: 'center' },
    input: { width: '100%', marginBottom: '1rem', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' },
    button: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};

export default Register;