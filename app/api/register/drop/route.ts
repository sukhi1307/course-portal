import { supabase } from '@/app/utils/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { course_id, student_email } = body;

  // 1. Delete the Registration
  const { error: deleteError } = await supabase
    .from('registrations')
    .delete()
    .eq('course_id', course_id)
    .eq('student_email', student_email);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 2. Delete the Attendance/Marks Record (Clean up)
  await supabase
    .from('attendance')
    .delete()
    .eq('course_id', course_id)
    .eq('student_email', student_email);

  // 3. Refund the Seat (+1 to available_seats)
  const { data: course } = await supabase
    .from('courses')
    .select('available_seats')
    .eq('id', course_id)
    .single();

  if (course) {
    await supabase
      .from('courses')
      .update({ available_seats: course.available_seats + 1 })
      .eq('id', course_id);
  }

  return NextResponse.json({ success: true });
}