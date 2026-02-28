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

const referralSchema = z.object({
  studentId: z.string().min(1, 'الطالب مطلوب'),
  age: z.string().min(1, 'العمر مطلوب'),
  gender: z.string().min(1, 'الجنس مطلوب'),
  history: z.string().min(1, 'التاريخ المرضي / الفحص السريري مطلوب'),
  reason: z.string().min(1, 'سبب التحويل مطلوب'),
  destination: z.string().min(1, 'الجهة المحول إليها مطلوبة'),
  referralTime: z.string().min(1, 'الوقت مطلوب'),
});

type ReferralForm = z.infer<typeof referralSchema>;

export default function Referrals() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printingReferral, setPrintingReferral] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReferralForm>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referralTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    }
  });

  const fetchData = async () => {
    try {
      const [referralsData, studentsData, settingsData] = await Promise.all([
        apiFetch('/api/referrals'),
        apiFetch('/api/students'),
        apiFetch('/api/settings')
      ]);
      setReferrals(referralsData);
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

  const handlePrint = (item: any) => {
    flushSync(() => {
      setPrintingReferral(item);
    });
    
    // Small delay to ensure browser paints the DOM before opening print dialog
    setTimeout(() => {
      window.print();
      setPrintingReferral(null);
    }, 100);
  };

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

  const sendWhatsApp = async (item: any) => {
    if (!item.Phone) {
      alert('لا يوجد رقم هاتف لهذا الطالب');
      return;
    }
    
    const message = `إشعار من الصحة المدرسية (تحويل طالب):
الطالب: ${item.StudentName}
الصف: ${item.Grade}
سبب التحويل: ${item.Reason}
تم تحويله إلى: ${item.Destination}
نتمنى له الشفاء العاجل.`;

    sendWhatsAppOnWindows(item.Phone, message);

    try {
      await apiFetch(`/api/referrals/${item.Id}/whatsapp`, { method: 'PUT' });
      fetchData();
    } catch (error) {
      console.error('Error updating whatsapp status:', error);
    }
  };

  const filteredReferrals = referrals.filter(r =>
    r.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.Grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Print Layout - Only visible when printing a specific referral */}
      {printingReferral && (
        <div className="hidden print:block w-full bg-white text-black" dir="ltr">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-4">
            <div className="w-1/2">
              <h1 className="text-5xl font-black tracking-tighter mb-2 uppercase">Student</h1>
              <h1 className="text-5xl font-black tracking-tighter uppercase">Referral Form</h1>
            </div>
            <div className="w-1/2 flex flex-col items-end text-right">
              {settings?.LogoPath && (
                <img src={settings.LogoPath} alt="Logo" className="h-24 object-contain mb-2" />
              )}
              <h3 className="font-bold text-lg">وزارة الصحة</h3>
              <p className="text-xs font-semibold uppercase">Directorate General of Primary Health Care</p>
              <p className="text-xs font-semibold uppercase">Department of School & University Health</p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex justify-between mb-8 text-sm font-bold">
            <div className="space-y-4 w-1/2">
              <div className="flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-32">School Name</span>
                <span>: {settings?.SchoolName}</span>
              </div>
              <div className="flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-32">Referral To</span>
                <span>: {printingReferral.Destination}</span>
              </div>
            </div>
            <div className="space-y-4 w-1/3">
              <div className="flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-16">Date</span>
                <span>: {format(new Date(printingReferral.DateTime), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-16">Time</span>
                <span>: {printingReferral.ReferralTime || format(new Date(printingReferral.DateTime), 'HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* Section A */}
          <div className="mb-6">
            <div className="bg-gray-200 flex items-center mb-4">
              <div className="bg-gray-800 text-white px-4 py-2 font-bold text-lg">A</div>
              <h2 className="px-4 font-bold tracking-widest uppercase">Personal Information</h2>
            </div>
            <div className="flex justify-between mb-4 text-sm font-bold">
              <div className="w-2/3 flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-40">Name of student:</span>
                <span className="flex-1">{printingReferral.StudentName}</span>
              </div>
              <div className="w-1/3 flex items-center justify-end gap-4">
                <span>Gender:</span>
                <div className="flex items-center gap-1">
                  <div className={`w-4 h-4 border border-black ${printingReferral.Gender === 'Male' ? 'bg-black' : ''}`}></div>
                  <span>Male</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-4 h-4 border border-black ${printingReferral.Gender === 'Female' ? 'bg-black' : ''}`}></div>
                  <span>Female</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <div className="w-1/3 flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-16">Age:</span>
                <span className="flex-1">{printingReferral.Age}</span>
              </div>
              <div className="w-1/3 flex border-b border-dotted border-gray-400 pb-1">
                <span className="w-16">Class:</span>
                <span className="flex-1">{printingReferral.Grade}</span>
              </div>
            </div>
          </div>

          {/* Section B */}
          <div className="mb-6">
            <div className="bg-gray-200 flex items-center mb-4">
              <div className="bg-gray-800 text-white px-4 py-2 font-bold text-lg">B</div>
              <h2 className="px-4 font-bold tracking-widest uppercase">History / Clinical Findings / Treatment</h2>
            </div>
            <div className="min-h-[100px] text-sm leading-8 border-b border-dotted border-gray-400" style={{ backgroundImage: 'linear-gradient(transparent 31px, #9ca3af 32px)', backgroundSize: '100% 32px' }}>
              {printingReferral.History || ' '}
            </div>
          </div>

          {/* Section C */}
          <div className="mb-6">
            <div className="bg-gray-200 flex items-center mb-4">
              <div className="bg-gray-800 text-white px-4 py-2 font-bold text-lg">C</div>
              <h2 className="px-4 font-bold tracking-widest uppercase">Reason for Referral</h2>
            </div>
            <div className="min-h-[64px] text-sm leading-8 border-b border-dotted border-gray-400 mb-8" style={{ backgroundImage: 'linear-gradient(transparent 31px, #9ca3af 32px)', backgroundSize: '100% 32px' }}>
              {printingReferral.Reason}
            </div>
            
            <div className="flex justify-between items-end mb-8">
              <div className="text-sm font-bold flex border-b border-dotted border-gray-400 pb-1 w-1/2">
                <span className="w-32">Referred by:</span>
                <span className="flex-1">{settings?.SupervisorName}</span>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-400">
              Sign /stamp of school
            </div>
          </div>

          {/* Section D */}
          <div className="mb-8">
            <div className="bg-gray-200 flex items-center mb-4">
              <div className="bg-gray-800 text-white px-4 py-2 font-bold text-lg">D</div>
              <h2 className="px-4 font-bold tracking-widest uppercase">Feedback to School Nurse and Management Plan</h2>
            </div>
            <div className="min-h-[128px] border-b border-dotted border-gray-400 mb-8" style={{ backgroundImage: 'linear-gradient(transparent 31px, #9ca3af 32px)', backgroundSize: '100% 32px' }}>
            </div>
            <div className="text-sm font-bold text-gray-400 mb-8">
              Sign /stamp of Health institution
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs font-bold mt-auto">
            <p>** Note :</p>
            <p>* Attach copy of investigation (if done) and copy of medical report (if available).</p>
          </div>
        </div>
      )}

      {/* Normal View */}
      <div className={printingReferral ? 'hidden' : 'block'}>
        <PrintHeader title="سجل الطلاب المحولين" />
        <div className="flex justify-between items-center mb-6 print:hidden">
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
              <span>تسجيل تحويل جديد</span>
            </button>
          </div>
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
                <th className="px-4 py-3 text-sm font-semibold text-slate-600 print:hidden">إجراءات</th>
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
                    <td className="px-4 py-4 flex gap-2 print:hidden">
                      <button 
                        onClick={() => sendWhatsApp(item)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors"
                        title="إرسال واتساب"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handlePrint(item)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        title="طباعة نموذج التحويل"
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">تسجيل تحويل جديد (النموذج الرسمي)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">الجهة المحول إليها (Referral To)</label>
                  <input
                    {...register('destination')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="مثال: مركز صحي..."
                  />
                  {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العمر (Age)</label>
                  <input
                    type="number"
                    {...register('age')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الجنس (Gender)</label>
                  <select
                    {...register('gender')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">اختر...</option>
                    <option value="Male">ذكر (Male)</option>
                    <option value="Female">أنثى (Female)</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">وقت التحويل (Time)</label>
                  <input
                    type="time"
                    {...register('referralTime')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.referralTime && <p className="text-red-500 text-sm mt-1">{errors.referralTime.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ المرضي / الفحص السريري (History / Clinical Findings)</label>
                  <textarea
                    {...register('history')}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.history && <p className="text-red-500 text-sm mt-1">{errors.history.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">سبب التحويل (Reason for Referral)</label>
                  <textarea
                    {...register('reason')}
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
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
