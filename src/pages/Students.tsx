import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { apiFetch } from '../utils/api';
import { Plus, Search, Edit, X, Upload, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as XLSX from 'xlsx';

const studentSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  grade: z.string().min(1, 'الصف مطلوب'),
  phone: z.string().optional(),
  isSpecialCase: z.boolean().optional(),
  chronicCondition: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const fetchStudents = async () => {
    try {
      const data = await apiFetch('/api/students');
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          alert('الملف فارغ أو لا يحتوي على بيانات صالحة');
          return;
        }

        const firstRow = data[0] as Record<string, any>;
        const keys = Object.keys(firstRow);
        
        const nameKey = keys.find(k => k.includes('الاسم') || k.includes('اسم') || k.toLowerCase().includes('name'));
        const gradeKey = keys.find(k => k.includes('الصف') || k.includes('صف') || k.toLowerCase().includes('grade'));
        const phoneKey = keys.find(k => k.includes('رقم') || k.includes('هاتف') || k.includes('ولي') || k.toLowerCase().includes('phone'));

        if (!nameKey) {
          alert('لم يتم العثور على عمود "الاسم" في الملف. يرجى التأكد من وجود عمود باسم "الاسم".');
          return;
        }

        const studentsToImport = data.map((row: any) => ({
          name: row[nameKey] ? String(row[nameKey]).trim() : '',
          grade: gradeKey && row[gradeKey] ? String(row[gradeKey]).trim() : 'غير محدد',
          phone: phoneKey && row[phoneKey] ? String(row[phoneKey]).trim() : '',
        })).filter((s: any) => s.name);

        if (studentsToImport.length === 0) {
          alert('لا توجد بيانات لاستيرادها');
          return;
        }

        if (confirm(`سيتم استيراد ${studentsToImport.length} طالب. هل أنت متأكد؟`)) {
          const response = await apiFetch('/api/students/bulk', {
            method: 'POST',
            body: JSON.stringify(studentsToImport),
          });
          alert(`تم استيراد ${response.count} طالب بنجاح`);
          fetchStudents();
        }
      } catch (error) {
        console.error('Error parsing excel:', error);
        alert('حدث خطأ أثناء قراءة الملف');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const exportData = students.map(s => ({
      'الاسم': s.Name,
      'الصف': s.Grade,
      'رقم ولي الأمر': s.Phone || '',
      'حالة خاصة': s.IsSpecialCase ? 'نعم' : 'لا',
      'المرض المزمن': s.ChronicCondition || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "الطلاب.xlsx");
  };

  const filteredStudents = students.filter(student =>
    student.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.Grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: StudentForm) => {
    try {
      const url = editingStudent ? `/api/students/${editingStudent.Id}` : '/api/students';
      const method = editingStudent ? 'PUT' : 'POST';
      
      await apiFetch(url, {
        method,
        body: JSON.stringify(data),
      });

      setIsModalOpen(false);
      reset();
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setValue('name', student.Name);
    setValue('grade', student.Grade);
    setValue('phone', student.Phone);
    setValue('isSpecialCase', !!student.IsSpecialCase);
    setValue('chronicCondition', student.ChronicCondition);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    reset();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="بحث عن طالب..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Download size={20} />
            <span>تصدير Excel</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload size={20} />
            <span>استيراد Excel</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={20} />
            <span>إضافة طالب</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">الاسم</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">الصف</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">رقم الهاتف</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">حالة خاصة</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">مرض مزمن</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-600">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">جاري التحميل...</td></tr>
            ) : filteredStudents.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">لا يوجد طلاب</td></tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.Id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{student.Name}</td>
                  <td className="px-6 py-4">{student.Grade}</td>
                  <td className="px-6 py-4">{student.Phone || '-'}</td>
                  <td className="px-6 py-4">
                    {student.IsSpecialCase ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">نعم</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">لا</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{student.ChronicCondition || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => openEditModal(student)} className="text-blue-600 hover:text-blue-800">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {editingStudent ? 'تعديل بيانات طالب' : 'إضافة طالب جديد'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم</label>
                <input
                  {...register('name')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الصف</label>
                <input
                  {...register('grade')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {errors.grade && <p className="text-red-500 text-sm mt-1">{errors.grade.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  {...register('phone')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isSpecialCase')}
                  id="isSpecialCase"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isSpecialCase" className="text-sm font-medium text-slate-700">حالة خاصة</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">مرض مزمن</label>
                <input
                  {...register('chronicCondition')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
