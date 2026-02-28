import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { apiFetch } from '../utils/api';
import { Plus, Search, Printer, MessageCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { sendWhatsAppOnWindows } from '../utils/whatsapp';
import PrintHeader from '../components/PrintHeader';

const appointmentSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  date: z.string().min(1, 'تاريخ الكشف مطلوب'),
  healthProblem: z.string().min(1, 'المشكلة الصحية مطلوبة'),
  clinicName: z.string().min(1, 'العيادة التخصصية مطلوبة'),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function ClinicAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  const fetchData = async () => {
    try {
      const [appointmentsData, studentsData, settingsData] = await Promise.all([
        apiFetch('/api/clinic-appointments'),
        apiFetch('/api/students'),
        apiFetch('/api/settings')
      ]);
      setAppointments(appointmentsData);
      setStudents(studentsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: AppointmentForm) => {
    try {
      await apiFetch('/api/clinic-appointments', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          studentId: parseInt(data.studentId),
        }),
      });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const sendWhatsApp = async (item: any) => {
    if (!item.Phone) {
      alert('لا يوجد رقم هاتف لهذا الطالب');
      return;
    }
    
    const message = `نود إفادتكم بأنه تم فحص الطالب (${item.StudentName} - ${item.Grade}) من قبل الطبيب المختص.
وبناءً على التقييم للمشكلة الصحية: ${item.HealthProblem}
تم تسجيل موعد له في: ${item.ClinicName}
لاستكمال الإجراءات الطبية اللازمة.

ستصلكم رسالة نصية تتضمن تفاصيل الموعد المحدد في أقرب وقت.
مع خالص تمنياتنا للطالب بدوام الصحة والعافية.`;

    sendWhatsAppOnWindows(item.Phone, message);

    try {
      await apiFetch(`/api/clinic-appointments/${item.Id}/whatsapp`, { method: 'PUT' });
      fetchData();
    } catch (error) {
      console.error('Error updating whatsapp status:', error);
    }
  };

  const filteredAppointments = appointments.filter(a =>
    a.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.Grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ClinicName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-slate-800">مواعيد العيادات التخصصية</h2>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors font-medium"
          >
            <Printer size={20} />
            طباعة السجل
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            إضافة موعد
          </button>
        </div>
      </div>

      <div className="print:block hidden mb-8">
        <PrintHeader settings={settings} title="سجل مواعيد العيادات التخصصية" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث باسم الطالب، الصف، أو العيادة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">الطالب</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">الصف</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">المشكلة الصحية</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">العيادة التخصصية</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 print:hidden">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
              ) : filteredAppointments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">لا توجد مواعيد مسجلة</td></tr>
              ) : (
                filteredAppointments.map((item) => (
                  <tr key={item.Id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {format(new Date(item.Date), 'dd MMMM yyyy', { locale: ar })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{item.StudentName}</td>
                    <td className="px-6 py-4 text-slate-600">{item.Grade}</td>
                    <td className="px-6 py-4 text-slate-600">{item.HealthProblem}</td>
                    <td className="px-6 py-4 text-slate-600">{item.ClinicName}</td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => sendWhatsApp(item)}
                          className={`p-2 rounded-lg transition-colors ${
                            item.WhatsAppNotified 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          title={item.WhatsAppNotified ? 'تم إرسال رسالة واتساب' : 'إرسال رسالة واتساب'}
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">إضافة موعد عيادة تخصصية</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">الطالب</label>
                  <select
                    {...register('studentId')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">اختر الطالب...</option>
                    {students.map(s => (
                      <option key={s.Id} value={s.Id}>
                        {s.Name} - {s.Grade} {s.IsSpecialCase ? `(${s.ChronicCondition || 'حالة خاصة'})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الكشف</label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العيادة التخصصية</label>
                  <input
                    type="text"
                    {...register('clinicName')}
                    placeholder="مثال: عيادة العيون، عيادة الأسنان..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.clinicName && <p className="text-red-500 text-sm mt-1">{errors.clinicName.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">المشكلة الصحية</label>
                  <textarea
                    {...register('healthProblem')}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.healthProblem && <p className="text-red-500 text-sm mt-1">{errors.healthProblem.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  حفظ الموعد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
