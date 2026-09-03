import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let whereClause: any = {};
    if (userId && userId !== 'all') {
      whereClause.id_pengguna = parseInt(userId, 10);
    }

    const courses = await prisma.mataKuliah.findMany({
      where: whereClause,
      include: {
        pengguna: { select: { id_pengguna: true, nama: true } },
        jadwal: true,
      },
      orderBy: { nama_mk: 'asc' },
    });

    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama_mk, id_pengguna, hari, waktu_mulai, waktu_selesai, ruangan } = body;

    if (!nama_mk || !id_pengguna || !hari || !waktu_mulai) {
      return NextResponse.json(
        { success: false, error: 'Nama mata kuliah, pengguna, hari, dan waktu mulai wajib diisi.' },
        { status: 400 }
      );
    }

    const newMK = await prisma.mataKuliah.create({
      data: {
        nama_mk,
        id_pengguna: parseInt(id_pengguna, 10),
        jadwal: {
          create: {
            hari,
            waktu_mulai,
            waktu_selesai: waktu_selesai || null,
            ruangan: ruangan || null,
          },
        },
      },
      include: {
        pengguna: { select: { id_pengguna: true, nama: true } },
        jadwal: true,
      },
    });

    return NextResponse.json({ success: true, data: newMK });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // id_mk

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID parameter required' }, { status: 400 });
    }

    await prisma.mataKuliah.delete({
      where: { id_mk: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true, message: 'Jadwal mata kuliah berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
