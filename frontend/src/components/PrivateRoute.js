import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) return <Navigate to="/login" />;
    
    // Nếu Route yêu cầu quyền Admin mà user ko có quyền đó
    if (role && user.role !== role) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default PrivateRoute;