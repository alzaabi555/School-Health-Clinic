import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Activity, FileText, 
  Settings, LogOut, UserPlus, Archive, ClipboardList 
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard },
    { name: 'الطلاب', path: '/students', icon: Users },
    { name: 'سجل المترددين', path: '/visits', icon: Activity },
    { name: 'الحالات الخاصة', path: '/special-cases', icon: ClipboardList },
    { name: 'المحولين', path: '/referrals', icon: FileText },
    { name: 'الأرشيف', path: '/archive', icon: Archive },
    { name: 'الإعدادات', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-800 text-white flex flex-col print:hidden">
        <div className="p-6 text-center border-b border-emerald-700">
          <h1 className="text-xl font-bold leading-tight">نظام إدارة غرفة الصحة المدرسية</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                  isActive ? 'bg-emerald-700 text-white' : 'text-emerald-100 hover:bg-emerald-700/50 hover:text-white'
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{user?.username}</div>
              <div className="text-xs text-emerald-200">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-semibold text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.name || ''}
          </h2>
          <div className="text-sm text-slate-500">
            {new Date().toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
