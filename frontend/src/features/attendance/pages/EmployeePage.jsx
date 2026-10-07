import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/employeeApi';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

export default function EmployeePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeApi.getAll,
  });

  const employees = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: employeeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      toast.success('Karyawan berhasil ditambahkan');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal menambahkan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      setEditingEmployee(null);
      toast.success('Data karyawan berhasil diupdate');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Gagal mengupdate'),
  });

  const deleteMutation = useMutation({
    mutationFn: employeeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Karyawan berhasil dihapus');
    },
  });

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Yakin ingin menghapus karyawan ini?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Karyawan</h1>
          <p className="text-gray-500 text-sm">Kelola data karyawan untuk keperluan absensi</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Karyawan
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Belum ada data karyawan</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{emp.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      emp.role === 'kasir' ? 'bg-blue-100 text-blue-700' :
                      emp.role === 'produksi' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {emp.role?.toUpperCase() || 'KARYAWAN'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(emp)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <EmployeeFormModal
          employee={editingEmployee}
          onSubmit={(data) => {
            if (editingEmployee) {
              updateMutation.mutate({ id: editingEmployee.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onCancel={() => { setIsModalOpen(false); setEditingEmployee(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

// ==========================================
// FORM MODAL COMPONENT
// ==========================================
function EmployeeFormModal({ employee, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    password: '',
    role: employee?.role || 'karyawan',
    phone: employee?.phone || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = employee && !formData.password 
      ? { name: formData.name, email: formData.email, role: formData.role, phone: formData.phone }
      : formData;
    onSubmit(payload);
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={employee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
          <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password {employee ? '(Kosongkan jika tidak ingin diubah)' : '*'}</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required={!employee} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="karyawan">Karyawan Umum</option>
              <option value="kasir">Kasir</option>
              <option value="produksi">Dapur / Produksi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">No. HP</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg" placeholder="0812..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onCancel}>Batal</Button>
          <Button type="submit" loading={loading}>{employee ? 'Update' : 'Simpan'}</Button>
        </div>
      </form>
    </Modal>
  );
}