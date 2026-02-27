import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const settingsSchema = z.object({
  schoolName: z.string().min(1, 'اسم المدرسة مطلوب'),
  supervisorName: z.string().min(1, 'اسم المشرف مطلوب'),
  logoPath: z.string().optional(),
  dailyClosingTime: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/api/settings');
        setValue('schoolName', data.SchoolName);
        setValue('supervisorName', data.SupervisorName);
        setValue('logoPath', data.LogoPath);
        setValue('dailyClosingTime', data.DailyClosingTime);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [setValue]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('فشل حفظ الإعدادات');
    }
  };

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إعدادات النظام</h2>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المدرسة</label>
            <input
              {...register('schoolName')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم المشرف الصحي</label>
            <input
              {...register('supervisorName')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {errors.supervisorName && <p className="text-red-500 text-sm mt-1">{errors.supervisorName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">مسار الشعار (URL أو مسار محلي)</label>
            <input
              {...register('logoPath')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">وقت الإغلاق اليومي</label>
            <input
              type="time"
              {...register('dailyClosingTime')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">لن يتم السماح بتعديل السجلات بعد هذا الوقت.</p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Save size={20} />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
