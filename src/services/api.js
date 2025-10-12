import axios from 'axios';

// URL da API (backend)
const API_URL = 'http://localhost:3000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token em todas as requisições
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

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Funções da API
export const authAPI = {
  login: (matricula, pin) => api.post('/auth/login', { matricula, pin }),
  register: (data) => api.post('/auth/register', data)
};

export const processesAPI = {
  list: () => api.get('/processes')
};

export const ofsAPI = {
  list: (status) => api.get('/ofs', { params: { status } })
};

export const activitiesAPI = {
  start: (data) => api.post('/activities/start', data),
  pause: (id, motivo) => api.post(`/activities/${id}/pause`, { motivo }),
  resume: (id) => api.post(`/activities/${id}/resume`),
  finish: (id, data) => api.post(`/activities/${id}/finish`, data),
  getActive: (userId) => api.get(`/activities/active/${userId}`)
};

export const dashboardAPI = {
  live: () => api.get('/dashboard/live')
};

export default api;