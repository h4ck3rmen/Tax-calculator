import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import type { Employee } from '../types/database';
import { Plus, Edit2, Trash2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [employeeCode, setEmployeeCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [idCard, setIdCard] = useState('');
  const [isResigned, setIsResigned] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    setEmployeeCode('');
    setFullName('');
    setDepartment('');
    setTaxCode('');
    setIdCard('');
    setIsResigned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeCode(emp.employee_code);
    setFullName(emp.full_name);
    setDepartment(emp.department || '');
    setTaxCode(emp.tax_code || '');
    setIdCard(emp.id_card || '');
    setIsResigned(emp.is_resigned);
    setIsModalOpen(true);
  };

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      employee_code: employeeCode,
      full_name: fullName,
      department,
      tax_code: taxCode,
      id_card: idCard,
      is_resigned: isResigned,
      user_id: user.id
    };

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(payload)
          .eq('id', editingEmployee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá nhân viên này?')) return;
    try {
      const { error } = await supabase.from('employees').delete().eq('id', id);
      if (error) throw error;
      fetchEmployees();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Cần map data từ Excel -> Database Fields
        const newEmployees = data.map((row: any) => ({
          employee_code: String(row.MaNV || ''),
          full_name: String(row.HoTen || ''),
          department: String(row.DonVi || ''),
          tax_code: String(row.MaSoThue || ''),
          id_card: String(row.SoCCCD || ''),
          is_resigned: false,
          user_id: user.id
        })).filter(emp => emp.employee_code && emp.full_name);

        if (newEmployees.length === 0) {
          alert('Không tìm thấy dữ liệu hợp lệ. Cột cần: MaNV, HoTen, DonVi, MaSoThue, SoCCCD');
          return;
        }

        const { error } = await supabase.from('employees').upsert(newEmployees, { onConflict: 'employee_code' });
        if (error) throw error;
        
        alert(`Đã import thành công ${newEmployees.length} nhân viên (có thể ghi đè nếu trùng mã)`);
        fetchEmployees();
      } catch (error: any) {
        alert('Lỗi import file: ' + error.message);
      }
      
      // Reset input
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhân viên</h1>
        <div className="flex space-x-3">
          <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={importExcel} />
          </label>
          <button
            onClick={openAddModal}
            className="bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-primary-hover flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã NV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng ban</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Số Thuế</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Đang tải...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.tax_code || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {emp.is_resigned ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Đã nghỉ việc</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đang làm việc</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(emp)} className="text-primary hover:text-primary-hover mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </h3>
                <form onSubmit={saveEmployee} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mã NV *</label>
                      <input type="text" required value={employeeCode} onChange={e => setEmployeeCode(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Họ tên *</label>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Đơn vị / Phòng ban</label>
                      <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mã Số Thuế</label>
                      <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Số CCCD</label>
                      <input type="text" value={idCard} onChange={e => setIdCard(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div className="col-span-2 flex items-center mt-2">
                      <input id="isResigned" type="checkbox" checked={isResigned} onChange={e => setIsResigned(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                      <label htmlFor="isResigned" className="ml-2 block text-sm text-gray-900">
                        Đánh dấu nhân viên đã nghỉ việc
                      </label>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none sm:col-start-2 sm:text-sm">
                      Lưu lại
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm">
                      Hủy báo
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
