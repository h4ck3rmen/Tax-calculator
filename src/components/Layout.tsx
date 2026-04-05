import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Users, UserPlus, Calculator, History, LogOut } from 'lucide-react';

export default function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Quản lý Nhân viên', path: '/', icon: Users },
    { name: 'Quản lý Người phụ thuộc', path: '/dependents', icon: UserPlus },
    { name: 'Tính Thuế & Import', path: '/tax-calc', icon: Calculator },
    { name: 'Lịch sử đóng Thuế', path: '/history', icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Calculator className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-lg font-bold text-gray-900">Tính Thuế TNCN</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500 mb-4 px-2 truncate" title={user?.email}>
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
