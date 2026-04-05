import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';

// Admin Pages
import AdminLayout from './pages/Admin/AdminLayout';
import QuestionManager from './pages/Admin/QuestionManager';
import ExamManager from './pages/Admin/ExamManager';

// Student Pages
import StudentDashboard from './pages/Student/StudentDashboard';
import ExamList from './pages/Student/ExamList';
import TakeExam from './pages/Student/TakeExam';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Khu vực ADMIN: Bảo vệ bằng PrivateRoute */}
        <Route path="/admin" element={<PrivateRoute role="Admin"><AdminLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="questions" />} />
          <Route path="questions" element={<QuestionManager />} />
          <Route path="exams" element={<ExamManager />} />
        </Route>

        {/* Khu vực HỌC SINH */}
        <Route path="/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
        <Route path="/exams" element={<PrivateRoute><ExamList /></PrivateRoute>} />
        <Route path="/take-exam/:id" element={<PrivateRoute><TakeExam /></PrivateRoute>} />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;