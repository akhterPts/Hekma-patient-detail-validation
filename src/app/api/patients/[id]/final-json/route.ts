import { NextRequest, NextResponse } from 'next/server';
import { getFinalJson } from '@/lib/patient-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const finalJson = await getFinalJson(id);
    
    if (!finalJson) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(finalJson);
  } catch (error) {
    console.error('Final JSON error:', error);
    return NextResponse.json({ error: 'Failed to generate final JSON' }, { status: 500 });
  }
}
