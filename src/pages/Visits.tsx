import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, Search, Printer, MessageCircle, X, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { sendWhatsAppOnWindows } from '../utils/whatsapp';
import PrintHeader from '../components/PrintHeader';

const visitSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  diagnosis: z.string().min(1, 'التشخيص مطلوب'),
  treatment: z.string().min(1, 'العلاج مطلوب'),
  paracSyrup: z.boolean().optional(),
  paracTab: z.boolean().optional(),
  hyoscine: z.boolean().optional(),
  referred: z.boolean().optional(),
  referralTime: z.string().optional(),
});

type VisitForm = z.infer<typeof visitSchema>;

export default function Visits() {
  const [visits, setVisits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
  });

  const isReferred = watch('referred');

  const fetchData = async () => {
    try {
      const [visitsData, studentsData] = await Promise.all([
        apiFetch('/api/visits'),
        apiFetch('/api/students')
      ]);
      setVisits(visitsData);
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

  const onSubmit = async (data: VisitForm) => {
    try {
      await apiFetch('/api/visits', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          studentId: parseInt(data.studentId),
          paracSyrup: data.paracSyrup ? 1 : 0,
          paracTab: data.paracTab ? 1 : 0,
          hyoscine: data.hyoscine ? 1 : 0,
        }),
      });
      setIsModalOpen(false);
      reset();
      fetchData();
    } catch (error) {
      console.error('Error saving visit:', error);
    }
  };

  const sendWhatsApp = async (visit: any) => {
    if (!visit.Phone) {
      alert('لا يوجد رقم هاتف لهذا الطالب');
      return;
    }
    
    const message = `إشعار من الصحة المدرسية:
الطالب: ${visit.StudentName}
الصف: ${visit.Grade}
التشخيص: ${visit.Diagnosis}
العلاج: ${visit.Treatment}
${visit.Referred ? 'تم تحويل الطالب للمركز الصحي' : ''}
نتمنى له الشفاء العاجل.`;

    sendWhatsAppOnWindows(visit.Phone, message);

    try {
      await apiFetch(`/api/visits/${visit.Id}/whatsapp`, { method: 'PUT' });
      fetchData();
    } catch (error) {
      console.error('Error updating whatsapp status:', error);
    }
  };

  const filteredVisits = visits.filter(visit =>
    visit.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.Grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <PrintHeader title="سجل المترددين اليومي" />
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="بحث في السجل..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Printer size={20} />
            <span>طباعة السجل</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={20} />
            <span>تسجيل زيارة جديدة</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">التاريخ/الوقت</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الطالب</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الصف</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">التشخيص</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">العلاج</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الأدوية</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">تحويل</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600 print:hidden">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8">جاري التحميل...</td></tr>
            ) : filteredVisits.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-slate-500">لا توجد سجلات</td></tr>
            ) : (
              filteredVisits.map((visit) => (
                <tr key={visit.Id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm">
                    {format(new Date(visit.DateTime), 'yyyy/MM/dd HH:mm', { locale: ar })}
                  </td>
                  <td className="px-4 py-4 font-medium">{visit.StudentName}</td>
                  <td className="px-4 py-4">{visit.Grade}</td>
                  <td className="px-4 py-4">{visit.Diagnosis}</td>
                  <td className="px-4 py-4">{visit.Treatment}</td>
                  <td className="px-4 py-4 text-xs space-y-1">
                    {visit.ParacSyrup === 1 && <span className="block bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Parac Syrup</span>}
                    {visit.ParacTab === 1 && <span className="block bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Parac Tab</span>}
                    {visit.Hyoscine === 1 && <span className="block bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Hyoscine</span>}
                  </td>
                  <td className="px-4 py-4">
                    {visit.Referred === 1 ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">نعم</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 flex gap-2 print:hidden">
                    <button 
                      onClick={() => sendWhatsApp(visit)}
                      className={`p-1.5 rounded-lg transition-colors ${visit.WhatsAppNotified ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600'}`}
                      title="إرسال واتساب"
                    >
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
              <h3 className="text-xl font-bold text-slate-800">تسجيل زيارة جديدة</h3>
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
                      <option key={s.Id} value={s.Id}>{s.Name} - {s.Grade}</option>
                    ))}
                  </select>
                  {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">التشخيص</label>
                  <input
                    {...register('diagnosis')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="مثال: صداع، مغص..."
                  />
                  {errors.diagnosis && <p className="text-red-500 text-sm mt-1">{errors.diagnosis.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">العلاج</label>
                  <input
                    {...register('treatment')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="مثال: راحة، مسكن..."
                  />
                  {errors.treatment && <p className="text-red-500 text-sm mt-1">{errors.treatment.message}</p>}
                </div>

                <div className="col-span-2 space-y-3">
                  <label className="block text-sm font-medium text-slate-700">الأدوية المصروفة</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('paracSyrup')} className="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm">Paracetamol Syrup</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('paracTab')} className="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm">Paracetamol Tab</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" {...register('hyoscine')} className="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span className="text-sm">Hyoscine</span>
                    </label>
                  </div>
                </div>

                <div className="col-span-2 border-t border-slate-200 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input type="checkbox" {...register('referred')} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    <span className="font-medium text-slate-800">تحويل للمركز الصحي</span>
                  </label>

                  {isReferred && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">وقت التحويل</label>
                      <input
                        type="time"
                        {...register('referralTime')}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  )}
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
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
