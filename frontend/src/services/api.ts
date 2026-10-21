// API service for communicating with the backend
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

// ----- Products -----
export const getProducts = () => api.get('/api/products');
export const getProduct  = (id: string) => api.get(`/api/products/${id}`);
export const createProduct = (data: any) => api.post('/api/products', data);

// ----- Batches -----
export const getBatches     = (params?: any) => api.get('/api/batches', { params });
export const getBatch       = (id: string)   => api.get(`/api/batches/${id}`);
export const createBatch    = (data: any)    => api.post('/api/batches', data);
export const recallBatch    = (id: string, data: any) => api.patch(`/api/batches/${id}/recall`, data);
export const updateBatchStatus = (id: string, data: any) => api.patch(`/api/batches/${id}/status`, data);
export const getExpiryAlerts = () => api.get('/api/batches/expiry-alerts');

// ----- Units -----
export const getUnits  = (params?: any) => api.get('/api/units', { params });
export const getUnit   = (id: string)   => api.get(`/api/units/${id}`);
export const createUnit = (data: any)   => api.post('/api/units', data);

// ----- Transfers -----
export const getTransfers  = (params?: any) => api.get('/api/transfers', { params });
export const createTransfer = (data: any)   => api.post('/api/transfers', data);

// ----- Participants -----
export const getParticipants = () => api.get('/api/participants');
export const createParticipant = (data: any) => api.post('/api/participants', data);
export const updateParticipant = (id: string, data: any) => api.patch(`/api/participants/${id}`, data);

// ----- Audit -----
export const getAuditLog = (params?: any) => api.get('/api/audit', { params });
export const getRecentAudit = () => api.get('/api/audit/recent');

// ----- Dashboard -----
export const getDashboardStats = () => api.get('/api/dashboard/stats');

// ----- Verify (public) -----
export const verifyProduct = (id: string) => api.get(`/api/verify/${id}`);
export const getQrCode = (id: string) => `${API_BASE}/api/verify/qr/${id}`;
