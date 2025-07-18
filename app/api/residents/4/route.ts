// app/api/residents/[id]/route.ts

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 仮データ（あとでDBから取れるようにする）
  const resident = {
    id,
    name: "テスト住人",
    roomNumber: "305号",
    disabilityLevel: "2",
    groupHomeId: 1,
    moveInDate: null,
    moveOutDate: null,
    nameKana: "てすとじゅうにん",
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json(resident);
}

