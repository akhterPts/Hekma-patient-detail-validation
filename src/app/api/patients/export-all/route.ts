import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://gpt-api.hekma.ai/api/annotations/patients/final-json/all', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Export all failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
