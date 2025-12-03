'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabase';
import { useRouter } from 'next/navigation';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

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

      // Fetch attendance AND marks
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
          uv: item.percentage,
          fill: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'][index % 4],
          // Store marks in the data object too
          isa1: item.isa1,
          isa2: item.isa2,
          esa: item.esa
        }));
        setData(chartData);
      }
    };
    fetchData();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
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

        {/* Charts & Marks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Left: Attendance Chart */}
          <div className="h-96 relative border-r border-gray-100 pr-4">
             <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Attendance Tracker</h3>
             <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="10%" 
                outerRadius="80%" 
                barSize={20} 
                data={data} 
                startAngle={180} 
                endAngle={0}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  dataKey="uv"
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: '50%', right: 0, transform: 'translate(0, -50%)' }} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Marks Scorecard */}
          <div className="space-y-6 overflow-y-auto max-h-96 pr-2">
             <h3 className="text-xl font-bold text-gray-700 mb-4">Exam Results</h3>
             
             {data.length === 0 ? (
               <div className="text-gray-500 italic">No courses registered yet.</div>
             ) : (
               data.map((item, idx) => (
                 <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:shadow-md transition">
                   <div className="flex justify-between items-center mb-3">
                     <h4 className="font-bold text-lg text-indigo-700">{item.name}</h4>
                     <span className={`text-sm font-bold px-2 py-1 rounded ${item.uv < 75 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                       {item.uv}% Attendance
                     </span>
                   </div>
                   
                   {/* Marks Grid */}
                   <div className="grid grid-cols-3 gap-2 text-center">
                     <div className="bg-white p-2 rounded border">
                       <div className="text-xs text-gray-400 uppercase">ISA 1</div>
                       <div className="font-bold text-gray-800">{item.isa1}/25</div>
                     </div>
                     <div className="bg-white p-2 rounded border">
                       <div className="text-xs text-gray-400 uppercase">ISA 2</div>
                       <div className="font-bold text-gray-800">{item.isa2}/25</div>
                     </div>
                     <div className="bg-white p-2 rounded border bg-indigo-50 border-indigo-100">
                       <div className="text-xs text-indigo-400 uppercase">ESA</div>
                       <div className="font-bold text-indigo-700">{item.esa}/100</div>
                     </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}