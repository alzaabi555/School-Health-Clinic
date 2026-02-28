import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, FileText, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiFetch('/api/dashboard');
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">جاري التحميل...</div>;
  if (!data) return <div className="text-center py-10 text-red-500">فشل تحميل البيانات</div>;

  const stats = [
    { title: 'زيارات اليوم', value: data.visitsToday, icon: Activity, bg: 'bg-blue-100', text: 'text-blue-600' },
    { title: 'الحالات الخاصة', value: data.specialCases, icon: ClipboardList, bg: 'bg-purple-100', text: 'text-purple-600' },
    { title: 'المحولين اليوم', value: data.referralsToday, icon: FileText, bg: 'bg-orange-100', text: 'text-orange-600' },
    { title: 'إجمالي الطلاب', value: data.totalStudents, icon: Users, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data && stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.text}`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">إحصائيات الزيارات الأسبوعية</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="عدد الزيارات" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
