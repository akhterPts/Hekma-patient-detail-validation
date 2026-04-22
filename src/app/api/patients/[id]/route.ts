import { NextRequest, NextResponse } from 'next/server';
import { getPatient } from '@/lib/patient-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await getPatient(id);
    
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Detail error:', error);
    return NextResponse.json({ error: 'Failed to get patient detail' }, { status: 500 });
  }
}
