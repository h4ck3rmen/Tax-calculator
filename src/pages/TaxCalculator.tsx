import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { calculatePIT } from '../lib/tax-calculator';
import { Upload, Save } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

type PreviewRow = {
  employee_id: string;
  MaNV: string;
  HoTen: string;
  TongThuNhap: number;
  KhgChiuThue: number;
  BaoHiem: number;
  dependent_count: number;
  taxableIncome: number;
  taxAmount: number;
  error?: string;
};

export default function TaxCalculator() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsProcessing(true);
    setPreviewData([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Fetch all employees and their active dependents
        const { data: employees } = await supabase.from('employees').select('id, employee_code, full_name, is_resigned');
        const { data: dependents } = await supabase.from('dependents').select('employee_id, is_inactive, deduction_start_month, deduction_end_month');

        const [year, month] = selectedMonth.split('-');
        const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);

        const parsedData = data.map((row: any) => {
          const maNV = String(row.MaNV || '');
          const emp = employees?.find(e => e.employee_code === maNV);
          
          let error = '';
          if (!emp) {
            error = 'Không tìm thấy Mã NV trên hệ thống';
          } else if (emp.is_resigned) {
             error = 'Nhân viên đã nghỉ việc';
          }

          // Count valid dependents
          let depCount = 0;
          if (emp && dependents) {
            depCount = dependents.filter(d => {
              if (d.employee_id !== emp.id || d.is_inactive) return false;
              
              let isValid = true;
              if (d.deduction_start_month) {
                const start = new Date(d.deduction_start_month);
                if (targetDate < start) isValid = false;
              }
              if (d.deduction_end_month) {
                const end = new Date(d.deduction_end_month);
                // deduction_end_month is the last valid month
                if (targetDate > end) isValid = false;
              }
              return isValid;
            }).length;
          }

          const tongThuNhap = Number(row.TongThuNhap) || 0;
          const khgChiuThue = Number(row.KhgChiuThue) || 0;
          const baoHiem = Number(row.BaoHiem) || 0;

          const taxResult = calculatePIT(tongThuNhap, khgChiuThue, baoHiem, depCount);

          return {
            employee_id: emp?.id || '',
            MaNV: maNV,
            HoTen: String(row.HoTen || ''),
            TongThuNhap: tongThuNhap,
            KhgChiuThue: khgChiuThue,
            BaoHiem: baoHiem,
            dependent_count: depCount,
            taxableIncome: taxResult.taxableIncome,
            taxAmount: taxResult.taxAmount,
            error
          };
        });

        setPreviewData(parsedData);
      } catch (error: any) {
        alert('Lỗi đọc file: ' + error.message);
      } finally {
         setIsProcessing(false);
         e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const processSaveData = async () => {
    if (!user) return;
    
    const validData = previewData.filter(d => !d.error);
    if (validData.length === 0) {
      alert('Không có dữ liệu hợp lệ để lưu!');
      return;
    }

    setIsProcessing(true);
    try {
      const recordsToInsert = validData.map(d => ({
        employee_id: d.employee_id,
        month_year: `${selectedMonth}-01`,
        total_income: d.TongThuNhap,
        tax_exempt_income: d.KhgChiuThue,
        insurance_deduction: d.BaoHiem,
        dependent_count: d.dependent_count,
        taxable_income: d.taxableIncome,
        tax_amount: d.taxAmount,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('monthly_tax_records')
        .upsert(recordsToInsert, { onConflict: 'employee_id, month_year' });

      if (error) throw error;
      
      alert(`Đã lưu thành công ${recordsToInsert.length} bản ghi!`);
      setPreviewData([]);
    } catch (error: any) {
      alert('Lỗi lưu dữ liệu: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tính Thuế & Import Dữ Liệu</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h2 className="text-lg font-medium mb-4">Nhập liệu thu nhập hàng tháng</h2>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Tháng/Năm giảm trừ</label>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"
              disabled={isProcessing || previewData.length > 0}
            />
          </div>
          
          <div className="flex-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (Excel)</label>
             <label className={`cursor-pointer bg-blue-50 border border-blue-200 text-primary hover:bg-blue-100 flex justify-center py-2 px-4 rounded-md shadow-sm items-center transition-colors ${previewData.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
               <Upload className="w-5 h-5 mr-2" />
               {isProcessing ? 'Đang xử lý...' : 'Chọn file báo cáo Thu nhập'}
               <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isProcessing || previewData.length > 0} />
             </label>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          File excel cần có các cột: <strong>MaNV, HoTen, MaSoThue, TongThuNhap, KhgChiuThue, BaoHiem</strong>.
        </p>
      </div>

      {previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-base font-semibold text-gray-800">Xem trước kết quả tính thuế ({selectedMonth})</h3>
            <div className="space-x-3">
              <button 
                onClick={() => setPreviewData([])}
                className="px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Hủy file
              </button>
              <button 
                onClick={processSaveData}
                disabled={isProcessing || previewData.filter(d => !d.error).length === 0}
                className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 flex items-center disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" /> 
                {isProcessing ? 'Đang lưu...' : 'Lưu lại CSDL'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ Tên (Excel)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng TN</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Khg. chịu thuế</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bảo hiểm</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">NPT hợp lệ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-blue-50">TN Tính Thuế</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-blue-700 uppercase bg-blue-50">Thuế phải nộp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {previewData.map((row, idx) => (
                  <tr key={idx} className={row.error ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2 font-medium text-gray-900">{row.MaNV}</td>
                    <td className="px-4 py-2 text-gray-600">{row.HoTen}</td>
                    <td className="px-4 py-2 text-right">{row.TongThuNhap.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{row.KhgChiuThue.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{row.BaoHiem.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center font-bold text-gray-700">{row.dependent_count}</td>
                    <td className="px-4 py-2 text-right font-medium text-gray-800 bg-blue-50/30">{row.taxableIncome.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-bold text-red-600 bg-blue-50/30">{row.taxAmount.toLocaleString()}</td>
                    <td className="px-4 py-2 text-red-600 font-medium text-xs max-w-xs">{row.error || <span className="text-green-600">Hợp lệ</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
