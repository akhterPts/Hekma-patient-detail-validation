import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`https://gpt-api.hekma.ai/api/annotations/patients/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`External API responded with ${response.status}`);
    }

    const updatedPatient = await response.json();
    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error('Update comments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
