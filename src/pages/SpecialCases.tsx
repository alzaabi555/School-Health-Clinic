import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, Search, Printer, MessageCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { sendWhatsAppOnWindows } from '../utils/whatsapp';
import PrintHeader from '../components/PrintHeader';

const specialCaseSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  followUpDate: z.string().min(1, 'تاريخ المتابعة مطلوب'),
  followUpType: z.string().min(1, 'نوع المتابعة مطلوب'),
  symptoms: z.string().min(1, 'الأعراض مطلوبة'),
  services: z.string().min(1, 'الخدمات المقدمة مطلوبة'),
  recommendations: z.string().optional(),
  referred: z.boolean().optional(),
});

type SpecialCaseForm = z.infer<typeof specialCaseSchema>;

export default function SpecialCases() {
  const [cases, setCases] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SpecialCaseForm>({
    resolver: zodResolver(specialCaseSchema),
  });

  const fetchData = async () => {
    try {
      const [casesData, studentsData] = await Promise.all([
        apiFetch('/api/special-cases'),
        apiFetch('/api/students')
      ]);
      setCases(casesData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: SpecialCaseForm) => {
    try {
      await apiFetch('/api/special-cases', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          studentId: parseInt(data.studentId),
          referred: data.referred ? 1 : 0,
        }),
      });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Error saving special case:', error);
    }
  };

  const sendWhatsApp = async (item: any) => {
    if (!item.Phone) {
      alert('لا يوجد رقم هاتف لهذا الطالب');
      return;
    }
    
    const message = `إشعار من الصحة المدرسية (متابعة حالة خاصة):
الطالب: ${item.StudentName}
الصف: ${item.Grade}
نوع المتابعة: ${item.FollowUpType}
الأعراض: ${item.Symptoms}
الخدمات المقدمة: ${item.Services}
${item.Referred ? 'تم تحويل الطالب للمركز الصحي' : ''}
نتمنى له دوام الصحة والعافية.`;

    sendWhatsAppOnWindows(item.Phone, message);

    try {
      // Assuming there's an endpoint to update whatsapp status for special cases
      await apiFetch(`/api/special-cases/${item.Id}/whatsapp`, { method: 'PUT' });
      fetchData();
    } catch (error) {
      console.error('Error updating whatsapp status:', error);
    }
  };

  const filteredCases = cases.filter(c =>
    c.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PrintHeader title="سجل متابعة الحالات الخاصة" />
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="بحث في الحالات..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          <span>تسجيل متابعة جديدة</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">تاريخ المتابعة</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الطالب</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">نوع المتابعة</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الأعراض</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الخدمات</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">تحويل</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8">جاري التحميل...</td></tr>
            ) : filteredCases.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-slate-500">لا توجد حالات</td></tr>
            ) : (
              filteredCases.map((item) => (
                <tr key={item.Id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm">
                    {format(new Date(item.FollowUpDate), 'yyyy/MM/dd', { locale: ar })}
                  </td>
                  <td className="px-4 py-4 font-medium">{item.StudentName}</td>
                  <td className="px-4 py-4">{item.FollowUpType}</td>
                  <td className="px-4 py-4">{item.Symptoms}</td>
                  <td className="px-4 py-4">{item.Services}</td>
                  <td className="px-4 py-4">
                    {item.Referred ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">نعم</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 flex gap-2">
                    <button onClick={() => sendWhatsApp(item)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors">
                      <MessageCircle size={18} />
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="طباعة"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">تسجيل متابعة حالة خاصة</h3>
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
                    {students.filter(s => s.IsSpecialCase).map(s => (
                      <option key={s.Id} value={s.Id}>{s.Name} - {s.Grade} ({s.ChronicCondition})</option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ المتابعة</label>
                  <input
                    type="date"
                    {...register('followUpDate')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.followUpDate && <p className="text-red-500 text-sm mt-1">{errors.followUpDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع المتابعة</label>
                  <select
                    {...register('followUpType')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">اختر...</option>
                    <option value="دورية">دورية</option>
                    <option value="طارئة">طارئة</option>
                    <option value="سنوية">سنوية</option>
                  </select>
                  {errors.followUpType && <p className="text-red-500 text-sm mt-1">{errors.followUpType.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">الأعراض</label>
                  <textarea
                    {...register('symptoms')}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.symptoms && <p className="text-red-500 text-sm mt-1">{errors.symptoms.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">الخدمات المقدمة</label>
                  <textarea
                    {...register('services')}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.services && <p className="text-red-500 text-sm mt-1">{errors.services.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">التوصيات</label>
                  <textarea
                    {...register('recommendations')}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('referred')} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="font-medium text-slate-800">تحويل للمركز الصحي</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  حفظ المتابعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
