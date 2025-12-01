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
      // 1. Get Logged In User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // 2. Fetch their attendance data linked to course names
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          percentage,
          courses ( title )
        `)
        .eq('student_email', user.email);

      // 3. Format data for the Chart
      if (attendanceData) {
        const chartData = attendanceData.map((item: any, index: number) => ({
          name: item.courses?.title || 'Course',
          uv: item.percentage, // The percentage value (0-100)
          fill: ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d'][index % 4], // Different colors
        }));
        setData(chartData);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Attendance Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.email}</p>
          </div>
          <button onClick={() => router.push('/')} className="text-indigo-600 font-semibold hover:underline">
            ← Back to Courses
          </button>
        </div>

        {/* The Chart Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left: The Visual Chart */}
          <div className="h-80 w-full relative">
             <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Attendance Overview</h3>
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
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ top: '50%', right: 0, transform: 'translate(0, -50%)', lineHeight: '24px' }} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            
            {/* Value Overlay */}
            <div className="absolute bottom-10 left-0 right-0 text-center text-sm text-gray-400">
               Based on Registered Courses
            </div>
          </div>

          {/* Right: The List Details */}
          <div className="space-y-4">
             {data.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-indigo-300 transition">
                 <div>
                   <h4 className="font-bold text-gray-800">{item.name}</h4>
                   <div className="text-xs text-gray-500">Status: {item.uv >= 75 ? 'On Track' : 'Risk'}</div>
                 </div>
                 <div className={`text-xl font-bold ${item.uv < 75 ? 'text-red-500' : 'text-green-600'}`}>
                   {item.uv}%
                 </div>
               </div>
             ))}
             {data.length === 0 && (
               <div className="text-center text-gray-500 py-10">
                 You haven't registered for any courses yet.
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}