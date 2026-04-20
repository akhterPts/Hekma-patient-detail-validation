import { NextRequest, NextResponse } from 'next/server';
import { updatePatientComments } from '@/lib/patient-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const success = updatePatientComments(id, body);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update comments or patient not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'updated' });
  } catch (error) {
    console.error('Update comments error:', error);
    return NextResponse.json({ error: 'Failed to update comments' }, { status: 500 });
  }
}
