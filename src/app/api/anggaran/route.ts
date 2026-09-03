import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    let budget = await prisma.anggaran.findFirst({
      where: { bulan: month },
    });

    if (!budget) {
      budget = await prisma.anggaran.create({
        data: {
          bulan: month,
          batas_nominal: 3500000,
        },
      });
    }

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { month, batas_nominal } = body;

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const amount = parseFloat(batas_nominal);

    const existing = await prisma.anggaran.findFirst({
      where: { bulan: targetMonth },
    });

    let budget;
    if (existing) {
      budget = await prisma.anggaran.update({
        where: { id_anggaran: existing.id_anggaran },
        data: { batas_nominal: amount },
      });
    } else {
      budget = await prisma.anggaran.create({
        data: {
          bulan: targetMonth,
          batas_nominal: amount,
        },
      });
    }

    return NextResponse.json({ success: true, data: budget });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
