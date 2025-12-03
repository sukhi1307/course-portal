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
  const [registeredCourseIds, setRegisteredCourseIds] = useState<number[]>([]); // Store IDs of courses you own
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndFetchData = async () => {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      // 🛑 STRICT GATE: If not logged in, stop everything and go to Login
      if (!user) {
        router.push('/login');
        return; 
      }

      // If we are here, the user is logged in
      setUser(user);

      // 2. Fetch All Courses
      const { data: coursesData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .order('id');
      
      if (courseError) console.error(courseError);
      setCourses(coursesData || []);

      // 3. Fetch YOUR Registrations (To show the Tick Mark ✅)
      const { data: myRegs } = await supabase
        .from('registrations')
        .select('course_id')
        .eq('student_email', user.email);

      if (myRegs) {
        // Extract just the IDs (e.g., [1, 3])
        const myIds = myRegs.map((r: any) => r.course_id);
        setRegisteredCourseIds(myIds);
      }

      setLoading(false);
    };
    
    checkSessionAndFetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRegister = async (courseId: number, courseTitle: string) => {
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
      window.location.reload(); // Reload to update the Tick Mark
    } else {
      alert("❌ Error: " + result.error);
    }
  };

  // 🔍 SEARCH LOGIC
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🛑 RENDER GUARD: While loading, show spinner.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-indigo-600 font-semibold animate-pulse">Checking access...</div>
      </div>
    );
  }

  // 🛑 RENDER GUARD: If no user, show NOTHING (Redirect is happening)
  if (!user) {
    return null; 
  }

  // ✅ ONLY RENDER THIS IF USER IS LOGGED IN
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">🎓 KLE Technological University</h1>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:block">Hello, {user.email}</span>
            <button onClick={() => router.push('/my-dashboard')} className="text-sm font-semibold text-indigo-600 hover:underline">
              My Dashboard
            </button>
            <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-700">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Course Catalog</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Select your electives for the upcoming semester.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => {
            // ✅ CHECK: Is this course in my list of IDs?
            const isRegistered = registeredCourseIds.includes(course.id);

            return (
              <div key={course.id} className={`bg-white rounded-2xl shadow-lg overflow-hidden border transition-all ${isRegistered ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-100 hover:shadow-xl'}`}>
                
                {/* Image Section */}
                <div className="h-48 bg-gray-200 relative">
                  {course.image_url && <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />}
                  
                  {/* Badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${isRegistered ? 'bg-green-600 text-white' : 'bg-white/90 text-gray-700'}`}>
                    {isRegistered ? 'Registered ✅' : `${course.available_seats} Seats Left`}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 flex justify-between items-center">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm flex-grow">{course.description}</p>
                  
                  {/* BUTTON LOGIC */}
                  {isRegistered ? (
                    <button disabled className="w-full py-3 rounded-xl font-bold text-sm bg-green-50 text-green-700 border border-green-200 cursor-default">
                      ✅ Already Registered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(course.id, course.title)}
                      disabled={course.available_seats < 1}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors duration-200 
                        ${course.available_seats > 0 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      {course.available_seats > 0 ? 'Confirm Registration' : 'Class Full'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}