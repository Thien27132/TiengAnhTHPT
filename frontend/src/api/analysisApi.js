import axiosClient from './axiosClient';

const analysisApi = {
    // Tỷ lệ sai theo tag (Toàn hệ thống)
    getErrorRateByTagSystem: () => {
        return axiosClient.get('/analysis/error-rate-system');
    },

    // Tỷ lệ sai theo tag (Chi tiết từng học sinh hoặc tất cả)
    getErrorRateByTagStudent: (studentId = null) => {
        return axiosClient.get('/analysis/error-rate-student', {
            params: { studentId }
        });
    },

    // So sánh tỷ lệ sai với trung bình
    compareErrorRateWithAverage: (tagId = null) => {
        return axiosClient.get('/analysis/compare-average', {
            params: { tagId }
        });
    },

    // Xếp hạng học sinh theo tag
    rankStudentsByTag: (tagId = null) => {
        return axiosClient.get('/analysis/rank-students', {
            params: { tagId }
        });
    },

    // Phân bố học sinh theo mức độ
    getStudentDistributionByErrorRate: (tagId = null) => {
        return axiosClient.get('/analysis/distribution', {
            params: { tagId }
        });
    },

    // Danh sách học sinh cần focus
    getStudentsFocusList: (tagId = null, topCount = 5) => {
        return axiosClient.get('/analysis/focus-list', {
            params: { tagId, topCount }
        });
    }
};

export default analysisApi;
