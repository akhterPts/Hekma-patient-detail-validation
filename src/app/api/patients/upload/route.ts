import { NextRequest, NextResponse } from 'next/server';
import { savePatient } from '@/lib/patient-storage';
import { PatientData } from '@/types/patient';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate that it's a patient dataset (basic check)
    if (!data.Patient_ID) {
      return NextResponse.json({ error: 'Invalid patient data: Missing Patient_ID' }, { status: 400 });
    }

    const patient: PatientData = {
      id: data.Patient_ID,
      data: data,
      comments: {
        Trials: []
      },
      has_review_requests: false,
      summary: data.Patient_Summary || data.summary || `Patient ${data.Patient_ID}`, // Use summary if provided, else fallback
    };

    savePatient(patient);

    return NextResponse.json({ id: patient.id });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
  }
}
