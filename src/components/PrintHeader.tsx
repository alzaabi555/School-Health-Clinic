import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export default function PrintHeader({ title }: { title: string }) {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/api/settings');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  if (!settings) return null;

  return (
    <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-900">{settings.SchoolName || 'اسم المدرسة غير محدد'}</h1>
          <p className="text-slate-600 mt-1">غرفة الصحة المدرسية</p>
          <p className="text-slate-600">المشرف الصحي: {settings.SupervisorName || 'غير محدد'}</p>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 underline underline-offset-8 decoration-2">{title}</h2>
          <p className="text-slate-500 mt-2 text-sm">
            تاريخ الطباعة: {new Date().toLocaleDateString('ar-OM')}
          </p>
        </div>

        <div className="w-24 h-24 flex items-center justify-center">
          {settings.LogoPath ? (
            <img src={settings.LogoPath} alt="شعار المدرسة" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center p-2">
              لا يوجد شعار
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
