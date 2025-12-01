'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabase';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  available_seats: number;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState(''); // New State for Search
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: coursesData } = await supabase.from('courses').select('*').order('id');
      if (coursesData) setCourses(coursesData);

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleRegister = async (courseId: number, courseTitle: string) => {
    if (!user) {
      alert("Please log in to register.");
      router.push('/login');
      return;
    }

    const confirm = window.confirm(`Register for ${courseTitle}?`);
    if (!confirm) return;

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ 
        course_id: courseId, 
        student_name: user.email, 
        student_email: user.email 
      }),
    });

    const result = await res.json();
    if (res.ok) {
      alert("✅ Registration Successful!");
      window.location.reload();
    } else {
      alert("❌ Error: " + result.error);
    }
  };

  // 🔍 THE SEARCH LOGIC
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">🎓 KLE Technological University</h1>
          
          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden md:block">Hello, {user.email}</span>
                <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-700">
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                Student Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Course Catalog</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Explore our curriculum and secure your future.
          </p>

          {/* 🔍 SEARCH BAR UI */}
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search for courses (e.g., Cyber, Cloud)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            <svg className="w-6 h-6 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading courses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* USE filteredCourses INSTEAD OF courses */}
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col hover:shadow-xl transition-all">
                  <div className="h-48 bg-gray-200 relative">
                    {course.image_url && <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />}
                    <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {course.available_seats} Seats Left
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm flex-grow">{course.description}</p>
                    
                    <button
                      onClick={() => handleRegister(course.id, course.title)}
                      disabled={course.available_seats < 1}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-200 
                        ${course.available_seats > 0 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      {course.available_seats > 0 ? (user ? 'Confirm Registration' : 'Login to Register') : 'Class Full'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-500">
                No courses found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}