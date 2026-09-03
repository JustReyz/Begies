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

    const daysArray: string[] = Array.isArray(hari) ? hari : (hari ? [hari] : []);

    if (!nama_mk || !id_pengguna || daysArray.length === 0 || !waktu_mulai) {
      return NextResponse.json(
        { success: false, error: 'Nama mata kuliah, pengguna, minimal 1 hari, dan waktu mulai wajib diisi.' },
        { status: 400 }
      );
    }

    const newMK = await prisma.mataKuliah.create({
      data: {
        nama_mk,
        id_pengguna: parseInt(id_pengguna, 10),
        jadwal: {
          create: daysArray.map((d: string) => ({
            hari: d,
            waktu_mulai,
            waktu_selesai: waktu_selesai || null,
            ruangan: ruangan || null,
          })),
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id_mk, nama_mk, id_pengguna, hari, waktu_mulai, waktu_selesai, ruangan } = body;

    if (!id_mk || !nama_mk || !id_pengguna || !hari || !waktu_mulai) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap untuk memperbarui jadwal.' },
        { status: 400 }
      );
    }

    const daysArray: string[] = Array.isArray(hari) ? hari : [hari];
    const mkId = parseInt(id_mk, 10);

    // Update MK details and replace related Jadwal entries atomically
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update MataKuliah info
      await tx.mataKuliah.update({
        where: { id_mk: mkId },
        data: {
          nama_mk,
          id_pengguna: parseInt(id_pengguna, 10),
        },
      });

      // 2. Delete existing Jadwals for this MK
      await tx.jadwal.deleteMany({
        where: { id_mk: mkId },
      });

      // 3. Create updated Jadwal rows for each day
      await tx.jadwal.createMany({
        data: daysArray.map((d: string) => ({
          id_mk: mkId,
          hari: d,
          waktu_mulai,
          waktu_selesai: waktu_selesai || null,
          ruangan: ruangan || null,
        })),
      });

      return await tx.mataKuliah.findUnique({
        where: { id_mk: mkId },
        include: {
          pengguna: { select: { id_pengguna: true, nama: true } },
          jadwal: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: updated });
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
