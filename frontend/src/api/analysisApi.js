import axiosClient from './axiosClient';

const analysisApi = {

    // ==========================================
    // API DÀNH CHO DASHBOARD HỌC SINH
    // ==========================================

    // Bản đồ năng lực cá nhân của học sinh (Radar Chart - 3 Kỹ năng)
    getStudentSkillMap: (studentId, limit = 10) => {
        return axiosClient.get('/analysis/student-skill-map', {
            params: { studentId, limit }
        });
    },

    // Tiến độ điểm số theo mã đề (Line Chart) - THÊM MỚI
    getStudentProgress: (studentId, limit = 10) => {
        return axiosClient.get('/analysis/student-progress', {
            params: { studentId, limit }
        });
    }
};

export default analysisApi;