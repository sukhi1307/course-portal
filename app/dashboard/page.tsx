'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabase';
import { useRouter } from 'next/navigation';
import { 
  RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

export default function MyDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch joined data (Attendance + Course Info)
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          course_id,
          percentage,
          isa1,
          isa2,
          esa,
          courses ( id, title, description )
        `)
        .eq('student_email', user.email);

      if (attendanceData) {
        const chartData = attendanceData.map((item: any, index: number) => ({
          courseId: item.courses?.id, // Need ID for dropping
          name: item.courses?.title || 'Course',
          description: item.courses?.description,
          attendance: item.percentage,
          fill: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'][index % 4],
          ISA1: item.isa1,
          ISA2: item.isa2,
          ESA: item.esa, 
        }));
        setData(chartData);
      }
    };
    fetchData();
  }, [router]);

  // HANDLE DROP COURSE
  const handleDrop = async (courseId: number, courseName: string) => {
    const confirm = window.confirm(`Are you sure you want to DROP ${courseName}?\n\nThis will remove your marks and refund your seat.`);
    if (!confirm) return;

    const res = await fetch('/api/drop', {
      method: 'POST',
      body: JSON.stringify({ 
        course_id: courseId, 
        student_email: user.email 
      }),
    });

    if (res.ok) {
      alert(`Successfully dropped ${courseName}.`);
      window.location.reload(); // Refresh to update charts
    } else {
      alert("Failed to drop course.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Student Performance</h1>
            <p className="text-gray-500">Academic Dashboard for {user?.email}</p>
          </div>
          <button onClick={() => router.push('/')} className="text-indigo-600 font-semibold hover:underline">
            ← Back to Courses
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Left: Attendance */}
          <div className="h-80 border p-4 rounded-xl shadow-sm bg-slate-50">
             <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Attendance %</h3>
             <ResponsiveContainer width="100%" height="90%">
              <RadialBarChart innerRadius="10%" outerRadius="80%" barSize={20} data={data} startAngle={180} endAngle={0}>
                <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="attendance" />
                <Legend iconSize={10} verticalAlign="bottom" height={36}/>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          {/* Right: Marks */}
          <div className="h-80 border p-4 rounded-xl shadow-sm bg-slate-50">
             <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Exam Marks</h3>
             <ResponsiveContainer width="100%" height="90%">
               <BarChart data={data}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="name" tick={{fontSize: 10}} />
                 <YAxis />
                 <Tooltip />
                 <Bar dataKey="ISA1" fill="#8884d8" name="ISA 1" />
                 <Bar dataKey="ISA2" fill="#82ca9d" name="ISA 2" />
                 <Bar dataKey="ESA" fill="#ffc658" name="ESA" />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* 🆕 COURSE MANAGEMENT TABLE (This is the part that was missing!) */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Manage Registrations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-bold text-gray-500 uppercase">Course</th>
                  <th className="py-3 px-6 text-left text-xs font-bold text-gray-500 uppercase">Marks (I1 / I2 / ESA)</th>
                  <th className="py-3 px-6 text-center text-xs font-bold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((course) => (
                  <tr key={course.courseId} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{course.name}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {course.ISA1} / {course.ISA2} / {course.ESA}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => handleDrop(course.courseId, course.name)}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-200 transition"
                      >
                        Drop Course 🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      You are not registered for any courses.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}