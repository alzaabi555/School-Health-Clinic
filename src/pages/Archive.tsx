import { useState } from 'react';
import { apiFetch } from '../utils/api';
import { Search, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function Archive() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('visits'); // visits, special-cases, referrals
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    studentName: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      // In a real app, we would pass query params to a dedicated search endpoint
      // For this demo, we'll fetch all and filter client-side or reuse existing endpoints
      let endpoint = '/api/visits';
      if (searchType === 'special-cases') endpoint = '/api/special-cases';
      if (searchType === 'referrals') endpoint = '/api/referrals';

      const data = await apiFetch(endpoint);
      
      let filtered = data;
      if (filters.studentName) {
        filtered = filtered.filter((item: any) => item.StudentName.includes(filters.studentName));
      }
      if (filters.startDate) {
        filtered = filtered.filter((item: any) => {
          const date = item.DateTime || item.FollowUpDate;
          return new Date(date) >= new Date(filters.startDate);
        });
      }
      if (filters.endDate) {
        filtered = filtered.filter((item: any) => {
          const date = item.DateTime || item.FollowUpDate;
          return new Date(date) <= new Date(filters.endDate);
        });
      }

      setResults(filtered);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Search size={20} className="text-emerald-600" />
          بحث متقدم
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">نوع السجل</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="visits">سجل المترددين</option>
              <option value="special-cases">الحالات الخاصة</option>
              <option value="referrals">المحولين</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب</label>
            <input
              type="text"
              value={filters.studentName}
              onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="اسم الطالب..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleSearch}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Search size={18} />
            بحث
          </button>
          <button className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Download size={18} />
            تصدير Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h4 className="font-semibold text-slate-700">نتائج البحث ({results.length})</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">الطالب</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">الصف</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">التفاصيل</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">المستخدم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">جاري البحث...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">لا توجد نتائج</td></tr>
              ) : (
                results.map((item: any) => (
                  <tr key={item.Id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      {format(new Date(item.DateTime || item.FollowUpDate), 'yyyy/MM/dd', { locale: ar })}
                    </td>
                    <td className="px-6 py-4 font-medium">{item.StudentName}</td>
                    <td className="px-6 py-4">{item.Grade}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {searchType === 'visits' && item.Diagnosis}
                      {searchType === 'special-cases' && item.FollowUpType}
                      {searchType === 'referrals' && item.Reason}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{item.CreatedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
