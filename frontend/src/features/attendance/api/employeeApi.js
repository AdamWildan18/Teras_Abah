import api from '../../../lib/axios';

export const employeeApi = {
  // Ambil daftar karyawan (filter role)
  getAll: () => api.get('/users?role=karyawan,kasir,produksi,admin,owner'),
  
  // Tambah karyawan baru
  create: (data) => api.post('/users', data),
  
  // Update data karyawan
  update: (id, data) => api.put(`/users/${id}`, data),
  
  // Hapus karyawan
  delete: (id) => api.delete(`/users/${id}`),
};