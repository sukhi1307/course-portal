import { supabase } from '@/app/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Get the data sent from the frontend
  const body = await request.json();
  const { course_id, student_name, student_email } = body;

  // 2. Check if the course exists and has seats left
  const { data: course, error: fetchError } = await supabase
    .from('courses')
    .select('available_seats')
    .eq('id', course_id)
    .single();

  if (fetchError || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (course.available_seats < 1) {
    return NextResponse.json({ error: 'Course is full!' }, { status: 400 });
  }

  // 3. Register the student (Existing Code)
  const { error: insertError } = await supabase
    .from('registrations')
    .insert([{ course_id, student_name, student_email }]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 4. (NEW STEP) Create an Attendance Record automatically
  // We give them a random attendance between 70% and 100% just for the demo effect!
  const randomAttendance = Math.floor(Math.random() * (100 - 70 + 1) + 70);
  
  await supabase
    .from('attendance')
    .insert([{ 
      course_id, 
      student_email, 
      percentage: randomAttendance 
    }]);

  // 5. Decrease seat count (Existing Code)
  await supabase
    .from('courses')
    .update({ available_seats: course.available_seats - 1 })
    .eq('id', course_id);

  return NextResponse.json({ success: true });
}