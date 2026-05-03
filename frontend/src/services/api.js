import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  logout: () => api.post('/logout'),
  refresh: () => api.post('/refresh'),
  getProfile: () => api.get('/me'),
  getAuthorityMatrix: () => api.get('/authority-matrix'),
  getNotifications: (params) => api.get('/notifications', { params }),
  markNotificationRead: (id) => api.post(`/notifications/${id}/read`),
};

export const internshipAPI = {
  getInternships: (params) => api.get('/internships', { params }),
  getPublicInternships: (params) => axios.get(`${API_BASE_URL}/public/internships`, { params }),
  getApprovalQueue: (params) => api.get('/internships/approval-queue/list', { params }),
  getInternship: (id) => api.get(`/internships/${id}`),
  createInternship: (data) => api.post('/internships', data),
  reviewSubmission: (id, data) => api.post(`/internships/${id}/review-submission`, data),
  updateInternship: (id, data) => api.put(`/internships/${id}`, data),
  deleteInternship: (id) => api.delete(`/internships/${id}`),
  applyToInternship: (id, data) => api.post(`/internships/${id}/apply`, data),
};

export const applicationAPI = {
  getApplications: (params) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  updateApplication: (id, data) => api.put(`/applications/${id}`, data),
  approveApplication: (id) => api.post(`/applications/${id}/approve`),
  rejectApplication: (id, reason) => api.post(`/applications/${id}/reject`, { rejection_reason: reason }),
  withdrawApplication: (id) => api.post(`/applications/${id}/withdraw`),
};

export const reportAPI = {
  getReports: (params) => api.get('/reports', { params }),
  getReport: (id) => api.get(`/reports/${id}`),
  createReport: (data) => api.post('/reports', data),
  updateReport: (id, data) => api.put(`/reports/${id}`, data),
  reviewReport: (id, data) => api.post(`/reports/${id}/review`, data),
  assignExaminer: (id, examinerId) => api.post(`/reports/${id}/assign-examiner`, { examiner_id: examinerId }),
  getSlaOverdueReport: (params) => api.get('/admin/sla-overdue-report', { params }),
};

export const evaluationAPI = {
  getEvaluations: (params) => api.get('/evaluations', { params }),
  getEvaluation: (id) => api.get(`/evaluations/${id}`),
  createEvaluation: (data) => api.post('/evaluations', data),
  updateEvaluation: (id, data) => api.put(`/evaluations/${id}`, data),
  deleteEvaluation: (id) => api.delete(`/evaluations/${id}`),
  getStudentEvaluations: (studentId) => api.get(`/evaluations/student/${studentId}`),
};

export const superAdminAPI = {
  getDepartments: () => api.get('/admin/departments'),
  getUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  suspendUser: (id, data) => api.post(`/admin/users/${id}/suspend`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  resetUserPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  registerStudent: (data) => api.post('/admin/register/student', data),
  registerStudentsBulk: (students) => api.post('/admin/register/students/bulk', { students }),
  registerCompany: (data) => api.post('/admin/register/company', data),
  registerExaminer: (data) => api.post('/admin/register/examiner', data),
  registerAdvisor: (data) => api.post('/admin/register/advisor', data),

  getApprovalsSummary: () => api.get('/admin/approvals/summary'),
  getPartnerRequests: (params) => api.get('/admin/partner-requests', { params }),
  getPartnerRequest: (id) => api.get(`/admin/partner-requests/${id}`),
  approvePartnerRequest: (id, data) => api.post(`/admin/partner-requests/${id}/approve`, data),
  rejectPartnerRequest: (id, data) => api.post(`/admin/partner-requests/${id}/reject`, data),

  getColleges: () => api.get('/admin/colleges'),
  getDepartmentsByCollege: (collegeId) => api.get('/admin/departments/by-college', { params: { college_id: collegeId } }),
  getUnassignedStudents: (params) => api.get('/admin/students/unassigned', { params }),
  getAvailableExaminers: (departmentId) => api.get('/admin/examiners/available', { params: { department_id: departmentId } }),
  getAvailableAdvisors: (departmentId) => api.get('/admin/advisors/available', { params: { department_id: departmentId } }),
  assignExaminer: (payload) => api.post('/admin/assign/examiner', payload),
  assignAdvisor: (payload) => api.post('/admin/assign/advisor', payload),
  assignBoth: (payload) => api.post('/admin/assign/both', payload),
};

export const publicAPI = {
  submitPartnerRequest: (data) => axios.post(`${API_BASE_URL}/public/partner-requests`, data),
};

export default api;
