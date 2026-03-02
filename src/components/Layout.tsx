import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { 
  LayoutDashboard, Users, Activity, FileText, 
  Settings, LogOut, UserPlus, Archive, ClipboardList, Stethoscope
} from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [supervisorName, setSupervisorName] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/api/settings');
        if (data.SupervisorName) {
          setSupervisorName(data.SupervisorName);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const navItems = [
    { name: 'الرئيسية', path: '/', icon: LayoutDashboard },
    { name: 'الطلاب', path: '/students', icon: Users },
    { name: 'سجل المترددين', path: '/visits', icon: Activity },
    { name: 'الحالات الخاصة', path: '/special-cases', icon: ClipboardList },
    { name: 'المحولين', path: '/referrals', icon: FileText },
    { name: 'مواعيد العيادات التخصصية', path: '/clinic-appointments', icon: Stethoscope },
    { name: 'الأرشيف', path: '/archive', icon: Archive },
    { name: 'الإعدادات', path: '/settings', icon: Settings },
  ];

  const displayName = supervisorName || user?.username || 'المشرف الصحي';

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
        <div className="p-4 border-t border-emerald-700 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold shadow-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{displayName}</div>
              <div className="text-xs text-emerald-200">{user?.role}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-700/50 flex flex-col items-center justify-center gap-2 text-emerald-200/80">
            <span className="text-xs font-medium tracking-wide">إعداد وتصميم</span>
            <img 
              src="/developer-logo.png" 
              alt="محمد الزعابي" 
              className="h-20 object-contain drop-shadow-md transition-transform hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-sm font-bold text-emerald-100 hidden">محمد الزعابي</span>
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
