import axios from 'axios';

// Use environment variable or fallback to production URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api' 
    : 'https://mailing.kunalpatil.me/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Mail API
export const mailAPI = {
  getMails: () => api.get('/mails'),
  getMail: (id) => api.get(`/mails/${id}`),
  createMail: (mailData) => api.post('/mails', mailData),
  sendMail: (id, emailData) => api.post(`/mails/${id}/send`, emailData),
  downloadAttachment: (mailId, attachmentId) => 
    api.get(`/mails/${mailId}/attachments/${attachmentId}`, {
      responseType: 'blob' // Important for file downloads
    }),
  // Note: These endpoints may not exist in the backend yet
  // deleteMail: (id) => api.delete(`/mails/${id}`),
  // markAsRead: (id) => api.patch(`/mails/${id}/read`),
  // markAsUnread: (id) => api.patch(`/mails/${id}/unread`),
  // starMail: (id) => api.patch(`/mails/${id}/star`),
  // unstarMail: (id) => api.patch(`/mails/${id}/unstar`),
  // archiveMail: (id) => api.patch(`/mails/${id}/archive`),
};

// Domain API
export const domainAPI = {
  getDomains: () => api.get('/domains'),
  createDomain: (domainData) => api.post('/domains', domainData),
  verifyDomain: (id) => api.post(`/domains/${id}/verify`),
};

export default api;