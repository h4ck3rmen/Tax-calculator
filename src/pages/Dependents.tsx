import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import type { Employee, Dependent } from '../types/database';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Dependents() {
  const { user } = useAuth();
  const [dependents, setDependents] = useState<(Dependent & { employees: { employee_code: string, full_name: string } })[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [idCard, setIdCard] = useState('');
  const [deductionStart, setDeductionStart] = useState('');
  const [deductionEnd, setDeductionEnd] = useState('');
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Parallel fetch
      const [depRes, empRes] = await Promise.all([
        supabase
          .from('dependents')
          .select('*, employees(employee_code, full_name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('employees')
          .select('*')
          .order('full_name', { ascending: true })
      ]);

      if (depRes.error) throw depRes.error;
      if (empRes.error) throw empRes.error;

      setDependents(depRes.data as any || []);
      setEmployees(empRes.data || []);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingDependent(null);
    setEmployeeId('');
    setFullName('');
    setRelationship('');
    setDateOfBirth('');
    setTaxCode('');
    setIdCard('');
    setDeductionStart('');
    setDeductionEnd('');
    setIsInactive(false);
    setIsModalOpen(true);
  };

  const openEditModal = (dep: Dependent) => {
    setEditingDependent(dep);
    setEmployeeId(dep.employee_id);
    setFullName(dep.full_name);
    setRelationship(dep.relationship || '');
    setDateOfBirth(dep.date_of_birth ? dep.date_of_birth.substring(0, 10) : '');
    setTaxCode(dep.tax_code || '');
    setIdCard(dep.id_card || '');
    setDeductionStart(dep.deduction_start_month ? dep.deduction_start_month.substring(0, 10) : '');
    setDeductionEnd(dep.deduction_end_month ? dep.deduction_end_month.substring(0, 10) : '');
    setIsInactive(dep.is_inactive);
    setIsModalOpen(true);
  };

  const saveDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!employeeId) {
      alert('Vui lòng chọn nhân viên!');
      return;
    }

    const payload = {
      employee_id: employeeId,
      full_name: fullName,
      relationship,
      date_of_birth: dateOfBirth || null,
      tax_code: taxCode || null,
      id_card: idCard || null,
      deduction_start_month: deductionStart ? `${deductionStart}-01` : null, // Assuming YYYY-MM
      deduction_end_month: deductionEnd ? `${deductionEnd}-01` : null, // Using 1st day of month
      is_inactive: isInactive,
      user_id: user.id
    };

    // If inputs are type="month" (YYYY-MM), we append -01 to make it a valid valid DB DATE.
    const startStr = deductionStart && deductionStart.length === 7 ? `${deductionStart}-01` : deductionStart || null;
    const endStr = deductionEnd && deductionEnd.length === 7 ? `${deductionEnd}-01` : deductionEnd || null;
    payload.deduction_start_month = startStr;
    payload.deduction_end_month = endStr;

    try {
      if (editingDependent) {
        const { error } = await supabase
          .from('dependents')
          .update(payload)
          .eq('id', editingDependent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dependents')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const deleteDependent = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá người phụ thuộc này?')) return;
    try {
      const { error } = await supabase.from('dependents').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Người phụ thuộc</h1>
        <button
          onClick={openAddModal}
          className="bg-primary text-white px-4 py-2 rounded-md shadow-sm hover:bg-primary-hover flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm NPT mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên NPT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thuộc Nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quan hệ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian GT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Đang tải...</td></tr>
              ) : dependents.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Chưa có người phụ thuộc nào được tạo</td></tr>
              ) : (
                dependents.map((dep) => (
                  <tr key={dep.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dep.full_name}
                      <div className="text-xs text-gray-500 mt-1">CCCD: {dep.id_card || 'Không có'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium text-gray-900">{dep.employees?.full_name}</div>
                      <div className="text-xs text-gray-500">Mã NV: {dep.employees?.employee_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dep.relationship || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Từ: {dep.deduction_start_month ? format(parseISO(dep.deduction_start_month), 'MM/yyyy') : '-'} <br/>
                      Đến: {dep.deduction_end_month ? format(parseISO(dep.deduction_end_month), 'MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {dep.is_inactive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Không giảm trừ</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đang Giảm trừ</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(dep)} className="text-primary hover:text-primary-hover mr-3">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteDependent(dep.id)} className="text-red-600 hover:text-red-900">
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
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {editingDependent ? 'Chỉnh sửa Người phụ thuộc' : 'Thêm Người phụ thuộc mới'}
                </h3>
                <form onSubmit={saveDependent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Nhân viên liên kết *</label>
                      <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option value="">-- Chọn Nhân viên --</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.employee_code} - {emp.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Họ tên người phụ thuộc *</label>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mối quan hệ</label>
                      <input type="text" placeholder="Con cái, Vợ chồng..." value={relationship} onChange={e => setRelationship(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                      <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mã Số Thuế (nếu có)</label>
                      <input type="text" value={taxCode} onChange={e => setTaxCode(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Số CCCD</label>
                      <input type="text" value={idCard} onChange={e => setIdCard(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giảm trừ từ tháng</label>
                      <input type="month" value={deductionStart ? deductionStart.substring(0,7) : ''} onChange={e => setDeductionStart(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giảm trừ đến tháng</label>
                      <input type="month" value={deductionEnd ? deductionEnd.substring(0,7) : ''} onChange={e => setDeductionEnd(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>

                    <div className="col-span-2 flex items-center mt-2">
                      <input id="isInactive" type="checkbox" checked={isInactive} onChange={e => setIsInactive(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                      <label htmlFor="isInactive" className="ml-2 block text-sm text-gray-900">
                        Đánh dấu không còn sử dụng (không tính giảm trừ)
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none sm:col-start-2 sm:text-sm">
                      Lưu lại
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm">
                      Hủy bỏ
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
