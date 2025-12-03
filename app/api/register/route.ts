import { supabase } from '@/app/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { course_id, student_name, student_email } = body;

  // 1. Check if course exists and has seats
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

  // 2. Check if already registered
  const { data: existing } = await supabase
    .from('registrations')
    .select('id')
    .eq('course_id', course_id)
    .eq('student_email', student_email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'You are already registered for this course' }, { status: 400 });
  }

  // 3. Register the student
  const { error: insertError } = await supabase
    .from('registrations')
    .insert([{ course_id, student_name, student_email }]);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 4. (NEW) Generate Random Attendance AND Marks
  const randomAttendance = Math.floor(Math.random() * (100 - 70 + 1) + 70); // 70-100%
  const randomISA1 = Math.floor(Math.random() * (25 - 15 + 1) + 15);       // 15-25 Marks
  const randomISA2 = Math.floor(Math.random() * (25 - 15 + 1) + 15);       // 15-25 Marks
  const randomESA = Math.floor(Math.random() * (100 - 50 + 1) + 50);       // 50-100 Marks

  await supabase
    .from('attendance')
    .insert([{ 
      course_id, 
      student_email, 
      percentage: randomAttendance,
      isa1: randomISA1,
      isa2: randomISA2,
      esa: randomESA
    }]);

  // 5. Decrease Seat Count
  await supabase
    .from('courses')
    .update({ available_seats: course.available_seats - 1 })
    .eq('id', course_id);

  return NextResponse.json({ success: true });
}