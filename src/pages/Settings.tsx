import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { Save, Upload, Download, Trash2, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const settingsSchema = z.object({
  schoolName: z.string().min(1, 'اسم المدرسة مطلوب'),
  supervisorName: z.string().min(1, 'اسم المشرف مطلوب'),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/api/settings');
        setValue('schoolName', data.SchoolName || '');
        setValue('supervisorName', data.SupervisorName || '');
        setLogoBase64(data.LogoPath || '');
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [setValue]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: SettingsForm) => {
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          logoPath: logoBase64
        }),
      });
      alert('تم حفظ الإعدادات بنجاح. قد تحتاج لتحديث الصفحة لتطبيق التغييرات في القائمة الجانبية والطباعة.');
      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('فشل حفظ الإعدادات');
    }
  };

  const handleBackup = async () => {
    try {
      const data = await apiFetch('/api/settings/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_school_health_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('فشل إنشاء النسخة الاحتياطية');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير: استعادة النسخة الاحتياطية ستقوم بمسح جميع البيانات الحالية واستبدالها. هل أنت متأكد؟')) {
      if (restoreInputRef.current) restoreInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const jsonData = JSON.parse(evt.target?.result as string);
        await apiFetch('/api/settings/restore', {
          method: 'POST',
          body: JSON.stringify(jsonData)
        });
        alert('تم استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة.');
        window.location.reload();
      } catch (error) {
        alert('فشل استعادة البيانات. تأكد من أن الملف صالح.');
      } finally {
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetYear = async () => {
    if (confirm('تحذير خطير جداً: هل أنت متأكد من رغبتك في حذف جميع بيانات الطلاب والزيارات والمتابعات للبدء بعام دراسي جديد؟ هذا الإجراء لا يمكن التراجع عنه!')) {
      try {
        await apiFetch('/api/settings/reset-year', { method: 'DELETE' });
        alert('تم حذف جميع البيانات بنجاح. عام دراسي جديد سعيد!');
        window.location.reload();
      } catch (error) {
        alert('فشل حذف البيانات. تأكد من أنك تملك صلاحية (مدير).');
      }
    }
  };

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إعدادات النظام</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-2">المعلومات الأساسية</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المدرسة</label>
              <input
                {...register('schoolName')}
                placeholder="أدخل اسم المدرسة"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.schoolName && <p className="text-red-500 text-sm mt-1">{errors.schoolName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المشرف الصحي</label>
              <input
                {...register('supervisorName')}
                placeholder="أدخل اسم المشرف الصحي"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.supervisorName && <p className="text-red-500 text-sm mt-1">{errors.supervisorName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">شعار المدرسة (يظهر في التقارير)</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="text-slate-400" size={24} />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                  >
                    اختيار صورة
                  </button>
                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64('')}
                      className="text-red-500 text-sm mr-3 hover:underline"
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors w-full justify-center"
              >
                <Save size={20} />
                <span>حفظ التغييرات</span>
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-2">النسخ الاحتياطي</h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">قم بحفظ نسخة من بياناتك لتجنب فقدانها، أو استعد نسخة سابقة.</p>
              
              <button
                onClick={handleBackup}
                className="flex items-center justify-center gap-2 w-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-xl hover:bg-blue-100 transition-colors font-medium"
              >
                <Download size={20} />
                <span>تحميل نسخة احتياطية</span>
              </button>

              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={restoreInputRef}
                onChange={handleRestore}
              />
              <button
                onClick={() => restoreInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors font-medium"
              >
                <Upload size={20} />
                <span>استعادة من نسخة احتياطية</span>
              </button>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-2xl shadow-sm border border-red-100">
            <h3 className="text-lg font-semibold text-red-800 mb-4 border-b border-red-200 pb-2">منطقة الخطر</h3>
            <p className="text-sm text-red-600 mb-6">هذا الإجراء سيقوم بحذف جميع بيانات الطلاب والزيارات والمتابعات بشكل نهائي للبدء بعام دراسي جديد.</p>
            
            <button
              onClick={handleResetYear}
              className="flex items-center justify-center gap-2 w-full bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm"
            >
              <Trash2 size={20} />
              <span>حذف كافة المعلومات للسنة الجديدة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
