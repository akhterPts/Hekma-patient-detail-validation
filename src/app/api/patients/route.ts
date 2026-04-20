import { NextResponse } from 'next/server';
import { getAllPatients } from '@/lib/patient-storage';

export async function GET() {
  try {
    const patients = getAllPatients();
    return NextResponse.json(patients);
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'Failed to list patients' }, { status: 500 });
  }
}
