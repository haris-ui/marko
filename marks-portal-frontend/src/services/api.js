import axios from 'axios';

const api = axios.create({
    baseURL: 'https://marko-nine.vercel.app/api',
    timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// On 401, clear storage (token expired)
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const login = (roll_number, password) =>
    api.post('/auth/login', { roll_number, password });

export const forgotPassword = (roll_number) =>
    api.post('/auth/forgot-password', { roll_number });

export const registerStudent = (data) => api.post('/auth/register', data);

export const changePassword = (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password });

// ─── Marks ─────────────────────────────────────────────────────────────────────
export const getMyMarks = () => api.get('/marks/my');

export const getAllStudents = () => api.get('/marks/all');

export const getStudentsList = () => api.get('/marks/students');

export const addMark = (data) => api.post('/marks', data);

export const updateMark = (id, data) => api.put(`/marks/${id}`, data);

export const deleteMark = (id) => api.delete(`/marks/${id}`);

export const uploadCSV = (file, subject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('subject', subject);
    return api.post('/marks/upload-csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export default api;
