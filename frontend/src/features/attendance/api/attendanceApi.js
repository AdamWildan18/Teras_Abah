import api from '../../../lib/axios';

export const attendanceApi = {
  // Get absensi hari ini
  getToday: (params) => api.get('/attendance/today', { params }),
  
  // ✅ LAPORAN ABSENSI: Pastikan { params } ada di dalam kurung kurawal
  getReport: (params) => api.get('/attendance/report', { params }),
  
  // Scan QR Code
  scan: (data) => api.post('/attendance/scan', data),
  
  // Input manual (admin)
  inputManual: (data) => api.post('/attendance/manual', data),
  
  // Get QR Code user
  getQrCode: (userId) => api.get(`/attendance/qr-code/${userId}`),
  
  // Generate QR Code baru
  generateQrCode: (userId) => api.post(`/attendance/qr-code/${userId}/generate`),
  
  // Riwayat absensi
  getHistory: (params) => api.get('/attendance/history', { params }),
};