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

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          percentage,
          isa1,
          isa2,
          esa,
          courses ( title )
        `)
        .eq('student_email', user.email);

      if (attendanceData) {
        const chartData = attendanceData.map((item: any, index: number) => ({
          name: item.courses?.title || 'Course',
          // Data for Attendance Chart
          attendance: item.percentage,
          fill: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'][index % 4],
          // Data for Marks Bar Chart
          ISA1: item.isa1,
          ISA2: item.isa2,
          ESA: item.esa, 
        }));
        setData(chartData);
      }
    };
    fetchData();
  }, [router]);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left: Attendance (Radial Chart) */}
          <div className="h-96 border p-4 rounded-xl shadow-sm bg-slate-50">
             <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Attendance %</h3>
             <ResponsiveContainer width="100%" height="90%">
              <RadialBarChart 
                innerRadius="10%" 
                outerRadius="80%" 
                barSize={20} 
                data={data} 
                startAngle={180} 
                endAngle={0}
              >
                <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="attendance" />
                <Legend iconSize={10} verticalAlign="bottom" height={36}/>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Marks (Bar Chart) - NEW GRAPH! */}
          <div className="h-96 border p-4 rounded-xl shadow-sm bg-slate-50">
             <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Exam Marks Comparison</h3>
             
             {data.length > 0 ? (
               <ResponsiveContainer width="100%" height="90%">
                 <BarChart data={data}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                   <YAxis label={{ value: 'Marks', angle: -90, position: 'insideLeft' }} />
                   <Tooltip />
                   <Legend />
                   <Bar dataKey="ISA1" fill="#8884d8" name="ISA 1 (25)" />
                   <Bar dataKey="ISA2" fill="#82ca9d" name="ISA 2 (25)" />
                   <Bar dataKey="ESA" fill="#ffc658" name="ESA (100)" />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex items-center justify-center h-full text-gray-400">
                 No exam data available.
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}