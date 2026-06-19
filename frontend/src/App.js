import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';

// Admin Pages
import AdminLayout from './pages/Admin/AdminLayout';
import QuestionManager from './pages/Admin/QuestionManager';
import { QuestionDetail } from './pages/Admin/QuestionManager/index';
import ExamManager from './pages/Admin/ExamManager';
import ExamDetail from './pages/Admin/ExamDetail';
import ResourceManager from './pages/Admin/ResourceManager';

// Student Pages
import StudentDashboard from './pages/Student/StudentDashboard';
import ExamList from './pages/Student/ExamList';
import TakeExam from './pages/Student/TakeExam';
import ExamHistory from './pages/Student/ExamHistory';
import ExamResultDetail from './pages/Student/ExamResultDetail';

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
          <Route path="questions/:id" element={<QuestionDetail />} />
          <Route path="exams" element={<ExamManager />} />
          <Route path="exams/:id" element={<ExamDetail />} />
          <Route path="resources" element={<ResourceManager />} />
        </Route>

        {/* Khu vực HỌC SINH */}
        <Route path="/dashboard" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
        <Route path="/exams" element={<PrivateRoute><ExamList /></PrivateRoute>} />
        <Route path="/take-exam/:id" element={<PrivateRoute><TakeExam /></PrivateRoute>} />
        <Route path="/exam-history" element={<PrivateRoute><ExamHistory /></PrivateRoute>} />
        <Route path="/exam-result/:resultId" element={<PrivateRoute><ExamResultDetail /></PrivateRoute>} />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;