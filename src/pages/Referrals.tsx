import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, Search, Printer, MessageCircle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const referralSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  reason: z.string().min(1, 'سبب التحويل مطلوب'),
  destination: z.string().min(1, 'الجهة المحول إليها مطلوبة'),
});

type ReferralForm = z.infer<typeof referralSchema>;

export default function Referrals() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReferralForm>({
    resolver: zodResolver(referralSchema),
  });

  const fetchData = async () => {
    try {
      const [referralsData, studentsData] = await Promise.all([
        apiFetch('/api/referrals'),
        apiFetch('/api/students')
      ]);
      setReferrals(referralsData);
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

  const onSubmit = async (data: ReferralForm) => {
    try {
      await apiFetch('/api/referrals', {
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
      console.error('Error saving referral:', error);
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.Grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="بحث في المحولين..."
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
          <span>تسجيل تحويل جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">التاريخ</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الطالب</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الصف</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">سبب التحويل</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">الجهة</th>
              <th className="px-4 py-3 text-sm font-semibold text-slate-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
            ) : filteredReferrals.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">لا توجد تحويلات</td></tr>
            ) : (
              filteredReferrals.map((item) => (
                <tr key={item.Id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm">
                    {format(new Date(item.DateTime), 'yyyy/MM/dd', { locale: ar })}
                  </td>
                  <td className="px-4 py-4 font-medium">{item.StudentName}</td>
                  <td className="px-4 py-4">{item.Grade}</td>
                  <td className="px-4 py-4">{item.Reason}</td>
                  <td className="px-4 py-4">{item.Destination}</td>
                  <td className="px-4 py-4 flex gap-2">
                    <button className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors">
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">تسجيل تحويل جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">سبب التحويل</label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الجهة المحول إليها</label>
                <input
                  {...register('destination')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="مثال: مركز صحي..."
                />
                {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>}
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
                  حفظ التحويل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
