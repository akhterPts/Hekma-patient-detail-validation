import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`https://gpt-api.hekma.ai/api/annotations/patients/${id}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
      }
      throw new Error(`External API responded with ${response.status}`);
    }

    const patient = await response.json();
    return NextResponse.json(patient);
  } catch (error: any) {
    console.error('Detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
