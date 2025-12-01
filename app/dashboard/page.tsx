'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabase';

export default function Dashboard() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      // We fetch the registration AND the course title connected to it
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          courses ( title )
        `)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching data:', error);
      else setRegistrations(data || []);
      
      setLoading(false);
    };

    fetchRegistrations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">📊 Admin Dashboard</h1>
          <a href="/" className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300">
            ← Back to Home
          </a>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course Selected</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Registered</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading data...</td></tr>
              ) : registrations.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No registrations yet.</td></tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{reg.student_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{reg.student_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-600 font-semibold">
                      {/* This handles the joined data from the course table */}
                      {reg.courses?.title || 'Unknown Course'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
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