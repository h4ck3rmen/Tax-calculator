import * as XLSX from 'xlsx';

const data = [
  { MaNV: 'NV001', HoTen: 'Nguyễn Văn A', DonVi: 'Phòng Kế Toán', MaSoThue: '0101234567', SoCCCD: '001090123456' },
  { MaNV: 'NV002', HoTen: 'Trần Thị B', DonVi: 'Phòng Kỹ Thuật', MaSoThue: '0101234568', SoCCCD: '001090123457' },
  { MaNV: 'NV003', HoTen: 'Lê Văn C', DonVi: 'Phòng Hành Chính', MaSoThue: '0101234569', SoCCCD: '001090123458' },
  { MaNV: 'NV004', HoTen: 'Phạm Thị D', DonVi: 'Ban Giám Đốc', MaSoThue: '0108999111', SoCCCD: '030190123999' },
  { MaNV: 'NV005', HoTen: 'Hoàng Văn E', DonVi: 'Phòng Kinh Doanh', MaSoThue: '0102223334', SoCCCD: '034190123444' }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, "NhanVien");
XLSX.writeFile(wb, "DanhSachNhanVien_Mock.xls");

// Đồng thời tạo luôn file cho import Lương để tiện test
const dataLuong = [
  { MaNV: 'NV001', HoTen: 'Nguyễn Văn A', MaSoThue: '0101234567', TongThuNhap: 45000000, KhgChiuThue: 2000000, BaoHiem: 3000000 },
  { MaNV: 'NV002', HoTen: 'Trần Thị B', MaSoThue: '0101234568', TongThuNhap: 15000000, KhgChiuThue: 1000000, BaoHiem: 1500000 },
  { MaNV: 'NV003', HoTen: 'Lê Văn C', MaSoThue: '0101234569', TongThuNhap: 8000000, KhgChiuThue: 500000, BaoHiem: 840000 },
  { MaNV: 'NV004', HoTen: 'Phạm Thị D', MaSoThue: '0108999111', TongThuNhap: 120000000, KhgChiuThue: 5000000, BaoHiem: 8000000 },
  { MaNV: 'NV005', HoTen: 'Hoàng Văn E', MaSoThue: '0102223334', TongThuNhap: 22000000, KhgChiuThue: 1500000, BaoHiem: 2000000 }
];
const wbLuong = XLSX.utils.book_new();
const wsLuong = XLSX.utils.json_to_sheet(dataLuong);
XLSX.utils.book_append_sheet(wbLuong, wsLuong, "BangLuong");
XLSX.writeFile(wbLuong, "ThuNhap_Thang_Mock.xls");

console.log("Da tao 2 file excel thanh cong!");
