// src/app/api/residents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db'; // すでに作ってあるDBクライアント

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const resident = await query({
      query: 'SELECT * FROM residents WHERE id = ?',
      values: [id],
    });

    if (!resident || resident.length === 0) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 });
    }

    return NextResponse.json(resident[0]);
  } catch (error) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

