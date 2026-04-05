import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MonthlyTaxRecord } from '../types/database';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';

type ExtendedRecord = MonthlyTaxRecord & {
  employees: {
    employee_code: string;
    full_name: string;
    department: string;
  }
};

export default function History() {
  const [records, setRecords] = useState<ExtendedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_tax_records')
        .select(`
          *,
          employees (employee_code, full_name, department)
        `)
        .eq('month_year', `${selectedMonth}-01`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data as unknown as ExtendedRecord[] || []);
    } catch (error: any) {
      alert('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => 
    r.employees?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.employees?.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTax = filteredRecords.reduce((acc, curr) => acc + curr.tax_amount, 0);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Lịch sử đóng Thuế TNCN</h1>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm Theo Mã, Tên NV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 block w-full sm:w-64 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Kỳ tính thuế</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{selectedMonth ? format(parseISO(`${selectedMonth}-01`), 'MM/yyyy') : '--'}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-500">Số lượng nhân viên có dữ liệu</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{filteredRecords.length} người</div>
        </div>
        <div className="bg-primary/10 p-4 rounded-lg shadow-sm border border-primary/20">
          <div className="text-sm font-medium text-primary">Tổng thuế phải nộp</div>
          <div className="mt-1 text-2xl font-bold text-primary">{totalTax.toLocaleString()} VNĐ</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng ban</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng TN</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Số NPT</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">TN Tính Thuế</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-blue-700 uppercase">Thuế TNCN</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cập nhật lúc</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-4 text-center">Đang tải...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-4 text-center text-gray-500">Không có dữ liệu cho tháng này</td></tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.employees?.employee_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employees?.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.employees?.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 font-medium">{record.total_income.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{record.dependent_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-800">{record.taxable_income.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">{record.tax_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-400 text-xs">{format(new Date(record.created_at), 'dd/MM/yyyy HH:mm')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
